/**
 * Server-side product analytics (PostHog) for Edge Functions.
 *
 * lesson_generated is captured here (not in the browser) so it can't be lost
 * to a closed tab or an ad blocker. We identify by the Supabase user id taken
 * from the request JWT — never email/name. Properties are metadata only.
 *
 * Secrets (Supabase Edge Function secrets):
 *   POSTHOG_KEY   — PostHog project token (phc_...)
 *   POSTHOG_HOST  — ingestion host (default https://us.i.posthog.com)
 */

const POSTHOG_KEY = Deno.env.get("POSTHOG_KEY");
const POSTHOG_HOST = Deno.env.get("POSTHOG_HOST") || "https://us.i.posthog.com";

/** Extract the Supabase user id (JWT `sub`) from the request's Authorization header. */
export function distinctIdFromRequest(req) {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "").trim();
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const payload = JSON.parse(atob(b64));
    return payload.sub || null;
  } catch {
    return null;
  }
}

/** Fire-and-forget capture. Never throws — analytics must not block generation. */
export async function capture(distinctId, event, properties = {}) {
  if (!POSTHOG_KEY || !distinctId) return;
  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: "plansk12-edge" },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // swallow — the teacher's lesson is what matters
  }
}

/**
 * lesson_generated — metadata only.
 * @param {Request} req
 * @param {{subject?: string, grades?: number[], type: string, durationMs: number}} meta
 */
export async function captureLessonGenerated(req, { subject, grades, type, durationMs }) {
  const distinctId = distinctIdFromRequest(req);
  await capture(distinctId, "lesson_generated", {
    subject: subject ?? null,
    grades: Array.isArray(grades) ? grades : [],
    type,
    duration_ms: durationMs,
  });
}
