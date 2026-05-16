const {
  callOpenAiWithWebSearch,
  parseJsonResponse,
  jsonResponse,
  errorResponse,
  handleOptions,
} = require("./utils/openai");
const {
  fetchGdacs,
  fetchUsgs,
  fetchReliefWeb,
} = require("./utils/feeds");
const {
  fetchRecentHelpRequests,
  fetchRecentNeeds,
} = require("./utils/supabaseAdmin");

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_KEY = "ai-news:v1";
const DISASTER_LEVELS = ["critical", "high", "medium", "low", "info"];
const ALLOWED_SOURCES = ["crisisiq", "gdacs", "usgs", "reliefweb", "web"];
const URGENCY_RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

/** Module-level cache. Netlify keeps warm instances alive for several minutes. */
const cache = new Map();

const SYSTEM_PROMPT = `You are CrisisIQ's news editor. You receive raw disaster data from two streams:
1. CrisisIQ submissions (private emergency requests from real people with GPS coordinates).
2. Official feeds (GDACS, USGS, ReliefWeb) listing live world hazards.

You may also call the web_search tool when an external hazard would benefit from a current news headline (recent casualty figures, evacuation orders, government response). Do not search for the CrisisIQ submissions; they are private.

Return ONLY a JSON object with this exact shape:
{
  "items": [
    {
      "id": "string (use the provided external_id; for web-search-only items use 'web-<slug>')",
      "source": "crisisiq | gdacs | usgs | reliefweb | web",
      "source_label": "Human-friendly source label (e.g. 'CrisisIQ submission', 'GDACS', 'USGS M5.4', 'Reuters via web search')",
      "source_url": "string | null",
      "title": "Short headline-style title (max ~80 chars)",
      "summary": "1-2 sentence neutral summary capturing what happened and the impact (max ~280 chars)",
      "disaster_level": "critical | high | medium | low | info",
      "disaster_type": "earthquake | flood | cyclone | wildfire | medical | rescue | shelter | food | other",
      "region": "City / country (short)",
      "lat": number | null,
      "lng": number | null,
      "occurred_at": "ISO 8601 timestamp",
      "affected_population": number | null
    }
  ]
}

Rules:
- One item per provided raw record (do not invent CrisisIQ items; keep their lat/lng exact).
- Disaster level for CrisisIQ items must reflect the urgency field (critical/high/medium/low).
- Disaster level for USGS items maps from magnitude: >=7 critical, 6.x high, 5.x medium, else low.
- Disaster level for GDACS items maps from the severity_hint provided.
- For ReliefWeb items, infer from disaster type and recency.
- You MAY add up to 2 extra "web" items if web_search reveals a major hazard not already in the list, but never duplicate existing items.
- Keep summaries factual. Do not speculate. Do not include marketing language.
- No markdown, no commentary outside the JSON object.`;

function nowIso() {
  return new Date().toISOString();
}

function urgencyTextToLevel(urgency) {
  if (urgency === "critical") return "critical";
  if (urgency === "high") return "high";
  if (urgency === "medium") return "medium";
  if (urgency === "low") return "low";
  return undefined;
}

function urgencyNumberToLevel(score) {
  if (typeof score !== "number") return undefined;
  if (score >= 5) return "critical";
  if (score >= 4) return "high";
  if (score === 3) return "medium";
  return "low";
}

function buildCrisisIqRaw(helpRequests, needs) {
  const out = [];
  for (const row of helpRequests) {
    out.push({
      source: "crisisiq",
      external_id: `help-${row.id}`,
      title: `${row.submitter_name} needs ${row.need_type}`,
      body: row.description,
      region: row.location_text,
      lat: row.lat,
      lng: row.lng,
      occurred_at: row.created_at,
      disaster_type: row.need_type,
      severity_hint: urgencyTextToLevel(row.urgency) || "medium",
    });
  }
  for (const row of needs) {
    out.push({
      source: "crisisiq",
      external_id: `need-${row.id}`,
      title: `${row.submitter_name} (${row.need_type}) — ${row.status}`,
      body: row.ai_brief || row.description,
      lat: row.lat,
      lng: row.lng,
      occurred_at: row.created_at,
      disaster_type: row.need_type,
      severity_hint:
        urgencyNumberToLevel(row.urgency_ai) ||
        urgencyNumberToLevel(row.urgency_self) ||
        "medium",
    });
  }
  return out;
}

function coerceItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const source = ALLOWED_SOURCES.includes(raw.source) ? raw.source : null;
  if (!source) return null;
  const id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : null;
  if (!id) return null;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  if (!title || !summary) return null;
  const level = DISASTER_LEVELS.includes(raw.disaster_level)
    ? raw.disaster_level
    : "info";
  const occurredAt =
    typeof raw.occurred_at === "string" && raw.occurred_at.length > 0
      ? raw.occurred_at
      : nowIso();
  const item = {
    id,
    source,
    source_label:
      typeof raw.source_label === "string" && raw.source_label.length > 0
        ? raw.source_label
        : source.toUpperCase(),
    title,
    summary,
    disaster_level: level,
    occurred_at: occurredAt,
  };
  if (typeof raw.source_url === "string" && raw.source_url.length > 0) {
    item.source_url = raw.source_url;
  }
  if (typeof raw.disaster_type === "string" && raw.disaster_type.length > 0) {
    item.disaster_type = raw.disaster_type;
  }
  if (typeof raw.region === "string" && raw.region.length > 0) {
    item.region = raw.region;
  }
  if (typeof raw.lat === "number" && Number.isFinite(raw.lat)) {
    item.lat = raw.lat;
  }
  if (typeof raw.lng === "number" && Number.isFinite(raw.lng)) {
    item.lng = raw.lng;
  }
  if (
    typeof raw.affected_population === "number" &&
    Number.isFinite(raw.affected_population)
  ) {
    item.affected_population = raw.affected_population;
  }
  return item;
}

function sortItems(items) {
  return items.sort((a, b) => {
    const rankDiff =
      (URGENCY_RANK[b.disaster_level] ?? 0) -
      (URGENCY_RANK[a.disaster_level] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    const at = Date.parse(a.occurred_at) || 0;
    const bt = Date.parse(b.occurred_at) || 0;
    return bt - at;
  });
}

function dedupeItems(items) {
  const seen = new Map();
  for (const item of items) {
    const key = item.id;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

async function gatherRawData() {
  const [helpRequests, needs, gdacs, usgs, reliefweb] = await Promise.all([
    fetchRecentHelpRequests({ limit: 12, windowHours: 48 }),
    fetchRecentNeeds({ limit: 12, windowHours: 48 }),
    fetchGdacs(12),
    fetchUsgs(12),
    fetchReliefWeb(8),
  ]);

  return {
    crisisiq: buildCrisisIqRaw(helpRequests, needs),
    external: [...gdacs, ...usgs, ...reliefweb],
  };
}

function buildUserPrompt(raw) {
  return [
    "Compose the unified news digest from the following raw items.",
    "",
    `CrisisIQ submissions (${raw.crisisiq.length}):`,
    JSON.stringify(raw.crisisiq, null, 0),
    "",
    `External hazard feeds (${raw.external.length}):`,
    JSON.stringify(raw.external, null, 0),
    "",
    "Return the JSON object now.",
  ].join("\n");
}

function buildFallbackItems(raw) {
  const items = [];
  for (const r of raw.crisisiq) {
    items.push({
      id: r.external_id,
      source: "crisisiq",
      source_label: "CrisisIQ submission",
      title: r.title,
      summary: r.body || "Local request received via CrisisIQ.",
      disaster_level: r.severity_hint || "medium",
      disaster_type: r.disaster_type,
      region: r.region,
      lat: r.lat,
      lng: r.lng,
      occurred_at: r.occurred_at || nowIso(),
    });
  }
  for (const r of raw.external) {
    items.push({
      id: r.external_id || `${r.source}-${r.title}`,
      source: r.source,
      source_label: r.source.toUpperCase(),
      title: r.title,
      summary: r.body || r.title,
      disaster_level: r.severity_hint || "info",
      disaster_type: r.disaster_type,
      region: r.region,
      lat: r.lat,
      lng: r.lng,
      occurred_at: r.occurred_at || nowIso(),
      source_url: r.url,
    });
  }
  return items;
}

async function generateDigest() {
  const raw = await gatherRawData();
  const generated_at = nowIso();
  const next_refresh_at = new Date(Date.now() + CACHE_TTL_MS).toISOString();

  // If we got literally nothing, return an empty payload so the UI can show
  // its empty state rather than spinning forever or charging an LLM call.
  if (raw.crisisiq.length === 0 && raw.external.length === 0) {
    return { items: [], generated_at, next_refresh_at };
  }

  const userPrompt = buildUserPrompt(raw);
  let items = [];

  try {
    const text = await callOpenAiWithWebSearch(SYSTEM_PROMPT, userPrompt, {
      json: true,
    });
    const parsed = parseJsonResponse(text);
    const candidates = Array.isArray(parsed?.items) ? parsed.items : [];
    for (const candidate of candidates) {
      const coerced = coerceItem(candidate);
      if (coerced) items.push(coerced);
    }
  } catch (err) {
    console.error("[ai-news] OpenAI call failed, falling back:", err.message);
  }

  // If OpenAI failed or returned no usable items, fall back to a hand-built
  // digest so the user always sees the raw data we collected.
  if (items.length === 0) {
    items = buildFallbackItems(raw);
  }

  items = sortItems(dedupeItems(items));

  return { items, generated_at, next_refresh_at };
}

function readCache() {
  const entry = cache.get(CACHE_KEY);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(CACHE_KEY);
    return null;
  }
  return entry.payload;
}

function writeCache(payload) {
  cache.set(CACHE_KEY, {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const force =
    event.queryStringParameters &&
    (event.queryStringParameters.force === "1" ||
      event.queryStringParameters.force === "true");

  if (!force) {
    const cached = readCache();
    if (cached) {
      return jsonResponse(200, cached);
    }
  }

  try {
    const payload = await generateDigest();
    writeCache(payload);
    return jsonResponse(200, payload);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
};
