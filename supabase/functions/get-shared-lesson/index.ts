import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Mirror of trialService.js: an account is "paid" (full access) when it's an
// owner/admin, or its Stripe status is active/past_due (past_due = grace).
const PAID_STATUSES = new Set(["active", "past_due"]);

// Ordered lesson-flow sections + labels by subject, mirroring the client
// renderers (PlanBookRenderer / CtePlanRenderer / AdaptivePERenderer). The
// first entry is shown in full in the gated preview; the rest are teased.
function sectionsFor(lo: any): Array<[string, any]> {
  const subject = lo?.subject;
  if (subject === "Adaptive PE") {
    return [
      ["Warm-Up", lo?.warm_up],
      ["Skill Practice", lo?.skill_practice],
      ["Applied Activity", lo?.applied_activity],
      ["Cool-Down", lo?.cool_down],
    ];
  }
  if (subject === "CTE") {
    return [
      ["Opening", lo?.warm_up],
      ["Core Instruction", lo?.whole_group_instruction],
      ["Guided Practice", lo?.fitness_activities],
      ["Independent Practice", lo?.independent_practice],
      ["Closure", lo?.closure],
    ];
  }
  return [
    ["Warm Up", lo?.warm_up],
    ["Fitness Activities", lo?.fitness_activities],
    ["Whole Group Instruction", lo?.whole_group_instruction],
    ["Independent Practice", lo?.independent_practice],
    ["Closure", lo?.closure],
  ];
}

// A short single-line teaser of a locked section — just enough to prove the
// section exists and has substance. The full body is never sent.
function teaser(text: any, max = 160): string {
  if (!text) return "";
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + "…";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { token } = body ?? {};
  if (!token) return errorResponse("token is required", 400);

  try {
    // Service role bypasses RLS — this is intentional for the public share feature.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: share, error } = await supabase
      .from("shared_lessons")
      .select("id, view_count, expires_at, lesson_id, lessons(lesson_object, title, subject, grade_bands)")
      .eq("share_token", token)
      .single();

    if (error || !share) return errorResponse("Shared lesson not found", 404);

    // Enforce link expiry (default 30 days from creation, see migration 0025).
    if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
      return errorResponse("This shared link has expired", 410);
    }

    // Increment view count (fire-and-forget, ignore failure)
    supabase
      .from("shared_lessons")
      .update({ view_count: (share.view_count ?? 0) + 1 })
      .eq("id", share.id)
      .then(() => {});

    const lesson = share.lessons as any;
    const lessonObject = lesson?.lesson_object ?? {};
    const nextViewCount = (share.view_count ?? 0) + 1;

    // Who is viewing? Anonymous callers send the anon key (no user); logged-in
    // callers send their own access token. Only a *paid* subscriber gets the
    // full lesson — everyone else (anonymous / trial / expired) is soft-gated.
    let viewerIsPaid = false;
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (jwt) {
      const { data: userData } = await supabase.auth.getUser(jwt);
      const userId = userData?.user?.id;
      if (userId) {
        // Select * (not named columns): mirrors trialService.getProfile and
        // stays robust if subscription_status isn't a profiles column yet
        // (Stripe status sync is pending) — a missing field reads as undefined
        // rather than erroring the query.
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        viewerIsPaid =
          (profile as any)?.is_owner === true ||
          PAID_STATUSES.has((profile as any)?.subscription_status ?? "");
      }
    }

    // Paid subscribers (the sharer and their colleagues) see the full lesson.
    if (viewerIsPaid) {
      return jsonResponse({
        gated: false,
        lesson_object: lessonObject,
        title: lesson?.title ?? "",
        subject: lesson?.subject ?? "",
        grade_bands: lesson?.grade_bands ?? [],
        view_count: nextViewCount,
      });
    }

    // Soft-gated preview: objective, standards, success criteria, and the first
    // section in full to demonstrate quality; remaining sections as short
    // teasers only. The full section bodies are intentionally NOT included.
    const flow = sectionsFor(lessonObject).filter(([, txt]) => txt);
    const sections = flow.map(([label, txt], i) =>
      i === 0
        ? { label, body: String(txt), locked: false }
        : { label, body: teaser(txt), locked: true }
    );

    return jsonResponse({
      gated: true,
      title: lesson?.title ?? "",
      subject: lesson?.subject ?? "",
      grade_bands: lesson?.grade_bands ?? [],
      learning_targets: lessonObject?.learning_targets ?? {},
      success_criteria: lessonObject?.success_criteria ?? {},
      standards: lessonObject?.standards ?? [],
      sections,
      view_count: nextViewCount,
    });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
