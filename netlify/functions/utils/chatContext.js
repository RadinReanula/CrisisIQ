const {
  fetchRecentRequests,
  getSupabaseAdmin,
} = require("./supabaseAdmin");

const SNAPSHOT_TTL_MS = 30_000;

let cachedSnapshot = null;
let cachedSnapshotAt = 0;
let cachedSnapshotKey = "";

function shortenDescription(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 137)}...`;
}

function coarseLocation(row) {
  if (typeof row.location_text === "string" && row.location_text.trim()) {
    return row.location_text.trim();
  }
  if (typeof row.lat === "number" && typeof row.lng === "number") {
    // Round to ~11km buckets so OpenAI never sees a precise pin.
    const lat = Math.round(row.lat * 10) / 10;
    const lng = Math.round(row.lng * 10) / 10;
    return `near ${lat.toFixed(1)}, ${lng.toFixed(1)}`;
  }
  return "unknown area";
}

function summariseRows(rows) {
  const summary = {
    total_active: 0,
    by_urgency: { critical: 0, high: 0, medium: 0, low: 0 },
    by_status: { pending: 0, assigned: 0, in_progress: 0 },
    by_need_type: {},
    recent: [],
  };

  for (const row of rows) {
    if (!row || row.status === "resolved") continue;
    summary.total_active += 1;

    const urgency = typeof row.urgency === "string" ? row.urgency : null;
    if (urgency && summary.by_urgency[urgency] !== undefined) {
      summary.by_urgency[urgency] += 1;
    }

    const status = typeof row.status === "string" ? row.status : null;
    if (status && summary.by_status[status] !== undefined) {
      summary.by_status[status] += 1;
    }

    const needType = typeof row.need_type === "string" ? row.need_type : null;
    if (needType) {
      summary.by_need_type[needType] =
        (summary.by_need_type[needType] || 0) + 1;
    }
  }

  summary.recent = rows
    .filter((row) => row && row.status !== "resolved")
    .slice(0, 5)
    .map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      need_type: row.need_type || "other",
      urgency: row.urgency || "medium",
      status: row.status || "pending",
      area: coarseLocation(row),
      created_at: row.created_at,
      short_description: shortenDescription(row.description),
    }));

  return summary;
}

/**
 * Returns a PII-stripped aggregate snapshot of the `requests` table for
 * use as context in the AI chat system prompt. Cached in-memory for
 * SNAPSHOT_TTL_MS to avoid hammering Supabase on every chat turn.
 *
 * @param {string} [eventId] Optional event id to scope the aggregate.
 */
async function getLiveSnapshot(eventId) {
  const key = eventId || "all";
  const now = Date.now();
  if (
    cachedSnapshot &&
    cachedSnapshotKey === key &&
    now - cachedSnapshotAt < SNAPSHOT_TTL_MS
  ) {
    return cachedSnapshot;
  }

  let rows = await fetchRecentRequests({ limit: 100, windowHours: 72 });

  if (eventId) {
    rows = rows.filter((row) => row && row.event_id === eventId);
  }

  const snapshot = summariseRows(rows);
  cachedSnapshot = snapshot;
  cachedSnapshotAt = now;
  cachedSnapshotKey = key;
  return snapshot;
}

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Looks up a single public-safe request row by id. Strips PII fields the
 * model has no need to see (name, contact, exact coordinates).
 *
 * @param {string} requestId
 */
async function getRequestDetails(requestId) {
  if (typeof requestId !== "string" || !UUID_RE.test(requestId)) {
    return null;
  }
  try {
    const client = getSupabaseAdmin();
    const { data, error } = await client
      .from("requests")
      .select(
        "id, created_at, need_type, location_text, lat, lng, description, urgency, status",
      )
      .eq("id", requestId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      created_at: data.created_at,
      need_type: data.need_type,
      urgency: data.urgency,
      status: data.status,
      area: coarseLocation(data),
      short_description: shortenDescription(data.description),
    };
  } catch {
    return null;
  }
}

module.exports = {
  getLiveSnapshot,
  getRequestDetails,
};
