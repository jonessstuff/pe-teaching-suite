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
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (body.action === "save_contact") {
      if (!body.userId) return errorResponse("Customer is required", 400);
      const payload = {
        user_id: body.userId,
        last_contacted_at: body.contacted ? new Date().toISOString() : body.lastContactedAt ?? null,
        follow_up_at: body.followUpAt || null,
        outcome: body.outcome || null,
        note: String(body.note || "").trim().slice(0, 2000) || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await admin.from("owner_customer_contacts").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      return jsonResponse({ saved: true, contact: payload });
    }

    const subscriptions: Stripe.Subscription[] = [];
    let startingAfter: string | undefined;
    for (let page = 0; page < 20; page++) {
      const result = await stripe.subscriptions.list({ status: "all", limit: 100, starting_after: startingAfter });
      subscriptions.push(...result.data);
      if (!result.has_more) break;
      startingAfter = result.data.at(-1)?.id;
    }
    const current = subscriptions.filter((s) => ["active", "trialing", "past_due"].includes(s.status));
    const currentCustomerIds = new Set(current.map((s) => typeof s.customer === "string" ? s.customer : s.customer.id));
    const active = current.filter((s) => s.status === "active" || s.status === "past_due");
    const trialing = current.filter((s) => s.status === "trialing");
    const scheduledCancel = current.filter((s) => s.cancel_at_period_end);
    const canceled = subscriptions.filter((s) => s.status === "canceled");
    const thirtyDaysAgoSeconds = Math.floor((Date.now() - 30 * 86400000) / 1000);
    const canceled30d = canceled.filter((s) => (s.canceled_at ?? 0) >= thirtyDaysAgoSeconds);
    const mrrCents = active.reduce((sum, sub) => sum + monthlyAmount(sub), 0);

    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [{ data: events }, { data: profiles }, { count: lessonCount }, { count: recentLessons }, { data: feedback }, { data: lessonActivity }, { data: sessions }, { data: contacts }, { data: activationEmails }, authUsers] = await Promise.all([
      admin.from("conversion_events").select("event_name, section, placement, created_at").gte("created_at", since),
      admin.from("profiles").select("id, full_name, created_at, subscription_status, stripe_customer_id, teaching_areas, is_owner"),
      admin.from("lessons").select("id", { count: "exact", head: true }),
      admin.from("lessons").select("id", { count: "exact", head: true }).gte("created_at", since),
      admin.from("cancellation_feedback").select("reason, detail, created_at").order("created_at", { ascending: false }).limit(50),
      admin.from("lessons").select("teacher_id, created_at"),
      admin.from("active_sessions").select("user_id, last_seen_at"),
      admin.from("owner_customer_contacts").select("user_id, last_contacted_at, follow_up_at, outcome, note"),
      admin.from("activation_emails").select("user_id, sent_at"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const eventCount = (name: string) => (events ?? []).filter((e) => e.event_name === name).length;
    const sections = Object.fromEntries(["today", "teach", "progress"].map((key) => [key, (events ?? []).filter((e) => e.event_name === "demo_section_viewed" && e.section === key).length]));
    const reasons: Record<string, number> = {};
    for (const row of feedback ?? []) reasons[row.reason] = (reasons[row.reason] ?? 0) + 1;
    const newSignups = (profiles ?? []).filter((p) => !p.is_owner && p.created_at >= since).length;
    const currentProfiles = (profiles ?? []).filter((p) => !p.is_owner && p.stripe_customer_id && currentCustomerIds.has(p.stripe_customer_id));
    const lessonDates = new Map<string, string>();
    const lessonOwners = new Set<string>();
    for (const row of lessonActivity ?? []) {
      lessonOwners.add(row.teacher_id);
      if (!lessonDates.has(row.teacher_id) || row.created_at > lessonDates.get(row.teacher_id)!) lessonDates.set(row.teacher_id, row.created_at);
    }
    const sessionDates = new Map((sessions ?? []).map((row) => [row.user_id, row.last_seen_at]));
    const lastActivity = (id: string, createdAt: string) => [createdAt, lessonDates.get(id), sessionDates.get(id)].filter(Boolean).sort().at(-1)!;
    const daysInactive = (p: { id: string; created_at: string }) => (Date.now() - new Date(lastActivity(p.id, p.created_at)).getTime()) / 86400000;
    const activated = currentProfiles.filter((p) => lessonOwners.has(p.id)).length;
    const emailById = new Map((authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const contactById = new Map((contacts ?? []).map((row) => [row.user_id, row]));
    const autoEmailById = new Map((activationEmails ?? []).map((row) => [row.user_id, row.sent_at]));
    const lessonCounts = new Map<string, number>();
    for (const row of lessonActivity ?? []) lessonCounts.set(row.teacher_id, (lessonCounts.get(row.teacher_id) ?? 0) + 1);
    const customerRows = currentProfiles.map((p) => {
      const inactiveDays = Math.max(0, Math.floor(daysInactive(p)));
      const lessons = lessonCounts.get(p.id) ?? 0;
      const stripeSubs = current.filter((s) => (typeof s.customer === "string" ? s.customer : s.customer.id) === p.stripe_customer_id);
      const scheduled = stripeSubs.some((s) => s.cancel_at_period_end);
      const status = scheduled ? "canceling" : stripeSubs.some((s) => s.status === "trialing") ? "trial" : "paying";
      const segment = lessons === 0 ? "never_activated" : inactiveDays >= 30 ? "inactive_30" : inactiveDays >= 7 ? "inactive_7" : "active";
      return {
        id: p.id,
        name: p.full_name || "Customer",
        email: emailById.get(p.id) || "",
        joinedAt: p.created_at,
        lastActivityAt: lastActivity(p.id, p.created_at),
        inactiveDays,
        lessonCount: lessons,
        teachingAreas: p.teaching_areas ?? [],
        status,
        segment,
        automaticEmailAt: autoEmailById.get(p.id) ?? null,
        contact: contactById.get(p.id) ?? null,
      };
    }).sort((a, b) => b.inactiveDays - a.inactiveDays);

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
      activation: {
        customers: currentProfiles.length,
        activated,
        neverActivated: currentProfiles.length - activated,
        inactive7d: currentProfiles.filter((p) => daysInactive(p) >= 7).length,
        inactive30d: currentProfiles.filter((p) => daysInactive(p) >= 30).length,
        activationRate: currentProfiles.length ? Math.round(activated / currentProfiles.length * 100) : 0,
      },
      customers: customerRows,
      cancellation: { reasons, recent: feedback ?? [] },
    });
  } catch (err) {
    return errorResponse((err as Error)?.message ?? "Dashboard failed", 500);
  }
});
