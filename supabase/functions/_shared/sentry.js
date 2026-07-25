/**
 * Minimal Sentry error reporter for Edge Functions.
 *
 * Sends a single error event to Sentry's store endpoint via fetch — no SDK
 * dependency, no PII. Call reportError(err, { fn }) from a function's catch
 * block. Never throws.
 *
 * Secret (Supabase Edge Function secret):
 *   SENTRY_DSN — https://<publicKey>@<host>/<projectId>
 */

const DSN = Deno.env.get("SENTRY_DSN");

function parseDsn(dsn) {
  const m = /^https:\/\/([^@]+)@([^/]+)\/(.+)$/.exec(dsn || "");
  if (!m) return null;
  return { key: m[1], host: m[2], projectId: m[3] };
}

const parsed = parseDsn(DSN);

/**
 * @param {unknown} err
 * @param {{fn?: string, tags?: Record<string,string>, extra?: Record<string,unknown>}} [context]
 */
export async function reportError(err, context = {}) {
  if (!parsed) return;
  const { key, host, projectId } = parsed;
  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "node",
    level: "error",
    logger: "edge-function",
    server_name: context.fn || "edge-function",
    tags: { fn: context.fn ?? "unknown", ...(context.tags || {}) },
    environment: Deno.env.get("SENTRY_ENVIRONMENT") || "production",
    exception: {
      values: [
        {
          type: err?.name || "Error",
          value: String(err?.message ?? err),
        },
      ],
    },
    extra: context.extra || {},
  };
  try {
    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=plansk12-edge/1.0, sentry_key=${key}`,
      },
      body: JSON.stringify(event),
    });
  } catch {
    // swallow — reporting failures must not mask the original error
  }
}
