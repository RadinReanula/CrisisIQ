/**
 * Live hazard feeds. Each fetcher is best-effort: a network failure returns
 * an empty array so the AI news call can still proceed with whatever did
 * load. The returned shape is intentionally compact to keep prompt size small.
 *
 * RawHazard: {
 *   source: 'gdacs' | 'usgs' | 'reliefweb',
 *   external_id: string,
 *   title: string,
 *   body: string,        // 1-2 short sentences, used by the LLM as context
 *   url?: string,
 *   region?: string,
 *   occurred_at?: string,
 *   lat?: number,
 *   lng?: number,
 *   magnitude?: number,
 *   disaster_type?: string,
 *   severity_hint?: 'critical' | 'high' | 'medium' | 'low' | 'info',
 * }
 */

const FETCH_TIMEOUT_MS = 6000;

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: {
        "User-Agent": "CrisisIQ/1.0 (+https://crisisiq.netlify.app)",
        ...(opts.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function pickFirstString(...values) {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function trimText(text, max = 320) {
  if (typeof text !== "string") return "";
  const stripped = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > max ? `${stripped.slice(0, max - 1)}…` : stripped;
}

/* -------------------------------------------------------------------------- */
/* GDACS                                                                       */
/* -------------------------------------------------------------------------- */

function severityFromGdacsAlertLevel(level) {
  switch ((level || "").toLowerCase()) {
    case "red":
      return "critical";
    case "orange":
      return "high";
    case "green":
      return "medium";
    default:
      return "info";
  }
}

function disasterTypeFromGdacsEventType(eventType) {
  const map = {
    EQ: "earthquake",
    TC: "tropical cyclone",
    FL: "flood",
    VO: "volcano",
    DR: "drought",
    WF: "wildfire",
    TS: "tsunami",
  };
  return map[(eventType || "").toUpperCase()] || undefined;
}

function extractTagText(xml, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = xml.match(re);
  if (!m) return undefined;
  const inner = m[1];
  const cdata = inner.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (cdata ? cdata[1] : inner).trim();
}

function extractGdacsItems(xml) {
  const items = [];
  const re = /<item[\s>][\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    items.push(m[0]);
  }
  return items;
}

async function fetchGdacs(limit = 12) {
  try {
    const res = await fetchWithTimeout("https://www.gdacs.org/xml/rss.xml");
    if (!res.ok) return [];
    const xml = await res.text();
    const items = extractGdacsItems(xml).slice(0, limit);
    const out = [];
    for (const raw of items) {
      const title = extractTagText(raw, "title");
      const description = extractTagText(raw, "description");
      const link = extractTagText(raw, "link");
      const pubDate = extractTagText(raw, "pubDate");
      const guid = extractTagText(raw, "guid");
      const alertLevel =
        extractTagText(raw, "gdacs:alertlevel") ||
        extractTagText(raw, "gdacs:alertLevel");
      const eventType = extractTagText(raw, "gdacs:eventtype");
      const country = extractTagText(raw, "gdacs:country");
      const lat = parseFloat(
        extractTagText(raw, "geo:Point") ? "" : extractTagText(raw, "geo:lat"),
      );
      const lng = parseFloat(extractTagText(raw, "geo:long"));
      if (!title) continue;
      out.push({
        source: "gdacs",
        external_id: pickFirstString(guid, link, title),
        title: trimText(title, 140),
        body: trimText(description || title, 320),
        url: link,
        region: country,
        occurred_at: pubDate ? new Date(pubDate).toISOString() : undefined,
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        disaster_type: disasterTypeFromGdacsEventType(eventType),
        severity_hint: severityFromGdacsAlertLevel(alertLevel),
      });
    }
    return out;
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* USGS earthquakes (M4.5+ past day)                                          */
/* -------------------------------------------------------------------------- */

function severityFromMagnitude(mag) {
  if (mag >= 7) return "critical";
  if (mag >= 6) return "high";
  if (mag >= 5) return "medium";
  return "low";
}

async function fetchUsgs(limit = 15) {
  try {
    const res = await fetchWithTimeout(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
    );
    if (!res.ok) return [];
    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    const sorted = features
      .filter((f) => typeof f?.properties?.mag === "number")
      .sort((a, b) => (b.properties.mag || 0) - (a.properties.mag || 0))
      .slice(0, limit);

    return sorted.map((f) => {
      const props = f.properties || {};
      const coords = f.geometry?.coordinates || [];
      const mag = Number(props.mag);
      const occurred = typeof props.time === "number"
        ? new Date(props.time).toISOString()
        : undefined;
      return {
        source: "usgs",
        external_id: pickFirstString(f.id, props.code, props.url) || String(props.time || ""),
        title: `M${mag.toFixed(1)} earthquake — ${props.place || "unknown location"}`,
        body: trimText(
          `Magnitude ${mag.toFixed(1)} earthquake at ${props.place || "unknown location"}.${
            props.tsunami ? " Tsunami flag raised by sensor network." : ""
          }`,
          280,
        ),
        url: props.url,
        region: props.place,
        occurred_at: occurred,
        lat: Number.isFinite(coords[1]) ? coords[1] : undefined,
        lng: Number.isFinite(coords[0]) ? coords[0] : undefined,
        magnitude: mag,
        disaster_type: "earthquake",
        severity_hint: severityFromMagnitude(mag),
      };
    });
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* ReliefWeb (ongoing disasters)                                              */
/* -------------------------------------------------------------------------- */

async function fetchReliefWeb(limit = 10) {
  try {
    const url =
      "https://api.reliefweb.int/v1/disasters?appname=crisisiq" +
      "&filter[field]=status&filter[value]=ongoing" +
      `&limit=${limit}&sort[]=date.created:desc&profile=list`;
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const records = Array.isArray(data?.data) ? data.data : [];

    return records.map((r) => {
      const fields = r.fields || {};
      const country = Array.isArray(fields.country) && fields.country[0]?.name;
      const types = Array.isArray(fields.type)
        ? fields.type.map((t) => t.name).filter(Boolean).join(", ")
        : undefined;
      const occurred = pickFirstString(
        fields.date?.created,
        fields.date?.changed,
      );
      return {
        source: "reliefweb",
        external_id: String(r.id),
        title: trimText(fields.name || "Ongoing disaster", 140),
        body: trimText(
          [
            country && `Country: ${country}.`,
            types && `Type: ${types}.`,
            fields.description,
          ]
            .filter(Boolean)
            .join(" "),
          320,
        ),
        url: fields.url,
        region: country || undefined,
        occurred_at: occurred ? new Date(occurred).toISOString() : undefined,
        disaster_type: types ? types.split(",")[0].trim().toLowerCase() : undefined,
        severity_hint: "high",
      };
    });
  } catch {
    return [];
  }
}

module.exports = {
  fetchGdacs,
  fetchUsgs,
  fetchReliefWeb,
};
