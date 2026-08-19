/**
 * Edge Function: generate-pptx
 *
 * PAID-ONLY export. Builds a clean, brand-aligned PowerPoint (.pptx) deck from a
 * structured slide spec the client sends (title + content slides, each with a
 * bullet hierarchy and full speaker notes). The client decides WHICH sections a
 * given lesson has and how to chunk them; this function owns the ONE visual
 * template (PlansK12 accent blue, clean typography, generous white space).
 *
 * Gating is enforced SERVER-SIDE, identical to generate-docx: the caller's
 * profile must be a paid subscriber (is_owner, or subscription_status
 * active/past_due) — a trial user gets 403 and never receives the file.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, errorResponse } from "../_shared/cors.js";
import pptxgen from "https://esm.sh/pptxgenjs@3.12.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// ── Brand palette (hex without '#', as pptxgenjs expects) ────────────────────
const BLUE = "4F7FFA"; // PlansK12 accent blue (brand-500)
const BLUE_DARK = "3B6DE8"; // brand-600
const INK = "1F2937"; // primary body text
const INK_SOFT = "4B5563"; // secondary / sub-bullets
const MUTE = "9CA3AF"; // footer / page numbers
const LIGHT = "E6EEFF"; // subtitle on blue
const FONT = "Arial"; // clean, universally available

interface Bullet { text: string; level?: number }
interface SlideSpec { heading?: string; bullets?: Bullet[]; notes?: string }

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

  // ── Server-side paid gate (same logic as generate-docx / export-cap RPC) ────
  const { data: prof } = await supabase
    .from("profiles")
    .select("is_owner, subscription_status")
    .eq("id", userData.user.id)
    .single();
  const paid = prof?.is_owner === true ||
    ["active", "past_due"].includes(prof?.subscription_status ?? "");
  if (!paid) {
    return errorResponse(
      "PowerPoint (.pptx) export is a paid feature. Upgrade to download presentation-ready slides.",
      403,
    );
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { filename, title, subtitle, meta, slides } = body ?? {};
  if (!Array.isArray(slides)) return errorResponse("slides array is required", 400);

  try {
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in, 16:9
    pptx.author = "PlansK12";
    pptx.company = "PlansK12";
    const W = 13.333;
    const H = 7.5;

    // ── Title slide — full-bleed brand blue, generous white space ─────────────
    const cover = pptx.addSlide();
    cover.background = { color: BLUE };
    // subtle darker accent strip along the bottom
    cover.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.5, w: W, h: 0.5, fill: { color: BLUE_DARK } });
    cover.addText(String(title || "Lesson"), {
      x: 0.85, y: 2.3, w: W - 1.7, h: 2.0,
      fontFace: FONT, fontSize: 40, bold: true, color: "FFFFFF",
      align: "left", valign: "middle",
    });
    const metaLine = Array.isArray(meta) ? meta.filter(Boolean).join("   ·   ") : "";
    if (metaLine) {
      cover.addText(metaLine, {
        x: 0.9, y: 4.45, w: W - 1.8, h: 0.5,
        fontFace: FONT, fontSize: 18, color: LIGHT, align: "left",
      });
    }
    if (subtitle) {
      cover.addText(String(subtitle), {
        x: 0.9, y: 4.95, w: W - 1.8, h: 0.5,
        fontFace: FONT, fontSize: 16, italic: true, color: LIGHT, align: "left",
      });
    }
    cover.addText("PlansK12", {
      x: 0.85, y: H - 0.5, w: 4, h: 0.5,
      fontFace: FONT, fontSize: 12, bold: true, color: "FFFFFF", valign: "middle", align: "left",
    });

    // ── Content slides — white, blue header band, clean bullet hierarchy ──────
    (slides as SlideSpec[]).forEach((s, i) => {
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };
      // top brand-blue header band
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 1.0, fill: { color: BLUE } });
      slide.addText(String(s.heading || ""), {
        x: 0.7, y: 0, w: W - 1.4, h: 1.0,
        fontFace: FONT, fontSize: 24, bold: true, color: "FFFFFF", valign: "middle", align: "left",
      });

      const bullets = Array.isArray(s.bullets) ? s.bullets : [];
      if (bullets.length) {
        const runs = bullets.map((bl) => {
          const level = bl.level === 1 ? 1 : 0;
          return {
            text: String(bl.text ?? ""),
            options: {
              bullet: { characterCode: level === 1 ? "2013" : "2022", indent: 18 },
              indentLevel: level,
              fontFace: FONT,
              fontSize: level === 1 ? 15 : 18,
              color: level === 1 ? INK_SOFT : INK,
              bold: false,
              paraSpaceAfter: level === 1 ? 6 : 10,
              breakLine: true,
              align: "left",
            },
          };
        });
        slide.addText(runs, {
          x: 0.75, y: 1.4, w: W - 1.5, h: H - 2.1,
          valign: "top", align: "left",
        });
      }

      // full guidance in presenter notes
      if (s.notes && String(s.notes).trim()) slide.addNotes(String(s.notes));

      // footer: brand · title (left), page number (right)
      slide.addText(`PlansK12  ·  ${String(title || "Lesson")}`.slice(0, 90), {
        x: 0.7, y: H - 0.45, w: W - 2.2, h: 0.35,
        fontFace: FONT, fontSize: 10, color: MUTE, valign: "middle", align: "left",
      });
      slide.addText(String(i + 1), {
        x: W - 1.4, y: H - 0.45, w: 0.7, h: 0.35,
        fontFace: FONT, fontSize: 10, color: MUTE, valign: "middle", align: "right",
      });
    });

    const b64 = (await pptx.write({ outputType: "base64" })) as string;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const safe = (String(filename || "lesson").replace(/[^a-z0-9._-]+/gi, "-")) || "lesson";

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safe}.pptx"`,
      },
    });
  } catch (err) {
    return errorResponse(`pptx build failed: ${(err as Error)?.message ?? String(err)}`, 500);
  }
});
