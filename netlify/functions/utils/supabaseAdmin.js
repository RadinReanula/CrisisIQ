const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

/**
 * Server-side Supabase client. Uses the service role key when available,
 * otherwise falls back to the anon key (which works because `requests`,
 * `help_requests`, and `needs` all grant anon SELECT). NEVER expose
 * either key to the browser.
 */
function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable",
    );
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

/**
 * Returns up to `limit` recent help_requests inserted in the last
 * `windowHours` hours. Best-effort: a query failure resolves to [].
 */
async function fetchRecentHelpRequests({ limit = 15, windowHours = 48 } = {}) {
  try {
    const client = getSupabaseAdmin();
    const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
    const { data, error } = await client
      .from("help_requests")
      .select(
        "id, created_at, submitter_name, need_type, location_text, lat, lng, description, urgency",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Returns up to `limit` non-resolved needs from the last `windowHours` hours,
 * sorted by AI urgency when available else self-reported urgency desc.
 */
async function fetchRecentNeeds({ limit = 15, windowHours = 48 } = {}) {
  try {
    const client = getSupabaseAdmin();
    const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
    const { data, error } = await client
      .from("needs")
      .select(
        "id, created_at, submitter_name, need_type, lat, lng, description, urgency_self, urgency_ai, ai_brief, status",
      )
      .neq("status", "resolved")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Returns the public `requests` table rows — this is the canonical source
 * of all emergency submissions used by the live threat map and AI news.
 *
 * Options:
 *  - `limit`         max rows to return (default 60).
 *  - `windowHours`   only include rows newer than this many hours; pass
 *                    `null` to disable the time filter entirely.
 *  - `includeResolved` when false (default), `status === 'resolved'` rows
 *                    are excluded.
 */
async function fetchRecentRequests({
  limit = 60,
  windowHours = 72,
  includeResolved = false,
} = {}) {
  try {
    const client = getSupabaseAdmin();
    let query = client
      .from("requests")
      .select(
        "id, created_at, name, contact, need_type, location_text, lat, lng, description, urgency, status, event_id",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!includeResolved) {
      query = query.neq("status", "resolved");
    }
    if (typeof windowHours === "number" && Number.isFinite(windowHours)) {
      const since = new Date(
        Date.now() - windowHours * 3600 * 1000,
      ).toISOString();
      query = query.gte("created_at", since);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[fetchRecentRequests]", error.message);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[fetchRecentRequests] threw", err);
    return [];
  }
}

module.exports = {
  getSupabaseAdmin,
  fetchRecentHelpRequests,
  fetchRecentNeeds,
  fetchRecentRequests,
};
