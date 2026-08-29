import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.177.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey);

function monthlyAmount(sub: Stripe.Subscription) {
  return sub.items.data.reduce((sum, item) => {
    const amount = (item.price.unit_amount ?? 0) * (item.quantity ?? 1);
    return sum + (item.price.recurring?.interval === "year" ? amount / 12 : amount);
  }, 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  const client = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return errorResponse("Unauthorized", 401);
  const { data: profile } = await admin.from("profiles").select("is_owner").eq("id", userData.user.id).maybeSingle();
  if (profile?.is_owner !== true) return errorResponse("Owner access required", 403);

  try {
    const subscriptions: Stripe.Subscription[] = [];
    let startingAfter: string | undefined;
    for (let page = 0; page < 20; page++) {
      const result = await stripe.subscriptions.list({ status: "all", limit: 100, starting_after: startingAfter });
      subscriptions.push(...result.data);
      if (!result.has_more) break;
      startingAfter = result.data.at(-1)?.id;
    }
    const current = subscriptions.filter((s) => ["active", "trialing", "past_due"].includes(s.status));
    const active = current.filter((s) => s.status === "active" || s.status === "past_due");
    const trialing = current.filter((s) => s.status === "trialing");
    const scheduledCancel = current.filter((s) => s.cancel_at_period_end);
    const canceled = subscriptions.filter((s) => s.status === "canceled");
    const thirtyDaysAgoSeconds = Math.floor((Date.now() - 30 * 86400000) / 1000);
    const canceled30d = canceled.filter((s) => (s.canceled_at ?? 0) >= thirtyDaysAgoSeconds);
    const mrrCents = active.reduce((sum, sub) => sum + monthlyAmount(sub), 0);

    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [{ data: events }, { data: profiles }, { count: lessonCount }, { count: recentLessons }, { data: feedback }] = await Promise.all([
      admin.from("conversion_events").select("event_name, section, placement, created_at").gte("created_at", since),
      admin.from("profiles").select("id, created_at, subscription_status, is_owner"),
      admin.from("lessons").select("id", { count: "exact", head: true }),
      admin.from("lessons").select("id", { count: "exact", head: true }).gte("created_at", since),
      admin.from("cancellation_feedback").select("reason, detail, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    const eventCount = (name: string) => (events ?? []).filter((e) => e.event_name === name).length;
    const sections = Object.fromEntries(["today", "teach", "progress"].map((key) => [key, (events ?? []).filter((e) => e.event_name === "demo_section_viewed" && e.section === key).length]));
    const reasons: Record<string, number> = {};
    for (const row of feedback ?? []) reasons[row.reason] = (reasons[row.reason] ?? 0) + 1;
    const newSignups = (profiles ?? []).filter((p) => !p.is_owner && p.created_at >= since).length;

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      subscriptions: {
        active: active.length,
        trialing: trialing.length,
        scheduledCancel: scheduledCancel.length,
        canceled30d: canceled30d.length,
        canceledTotal: canceled.length,
        current: current.length,
        mrrCents: Math.round(mrrCents),
      },
      funnel30d: { demoViews: eventCount("demo_viewed"), trialClicks: eventCount("demo_trial_clicked"), csvDownloads: eventCount("demo_csv_downloaded"), sections, newSignups },
      product: { totalLessons: lessonCount ?? 0, lessons30d: recentLessons ?? 0, totalAccounts: (profiles ?? []).filter((p) => !p.is_owner).length },
      cancellation: { reasons, recent: feedback ?? [] },
    });
  } catch (err) {
    return errorResponse((err as Error)?.message ?? "Dashboard failed", 500);
  }
});
