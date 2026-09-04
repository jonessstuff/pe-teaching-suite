import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.177.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey);
const resendKey = Deno.env.get("RESEND_API_KEY")!;
const appUrl = "https://plansk12.com";

function monthlyAmount(sub: Stripe.Subscription) {
  return sub.items.data.reduce((sum, item) => {
    const amount = (item.price.unit_amount ?? 0) * (item.quantity ?? 1);
    return sum + (item.price.recurring?.interval === "year" ? amount / 12 : amount);
  }, 0);
}

// Stripe supports two ways to schedule a subscription cancellation. Older
// subscriptions commonly set `cancel_at_period_end`; newer billing modes and
// subscription schedules can instead set a future `cancel_at` timestamp while
// leaving that boolean false. Treat either signal as "canceling soon" so the
// owner dashboard matches Stripe's subscription view.
function scheduledCancellationAt(sub: Stripe.Subscription) {
  const now = Math.floor(Date.now() / 1000);
  if (typeof sub.cancel_at === "number" && sub.cancel_at > now) return sub.cancel_at;
  if (sub.cancel_at_period_end) return sub.current_period_end ?? null;
  return null;
}

function isScheduledCancellation(sub: Stripe.Subscription) {
  return scheduledCancellationAt(sub) !== null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character]!));
}

function cancellationRecoveryEmail(firstName: string, accessEndsAt: Date, unsubscribeToken: string) {
  const name = escapeHtml(firstName || "there");
  const endDate = accessEndsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const unsubscribeUrl = `${url}/functions/v1/email-unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const subject = "Can I help before your PlansK12 access ends?";
  const html = `<div style="background:#f4f6f8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="500" cellpadding="0" cellspacing="0" style="max-width:500px;background:#ffffff;border-radius:14px;border:1px solid #e6eaee;">
      <tr><td style="padding:26px 34px 8px;"><span style="font-size:19px;font-weight:700;color:#0b2f6b;">Plans<span style="color:#13a8b3;">K12</span></span></td></tr>
      <tr><td style="padding:8px 34px 30px;color:#344054;font-size:15px;line-height:1.65;">
        <h1 style="font-size:21px;line-height:1.3;color:#172033;margin:6px 0 14px;">Hi ${name},</h1>
        <p>I&rsquo;m Stacey, the teacher who created PlansK12. I noticed your access is scheduled to end on <strong>${endDate}</strong>, and before it does I wanted to reach out personally.</p>
        <p>If something was not useful, was confusing, or you were missing a feature, please reply and tell me. I read every response and may be able to help.</p>
        <p>Your account remains available until ${endDate}. If you would like to keep it, you can sign in and manage your subscription from Settings.</p>
        <p style="margin:22px 0;"><a href="${appUrl}/settings" style="display:inline-block;background:#0b2f6b;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 21px;border-radius:9px;">Return to PlansK12</a></p>
        <p>No pressure to stay. I genuinely appreciate that you gave PlansK12 a try, and your feedback helps me make it better for teachers.</p>
        <p style="margin-bottom:0;">Thank you,<br><strong>Stacey</strong><br>Founder, PlansK12</p>
      </td></tr>
    </table>
    <p style="color:#98a2b3;font-size:12px;margin:16px 0 4px;">PlansK12 - Built for the teachers everyone forgets about.</p>
    <p style="color:#98a2b3;font-size:12px;margin:0;"><a href="${unsubscribeUrl}" style="color:#98a2b3;text-decoration:underline;">Unsubscribe from non-account emails</a></p>
  </td></tr></table></div>`;
  return { subject, html, unsubscribeUrl };
}

async function sendCancellationRecoveryEmail(to: string, subject: string, html: string, unsubscribeUrl: string) {
  if (!resendKey) throw new Error("Email service is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "PlansK12 <hello@plansk12.com>", to: [to], subject, html,
      reply_to: "plansk12.com@gmail.com",
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Email service ${response.status}: ${(result as { message?: string }).message || "send failed"}`);
  return (result as { id?: string }).id ?? null;
}

const meaningfulToolActions = new Set(["created", "updated", "completed", "reopened", "printed", "exported", "copied"]);
const generationHealthActions = new Set(["generation_retry", "generation_recovered", "generation_failed"]);

type UsageRow = {
  user_id: string;
  tool_key: string;
  action: string;
  module_label: string | null;
  created_at: string;
};

function summarizeUsage(rows: UsageRow[]) {
  const groups = new Map<string, { toolKey: string; moduleLabel: string; users: Set<string>; opens: number; created: number; updated: number; completes: number; reuses: number; prints: number; exports: number; copies: number; meaningfulActions: number; totalEvents: number; lastUsedAt: string }>();
  for (const row of rows) {
    const moduleLabel = row.module_label || "Shared tools";
    const key = `${moduleLabel}::${row.tool_key}`;
    const item = groups.get(key) ?? { toolKey: row.tool_key, moduleLabel, users: new Set<string>(), opens: 0, created: 0, updated: 0, completes: 0, reuses: 0, prints: 0, exports: 0, copies: 0, meaningfulActions: 0, totalEvents: 0, lastUsedAt: row.created_at };
    item.users.add(row.user_id);
    item.totalEvents += 1;
    if (row.action === "opened") item.opens += 1;
    if (row.action === "created") item.created += 1;
    if (row.action === "updated") item.updated += 1;
    if (row.action === "completed") item.completes += 1;
    if (row.action === "reopened") item.reuses += 1;
    if (row.action === "printed") item.prints += 1;
    if (row.action === "exported") item.exports += 1;
    if (row.action === "copied") item.copies += 1;
    if (meaningfulToolActions.has(row.action)) item.meaningfulActions += 1;
    if (row.created_at > item.lastUsedAt) item.lastUsedAt = row.created_at;
    groups.set(key, item);
  }
  return [...groups.values()].map(({ users, ...item }) => ({ ...item, uniqueUsers: users.size })).sort((a, b) => b.uniqueUsers - a.uniqueUsers || b.meaningfulActions - a.meaningfulActions || b.totalEvents - a.totalEvents);
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
    if (body.action === "save_school_lead") {
      if (!body.leadId) return errorResponse("School lead is required", 400);
      const allowedStatuses = new Set(["new", "contacted", "replied", "demo_scheduled", "pilot_discussion", "not_now", "closed"]);
      const leadStatus = allowedStatuses.has(body.leadStatus) ? body.leadStatus : "contacted";
      const payload = {
        lead_status: leadStatus,
        last_contacted_at: body.contacted ? new Date().toISOString() : body.lastContactedAt ?? null,
        follow_up_at: body.followUpAt || null,
        owner_note: String(body.ownerNote || "").trim().slice(0, 3000) || null,
      };
      const { data: lead, error } = await admin.from("school_interest").update(payload).eq("id", body.leadId).select("*").single();
      if (error) throw error;
      return jsonResponse({ saved: true, lead });
    }
    if (body.action === "send_cancellation_recovery") {
      if (!body.userId) return errorResponse("Customer is required", 400);
      const { data: customerProfile, error: customerError } = await admin
        .from("profiles")
        .select("id, full_name, stripe_customer_id, is_owner, email_opt_out, unsubscribe_token")
        .eq("id", body.userId)
        .maybeSingle();
      if (customerError) throw customerError;
      if (!customerProfile || customerProfile.is_owner || !customerProfile.stripe_customer_id) return errorResponse("Customer subscription was not found", 404);
      if (customerProfile.email_opt_out) return errorResponse("This customer has unsubscribed from outreach emails", 409);

      const stripeSubscriptions = await stripe.subscriptions.list({ customer: customerProfile.stripe_customer_id, status: "all", limit: 100 });
      const scheduled = stripeSubscriptions.data
        .filter((subscription) => ["active", "trialing", "past_due"].includes(subscription.status) && isScheduledCancellation(subscription))
        .sort((a, b) => scheduledCancellationAt(a)! - scheduledCancellationAt(b)!)[0];
      if (!scheduled) return errorResponse("Stripe no longer shows this customer as canceling soon", 409);

      const scheduledEnd = new Date(scheduledCancellationAt(scheduled)! * 1000);
      const { data: claim, error: claimError } = await admin.from("cancellation_recovery_emails").insert({
        user_id: customerProfile.id,
        stripe_subscription_id: scheduled.id,
        scheduled_end_at: scheduledEnd.toISOString(),
      }).select("id, sent_at").single();
      if (claimError?.code === "23505") return jsonResponse({ sent: false, alreadySent: true });
      if (claimError) throw claimError;

      try {
        const { data: authUser, error: authError } = await admin.auth.admin.getUserById(customerProfile.id);
        if (authError) throw authError;
        const email = authUser.user?.email;
        if (!email) throw new Error("Customer email was not found");
        const firstName = String(customerProfile.full_name || "").trim().split(/\s+/)[0] || "there";
        const message = cancellationRecoveryEmail(firstName, scheduledEnd, customerProfile.unsubscribe_token);
        const resendId = await sendCancellationRecoveryEmail(email, message.subject, message.html, message.unsubscribeUrl);
        await admin.from("cancellation_recovery_emails").update({ resend_id: resendId }).eq("id", claim.id);
        return jsonResponse({ sent: true, sentAt: claim.sent_at, accessEndsAt: scheduledEnd.toISOString() });
      } catch (sendError) {
        await admin.from("cancellation_recovery_emails").delete().eq("id", claim.id);
        throw sendError;
      }
    }
    const requestedDays = Number(body.days ?? 7);
    const days = [0, 7, 30, 90, 365].includes(requestedDays) ? requestedDays : 7;

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
    const scheduledCancel = current.filter(isScheduledCancellation);
    const canceled = subscriptions.filter((s) => s.status === "canceled");
    const thirtyDaysAgoSeconds = Math.floor((Date.now() - 30 * 86400000) / 1000);
    const canceled30d = canceled.filter((s) => (s.canceled_at ?? 0) >= thirtyDaysAgoSeconds);
    const mrrCents = active.reduce((sum, sub) => sum + monthlyAmount(sub), 0);

    const clientSince = typeof body.since === "string" ? new Date(body.since) : null;
    const clientSinceIsSafe = clientSince && Number.isFinite(clientSince.getTime()) && clientSince.getTime() <= Date.now() && clientSince.getTime() >= Date.now() - 48 * 60 * 60 * 1000;
    const utcToday = new Date();
    utcToday.setUTCHours(0, 0, 0, 0);
    const since = days === 0
      ? (clientSinceIsSafe ? clientSince!.toISOString() : utcToday.toISOString())
      : new Date(Date.now() - days * 86400000).toISOString();
    const sinceSeconds = Math.floor(new Date(since).getTime() / 1000);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const trialsStarted = subscriptions.filter((sub) => {
      const startedAt = sub.trial_start ?? (sub.status === "trialing" ? sub.created : null);
      return startedAt != null && startedAt >= sinceSeconds;
    }).length;
    const trialConversions = active.filter((sub) => sub.trial_end != null && sub.trial_end >= sinceSeconds && sub.trial_end <= nowSeconds).length;
    const [{ data: events }, { data: profiles }, { count: lessonCount }, { count: recentLessons }, { data: feedback }, { data: lessonActivity }, { data: sessions }, { data: contacts }, { data: activationEmails }, { data: trialEmails }, { data: usageEvents }, { data: schoolLeads }, { data: cancellationRecoveryEmails }, authUsers] = await Promise.all([
      admin.from("conversion_events").select("event_name, section, placement, visitor_id, campaign_source, campaign_medium, campaign_name, campaign_module, campaign_content, path, created_at").gte("created_at", since),
      admin.from("profiles").select("id, full_name, created_at, subscription_status, stripe_customer_id, teaching_areas, is_owner, acquisition_source, acquisition_medium, acquisition_campaign, acquisition_module, acquisition_content, acquired_at"),
      admin.from("lessons").select("id", { count: "exact", head: true }),
      admin.from("lessons").select("id", { count: "exact", head: true }).gte("created_at", since),
      admin.from("cancellation_feedback").select("user_id, reason, detail, created_at").order("created_at", { ascending: false }).limit(200),
      admin.from("lessons").select("teacher_id, created_at"),
      admin.from("active_sessions").select("user_id, last_seen_at"),
      admin.from("owner_customer_contacts").select("user_id, last_contacted_at, follow_up_at, outcome, note"),
      admin.from("activation_emails").select("user_id, sent_at"),
      admin.from("trial_emails").select("user_id, email_type, sent_at"),
      admin.from("product_usage_events").select("user_id, tool_key, action, module_label, created_at").order("created_at", { ascending: false }).limit(50000),
      admin.from("school_interest").select("id, name, organization, email, role, location, organization_scope, teacher_count, specialties, interest_type, timeline, primary_goal, preferred_next_step, lead_tier, lead_status, note, last_contacted_at, follow_up_at, owner_note, created_at").order("created_at", { ascending: false }).limit(200),
      admin.from("cancellation_recovery_emails").select("user_id, sent_at, scheduled_end_at").order("sent_at", { ascending: false }).limit(1000),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const eventCount = (name: string) => (events ?? []).filter((e) => e.event_name === name).length;
    const videoClickEvents = (events ?? []).filter((e) => e.event_name === "landing_feature_video_clicked");
    const uniqueVideoClickers = new Set(videoClickEvents.map((e) => e.visitor_id).filter(Boolean)).size;
    const uniqueLandingVisitors = new Set((events ?? []).filter((e) => e.event_name === "site_viewed").map((e) => e.visitor_id).filter(Boolean)).size;
    const sections = Object.fromEntries(["today", "teach", "progress"].map((key) => [key, (events ?? []).filter((e) => e.event_name === "demo_section_viewed" && e.section === key).length]));
    const reasons: Record<string, number> = {};
    for (const row of feedback ?? []) reasons[row.reason] = (reasons[row.reason] ?? 0) + 1;
    const newSignups = (profiles ?? []).filter((p) => !p.is_owner && p.created_at >= since).length;
    const customerIdsWithSubscriptions = new Set(subscriptions.map((s) => typeof s.customer === "string" ? s.customer : s.customer.id));
    const customerProfiles = (profiles ?? []).filter((p) => !p.is_owner && p.stripe_customer_id && customerIdsWithSubscriptions.has(p.stripe_customer_id));
    const currentProfiles = customerProfiles.filter((p) => currentCustomerIds.has(p.stripe_customer_id));
    const lessonDates = new Map<string, string>();
    const lessonOwners = new Set<string>();
    for (const row of lessonActivity ?? []) {
      lessonOwners.add(row.teacher_id);
      if (!lessonDates.has(row.teacher_id) || row.created_at > lessonDates.get(row.teacher_id)!) lessonDates.set(row.teacher_id, row.created_at);
    }
    const sessionDates = new Map((sessions ?? []).map((row) => [row.user_id, row.last_seen_at]));
    const typedUsage = (usageEvents ?? []) as UsageRow[];
    const teacherUsage = typedUsage.filter((row) => !generationHealthActions.has(row.action));
    const usageDates = new Map<string, string>();
    const meaningfulUsageCounts = new Map<string, number>();
    const toolUsageByUser = new Map<string, Map<string, { toolKey: string; moduleLabel: string; opens: number; meaningfulActions: number; lastUsedAt: string }>>();
    for (const row of teacherUsage) {
      if (!usageDates.has(row.user_id) || row.created_at > usageDates.get(row.user_id)!) usageDates.set(row.user_id, row.created_at);
      if (meaningfulToolActions.has(row.action)) meaningfulUsageCounts.set(row.user_id, (meaningfulUsageCounts.get(row.user_id) ?? 0) + 1);
      const moduleLabel = row.module_label || "Shared tools";
      const key = `${moduleLabel}::${row.tool_key}`;
      const userTools = toolUsageByUser.get(row.user_id) ?? new Map();
      const item = userTools.get(key) ?? { toolKey: row.tool_key, moduleLabel, opens: 0, meaningfulActions: 0, lastUsedAt: row.created_at };
      if (row.action === "opened") item.opens += 1;
      if (meaningfulToolActions.has(row.action)) item.meaningfulActions += 1;
      if (row.created_at > item.lastUsedAt) item.lastUsedAt = row.created_at;
      userTools.set(key, item);
      toolUsageByUser.set(row.user_id, userTools);
    }
    const lastActivity = (id: string, createdAt: string) => [createdAt, lessonDates.get(id), sessionDates.get(id), usageDates.get(id)].filter(Boolean).sort().at(-1)!;
    const daysInactive = (p: { id: string; created_at: string }) => (Date.now() - new Date(lastActivity(p.id, p.created_at)).getTime()) / 86400000;
    const activated = currentProfiles.filter((p) => lessonOwners.has(p.id) || (meaningfulUsageCounts.get(p.id) ?? 0) > 0).length;
    const emailById = new Map((authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const contactById = new Map((contacts ?? []).map((row) => [row.user_id, row]));
    const feedbackById = new Map<string, { reason: string; detail: string | null; created_at: string }>();
    for (const row of feedback ?? []) if (!feedbackById.has(row.user_id)) feedbackById.set(row.user_id, row);
    const autoEmailById = new Map<string, string>();
    for (const row of [...(activationEmails ?? []), ...(trialEmails ?? [])]) {
      if (!autoEmailById.has(row.user_id) || row.sent_at > autoEmailById.get(row.user_id)!) autoEmailById.set(row.user_id, row.sent_at);
    }
    const cancellationRecoveryById = new Map<string, { sent_at: string; scheduled_end_at: string }>();
    for (const row of cancellationRecoveryEmails ?? []) if (!cancellationRecoveryById.has(row.user_id)) cancellationRecoveryById.set(row.user_id, row);
    const lessonCounts = new Map<string, number>();
    for (const row of lessonActivity ?? []) lessonCounts.set(row.teacher_id, (lessonCounts.get(row.teacher_id) ?? 0) + 1);
    const customerRows = customerProfiles.map((p) => {
      const inactiveDays = Math.max(0, Math.floor(daysInactive(p)));
      const lessons = lessonCounts.get(p.id) ?? 0;
      const toolUsageCount = meaningfulUsageCounts.get(p.id) ?? 0;
      const toolsUsed = [...(toolUsageByUser.get(p.id)?.values() ?? [])].sort((a, b) => b.meaningfulActions - a.meaningfulActions || b.opens - a.opens).slice(0, 12);
      const stripeSubs = subscriptions.filter((s) => (typeof s.customer === "string" ? s.customer : s.customer.id) === p.stripe_customer_id);
      const liveSubs = stripeSubs.filter((s) => ["active", "trialing", "past_due"].includes(s.status));
      const scheduledSub = liveSubs.find(isScheduledCancellation);
      const latestCanceled = stripeSubs.filter((s) => s.status === "canceled").sort((a, b) => (b.canceled_at ?? b.ended_at ?? 0) - (a.canceled_at ?? a.ended_at ?? 0))[0];
      const status = scheduledSub ? "canceling" : liveSubs.some((s) => s.status === "trialing") ? "trial" : liveSubs.length ? "paying" : "canceled";
      const segment = lessons === 0 && toolUsageCount === 0 ? "never_activated" : inactiveDays >= 30 ? "inactive_30" : inactiveDays >= 7 ? "inactive_7" : "active";
      return {
        id: p.id,
        name: p.full_name || "Customer",
        email: emailById.get(p.id) || "",
        joinedAt: p.created_at,
        lastActivityAt: lastActivity(p.id, p.created_at),
        inactiveDays,
        lessonCount: lessons,
        toolUsageCount,
        toolsUsed,
        modulesUsed: [...new Set(toolsUsed.map((item) => item.moduleLabel))],
        lastToolActivityAt: usageDates.get(p.id) ?? null,
        teachingAreas: p.teaching_areas ?? [],
        status,
        segment,
        accessEndsAt: scheduledSub ? new Date(scheduledCancellationAt(scheduledSub)! * 1000).toISOString() : null,
        canceledAt: latestCanceled?.canceled_at || latestCanceled?.ended_at ? new Date((latestCanceled.canceled_at ?? latestCanceled.ended_at!) * 1000).toISOString() : null,
        canceledRecently: Boolean(latestCanceled && (latestCanceled.canceled_at ?? latestCanceled.ended_at ?? 0) >= thirtyDaysAgoSeconds),
        cancellationFeedback: feedbackById.get(p.id) ?? null,
        automaticEmailAt: autoEmailById.get(p.id) ?? null,
        recoveryEmailAt: cancellationRecoveryById.get(p.id)?.sent_at ?? null,
        recoveryEmailEndAt: cancellationRecoveryById.get(p.id)?.scheduled_end_at ?? null,
        contact: contactById.get(p.id) ?? null,
      };
    }).sort((a, b) => {
      const priority = { canceling: 0, canceled: 1, trial: 2, paying: 3 } as Record<string, number>;
      const statusOrder = (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
      if (statusOrder) return statusOrder;
      // Put the most urgent scheduled cancellations first so the owner sees
      // who still has the shortest recovery window.
      if (a.status === "canceling" && b.status === "canceling") {
        const aEnd = a.accessEndsAt ? new Date(a.accessEndsAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bEnd = b.accessEndsAt ? new Date(b.accessEndsAt).getTime() : Number.MAX_SAFE_INTEGER;
        if (aEnd !== bEnd) return aEnd - bEnd;
      }
      return b.inactiveDays - a.inactiveDays;
    });

    const usage30d = teacherUsage.filter((row) => row.created_at >= since);
    const toolUsage30d = summarizeUsage(usage30d);
    const moduleGroups = new Map<string, { moduleLabel: string; users: Set<string>; totalEvents: number; meaningfulActions: number; lastUsedAt: string }>();
    for (const row of usage30d) {
      const moduleLabel = row.module_label || "Shared tools";
      const item = moduleGroups.get(moduleLabel) ?? { moduleLabel, users: new Set<string>(), totalEvents: 0, meaningfulActions: 0, lastUsedAt: row.created_at };
      item.users.add(row.user_id);
      item.totalEvents += 1;
      if (meaningfulToolActions.has(row.action)) item.meaningfulActions += 1;
      if (row.created_at > item.lastUsedAt) item.lastUsedAt = row.created_at;
      moduleGroups.set(moduleLabel, item);
    }
    const modules30d = [...moduleGroups.values()].map(({ users, ...item }) => ({ ...item, uniqueUsers: users.size })).sort((a, b) => b.uniqueUsers - a.uniqueUsers || b.meaningfulActions - a.meaningfulActions);
    const uniqueToolUsers30d = new Set(usage30d.map((row) => row.user_id)).size;
    const meaningfulActions30d = usage30d.filter((row) => meaningfulToolActions.has(row.action)).length;

    const generationRows = typedUsage.filter((row) => row.created_at >= since && generationHealthActions.has(row.action));
    const generationGroups = new Map<string, { toolKey: string; moduleLabel: string; users: Set<string>; retries: number; recovered: number; failed: number; lastEventAt: string }>();
    for (const row of generationRows) {
      const moduleLabel = row.module_label || "Shared tools";
      const key = `${moduleLabel}::${row.tool_key}`;
      const item = generationGroups.get(key) ?? { toolKey: row.tool_key, moduleLabel, users: new Set<string>(), retries: 0, recovered: 0, failed: 0, lastEventAt: row.created_at };
      item.users.add(row.user_id);
      if (row.action === "generation_retry") item.retries += 1;
      if (row.action === "generation_recovered") item.recovered += 1;
      if (row.action === "generation_failed") item.failed += 1;
      if (row.created_at > item.lastEventAt) item.lastEventAt = row.created_at;
      generationGroups.set(key, item);
    }
    const generationByTool = [...generationGroups.values()]
      .map(({ users, ...item }) => ({ ...item, affectedTeachers: users.size }))
      .sort((a, b) => b.failed - a.failed || b.recovered - a.recovered || b.retries - a.retries)
      .slice(0, 30);
    const generationFailed = generationRows.filter((row) => row.action === "generation_failed").length;
    const generationRecovered = generationRows.filter((row) => row.action === "generation_recovered").length;

    const campaignGroups = new Map<string, { campaign: string; source: string; module: string | null; visitors: Set<string>; visits: number; trialClicks: number; trials: number; paid: number }>();
    for (const event of (events ?? [])) {
      // Events recorded before campaign attribution launched have no visitor
      // token. Keep them in the historic demo funnel, but never pretend they
      // are attributable visitors in this new report.
      if (!event.visitor_id) continue;
      const campaign = event.campaign_name || "Direct / untagged";
      const source = event.campaign_source || "direct";
      const key = `${source}::${campaign}::${event.campaign_module || ""}`;
      const item = campaignGroups.get(key) ?? { campaign, source, module: event.campaign_module || null, visitors: new Set<string>(), visits: 0, trialClicks: 0, trials: 0, paid: 0 };
      if (["site_viewed", "demo_viewed"].includes(event.event_name)) {
        item.visits += 1;
        item.visitors.add(event.visitor_id);
      }
      if (["trial_clicked", "demo_trial_clicked"].includes(event.event_name)) item.trialClicks += 1;
      campaignGroups.set(key, item);
    }
    for (const profile of (profiles ?? []).filter((p) => {
      if (p.is_owner) return false;
      const stripeSubs = subscriptions.filter((sub) => (typeof sub.customer === "string" ? sub.customer : sub.customer.id) === p.stripe_customer_id);
      const convertedInRange = stripeSubs.some((sub) => ["active", "past_due"].includes(sub.status) && sub.trial_end != null && sub.trial_end >= sinceSeconds && sub.trial_end <= nowSeconds);
      return Boolean((p.acquired_at && p.acquired_at >= since) || convertedInRange);
    })) {
      const campaign = profile.acquisition_campaign || "Direct / untagged";
      const source = profile.acquisition_source || "direct";
      const key = `${source}::${campaign}::${profile.acquisition_module || ""}`;
      const item = campaignGroups.get(key) ?? { campaign, source, module: profile.acquisition_module || null, visitors: new Set<string>(), visits: 0, trialClicks: 0, trials: 0, paid: 0 };
      const stripeSubs = subscriptions.filter((sub) => (typeof sub.customer === "string" ? sub.customer : sub.customer.id) === profile.stripe_customer_id);
      const trialStartedInRange = stripeSubs.some((sub) => {
        const startedAt = sub.trial_start ?? (sub.status === "trialing" ? sub.created : null);
        return startedAt != null && startedAt >= sinceSeconds;
      });
      const convertedInRange = stripeSubs.some((sub) => ["active", "past_due"].includes(sub.status) && sub.trial_end != null && sub.trial_end >= sinceSeconds && sub.trial_end <= nowSeconds);
      const paidWithoutTrialInRange = stripeSubs.some((sub) => ["active", "past_due"].includes(sub.status) && sub.trial_end == null && sub.created >= sinceSeconds);
      if (trialStartedInRange) item.trials += 1;
      if (convertedInRange || paidWithoutTrialInRange) item.paid += 1;
      campaignGroups.set(key, item);
    }
    const campaignRows = [...campaignGroups.values()].map(({ visitors, ...item }) => ({
      ...item,
      visitors: visitors.size,
      clickRate: visitors.size ? Math.round(item.trialClicks / visitors.size * 100) : 0,
      subscriberRate: visitors.size ? Math.round(item.paid / visitors.size * 100) : 0,
    })).sort((a, b) => b.paid - a.paid || b.trials - a.trials || b.trialClicks - a.trialClicks || b.visitors - a.visitors);

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
      rangeDays: days,
      funnel30d: { demoViews: eventCount("demo_viewed"), trialClicks: eventCount("demo_trial_clicked") + eventCount("trial_clicked"), csvDownloads: eventCount("demo_csv_downloaded"), sections, newSignups, trialsStarted, trialConversions },
      landingVideo: {
        uniqueClickers: uniqueVideoClickers,
        totalClicks: videoClickEvents.length,
        landingVisitors: uniqueLandingVisitors,
        clickRate: uniqueLandingVisitors ? Math.round(uniqueVideoClickers / uniqueLandingVisitors * 100) : 0,
      },
      acquisition: {
        visitors: new Set((events ?? []).filter((e) => e.visitor_id && ["site_viewed", "demo_viewed"].includes(e.event_name)).map((e) => e.visitor_id)).size,
        trialClicks: eventCount("demo_trial_clicked") + eventCount("trial_clicked"),
        attributedTrials: campaignRows.reduce((sum, row) => sum + row.trials, 0),
        attributedPaid: campaignRows.reduce((sum, row) => sum + row.paid, 0),
        campaigns: campaignRows,
      },
      product: {
        totalLessons: lessonCount ?? 0,
        lessons30d: recentLessons ?? 0,
        totalAccounts: (profiles ?? []).filter((p) => !p.is_owner).length,
        toolUsage30d: { uniqueUsers: uniqueToolUsers30d, meaningfulActions: meaningfulActions30d, totalEvents: usage30d.length, tools: toolUsage30d, modules: modules30d },
        generationHealth: {
          retries: generationRows.filter((row) => row.action === "generation_retry").length,
          recovered: generationRecovered,
          failed: generationFailed,
          affectedTeachers: new Set(generationRows.map((row) => row.user_id)).size,
          recoveryRate: generationRecovered + generationFailed ? Math.round(generationRecovered / (generationRecovered + generationFailed) * 100) : 100,
          tools: generationByTool,
        },
      },
      activation: {
        customers: currentProfiles.length,
        activated,
        neverActivated: currentProfiles.length - activated,
        inactive7d: currentProfiles.filter((p) => daysInactive(p) >= 7).length,
        inactive30d: currentProfiles.filter((p) => daysInactive(p) >= 30).length,
        activationRate: currentProfiles.length ? Math.round(activated / currentProfiles.length * 100) : 0,
      },
      customers: customerRows,
      schoolLeads: schoolLeads ?? [],
      cancellation: { reasons, recent: feedback ?? [] },
    });
  } catch (err) {
    return errorResponse((err as Error)?.message ?? "Dashboard failed", 500);
  }
});
