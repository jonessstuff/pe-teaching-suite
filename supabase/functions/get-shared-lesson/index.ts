import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
      .select("id, view_count, lesson_id, lessons(lesson_object, title, subject, grade_bands)")
      .eq("share_token", token)
      .single();

    if (error || !share) return errorResponse("Shared lesson not found", 404);

    // Increment view count (fire-and-forget, ignore failure)
    supabase
      .from("shared_lessons")
      .update({ view_count: (share.view_count ?? 0) + 1 })
      .eq("id", share.id)
      .then(() => {});

    const lesson = share.lessons as any;
    return jsonResponse({
      lesson_object: lesson?.lesson_object ?? {},
      title: lesson?.title ?? '',
      subject: lesson?.subject ?? '',
      grade_bands: lesson?.grade_bands ?? [],
      view_count: (share.view_count ?? 0) + 1,
    });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
