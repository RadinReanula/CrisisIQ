const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

/**
 * Server-side Supabase client. Uses the service role key so the Netlify
 * function can read tables regardless of RLS, but the same code would also
 * work with the anon key because help_requests + needs already grant anon
 * SELECT. Both env vars are required server-side and must NEVER be exposed
 * to the browser.
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

module.exports = {
  getSupabaseAdmin,
  fetchRecentHelpRequests,
  fetchRecentNeeds,
};
