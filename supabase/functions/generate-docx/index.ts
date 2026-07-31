/**
 * Edge Function: generate-docx
 *
 * PAID-ONLY export. Builds a clean, heading-structured Word (.docx) document
 * from a normalized block list the client sends (headings / paragraphs /
 * bullets). Gating is enforced SERVER-SIDE: the caller's profile must be a paid
 * subscriber (is_owner, or subscription_status active/past_due) — a trial user
 * gets 403 and never receives an editable, watermark-free file.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, errorResponse } from "../_shared/cors.js";
import { Document, Packer, Paragraph, HeadingLevel, PageBreak } from "https://esm.sh/docx@8.5.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return errorResponse("Not authenticated", 401);

  // ── Server-side paid gate ──────────────────────────────────────────────────
  const { data: prof } = await supabase
    .from("profiles")
    .select("is_owner, subscription_status")
    .eq("id", userData.user.id)
    .single();
  const paid = prof?.is_owner === true ||
    ["active", "past_due"].includes(prof?.subscription_status ?? "");
  if (!paid) {
    return errorResponse(
      "Word (.docx) export is a paid feature. Upgrade to download editable documents.",
      403,
    );
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { filename, title, blocks } = body ?? {};
  if (!Array.isArray(blocks)) return errorResponse("blocks array is required", 400);

  const children: Paragraph[] = [];
  if (title) children.push(new Paragraph({ text: String(title), heading: HeadingLevel.TITLE }));
  for (const b of blocks as Array<{ style?: string; text?: string }>) {
    const text = String(b?.text ?? "");
    switch (b?.style) {
      case "h1": children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1 })); break;
      case "h2": children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 })); break;
      case "h3": children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 })); break;
      case "bullet": children.push(new Paragraph({ text, bullet: { level: 0 } })); break;
      case "pagebreak": children.push(new Paragraph({ children: [new PageBreak()] })); break;
      case "spacer": children.push(new Paragraph({ text: "" })); break;
      default: children.push(new Paragraph({ text }));
    }
  }

  const doc = new Document({
    creator: "PlansK12",
    sections: [{ children }],
  });

  // toBase64String is env-portable (no Node Buffer needed); decode to bytes.
  const b64 = await Packer.toBase64String(doc);
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const safe = (String(filename || "lesson").replace(/[^a-z0-9._-]+/gi, "-")) || "lesson";

  return new Response(bytes, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safe}.docx"`,
    },
  });
});
