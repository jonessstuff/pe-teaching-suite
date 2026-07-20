import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildIncidentReportPrompt } from "../_shared/incidentReportPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { dateTime, location, studentName, incidentDescription, witnesses, actionsTaken, followUpNeeded, subject } = body ?? {};
  if (!incidentDescription?.trim()) return errorResponse("incidentDescription is required", 400);

  try {
    const { system, user } = buildIncidentReportPrompt({
      dateTime, location, studentName, incidentDescription,
      witnesses, actionsTaken, followUpNeeded, subject,
    });
    const result = await callClaudeForJson(system, user, 6000);

    if (typeof result?.incident_report !== 'string') return errorResponse("Model response missing incident_report", 500);
    return jsonResponse({ incident_report: result.incident_report });
  } catch (err) {
    console.error(err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
