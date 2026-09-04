const customers = [
  { id: 'a', name: 'Alex Rivera', email: 'alex@example.com', status: 'canceling', segment: 'canceling', lessonCount: 8, toolUsageCount: 19, modulesUsed: ['PE & Health'], toolsUsed: [{ toolKey: 'pe-events', moduleLabel: 'PE & Health', meaningfulActions: 12, opens: 7, lastUsedAt: '2026-08-28' }], inactiveDays: 2, teachingAreas: ['PE & Health'], joinedAt: '2026-06-03', lastActivityAt: '2026-08-28', accessEndsAt: '2026-09-03T12:00:00.000Z' },
  { id: 'b', name: 'Morgan Lee', email: 'morgan@example.com', status: 'trial', segment: 'active', lessonCount: 0, toolUsageCount: 4, modulesUsed: ['Art'], toolsUsed: [{ toolKey: 'art-show', moduleLabel: 'Art', meaningfulActions: 4, opens: 3, lastUsedAt: '2026-08-28' }], inactiveDays: 1, teachingAreas: ['Art'], joinedAt: '2026-08-24', lastActivityAt: '2026-08-28', automaticEmailAt: '2026-08-27' },
  { id: 'c', name: 'Jamie Patel', email: 'jamie@example.com', status: 'paying', segment: 'inactive_30', lessonCount: 3, toolUsageCount: 0, modulesUsed: [], toolsUsed: [], inactiveDays: 38, teachingAreas: ['SLP', 'Intervention'], joinedAt: '2026-04-11', lastActivityAt: '2026-07-22' },
  { id: 'd', name: 'Taylor Brooks', email: 'taylor@example.com', status: 'paying', segment: 'active', lessonCount: 21, toolUsageCount: 9, modulesUsed: ['Early Childhood / Pre-K'], toolsUsed: [{ toolKey: 'early-family-events', moduleLabel: 'Early Childhood / Pre-K', meaningfulActions: 9, opens: 5, lastUsedAt: '2026-08-29' }], inactiveDays: 0, teachingAreas: ['Early Childhood'], joinedAt: '2026-03-19', lastActivityAt: '2026-08-29' },
]

const schoolLeads = [
  { id: 'school-1', name: 'Jordan Reed', email: 'jordan@example.com', role: 'department_lead', organization: 'Southwest Regional Schools', location: 'Oklahoma', organization_scope: 'multiple_schools', teacher_count: 14, specialties: ['CTE', 'PE & Health', 'Art'], interest_type: 'pilot', timeline: 'this_semester', primary_goal: 'Give specialty teachers one consistent place to plan, run programs, and share useful resources.', preferred_next_step: 'pilot_conversation', lead_tier: 'hot', lead_status: 'new', note: 'Interested in seeing how a founding-school pilot could work.', created_at: '2026-08-31T20:33:37.677Z' },
  { id: 'school-2', name: 'Morgan Lee', email: 'morgan.admin@example.com', role: 'school_admin', organization: 'Riverside Middle School', location: 'Richmond, Virginia', organization_scope: 'school', teacher_count: 9, specialties: ['Art', 'Music', 'Library & Media', 'STEM'], interest_type: 'admin_packet', timeline: 'next_semester', primary_goal: 'Support elective teachers with consistent resources without adding another complicated system.', preferred_next_step: 'admin_packet', lead_tier: 'warm', lead_status: 'contacted', created_at: '2026-08-24T13:20:00.000Z', last_contacted_at: '2026-08-25T14:00:00.000Z' },
]

export async function getOwnerAnalytics(days = 7) {
  const today = days === 0
  const multiplier = today ? 1 : days === 7 ? 7 : days === 30 ? 30 : days === 90 ? 62 : 100
  const scaled = (value) => Math.max(today ? 0 : 1, Math.round(value * multiplier / 30))
  return {
    rangeDays: days,
    subscriptions: { active: 54, trialing: 3, mrrCents: 53946, current: 57, scheduledCancel: 9, canceled30d: 4, canceledTotal: 23 },
    funnel30d: { demoViews: scaled(146), trialClicks: scaled(31), newSignups: today ? 2 : scaled(18), trialsStarted: today ? 2 : scaled(15), trialConversions: today ? 1 : scaled(7), sections: { today: scaled(92), teach: scaled(61), progress: scaled(47) } },
    landingVideo: { uniqueClickers: today ? 3 : scaled(28), totalClicks: today ? 5 : scaled(41), landingVisitors: today ? 18 : scaled(192), clickRate: 15 },
    acquisition: { visitors: scaled(192), trialClicks: scaled(38), attributedTrials: today ? 2 : scaled(4), attributedPaid: today ? 1 : scaled(3), campaigns: [{ campaign: 'cte-facebook-update', source: 'facebook', module: 'CTE', visitors: scaled(84), trialClicks: scaled(18), trials: today ? 1 : scaled(2), paid: today ? 1 : scaled(2), clickRate: 21, subscriberRate: 2 }, { campaign: 'pe-run-tracker', source: 'facebook', module: 'PE & Health', visitors: scaled(61), trialClicks: scaled(13), trials: today ? 1 : scaled(1), paid: 0, clickRate: 21, subscriberRate: 2 }] },
    product: { lessons30d: scaled(284), totalLessons: 1842, generationHealth: { retries: today ? 1 : scaled(9), recovered: today ? 1 : scaled(7), failed: today ? 0 : scaled(2), affectedTeachers: today ? 1 : scaled(5), recoveryRate: 78, tools: [{ toolKey: 'ai-lesson', moduleLabel: 'PE & Health', affectedTeachers: 3, retries: 5, recovered: 4, failed: 1 }, { toolKey: 'ai-cte-lesson', moduleLabel: 'CTE', affectedTeachers: 2, retries: 4, recovered: 3, failed: 1 }] }, toolUsage30d: { uniqueUsers: today ? 6 : scaled(26), meaningfulActions: scaled(184), totalEvents: scaled(329), modules: [{ moduleLabel: 'PE & Health', uniqueUsers: today ? 4 : scaled(14), meaningfulActions: scaled(83), totalEvents: scaled(141) }, { moduleLabel: 'Library & Media', uniqueUsers: today ? 2 : scaled(8), meaningfulActions: scaled(57), totalEvents: scaled(98) }, { moduleLabel: 'Art', uniqueUsers: today ? 1 : scaled(5), meaningfulActions: scaled(28), totalEvents: scaled(55) }], tools: [{ toolKey: 'pe-events', moduleLabel: 'PE & Health', uniqueUsers: today ? 3 : scaled(12), opens: scaled(48), created: scaled(18), updated: scaled(21), completes: scaled(7), reuses: scaled(6), prints: scaled(12), exports: 0, copies: scaled(5), meaningfulActions: scaled(69) }, { toolKey: 'reading-challenges', moduleLabel: 'Library & Media', uniqueUsers: today ? 2 : scaled(8), opens: scaled(31), created: scaled(11), updated: scaled(18), completes: scaled(5), reuses: scaled(4), prints: scaled(3), exports: scaled(6), copies: 0, meaningfulActions: scaled(47) }] } },
    activation: { activated: 48, activationRate: 84, neverActivated: 9, inactive7d: 15, inactive30d: 5, customers: 57 },
    cancellation: { reasons: { not_using: 5, price: 3, missing_feature: 2 }, recent: [] },
    customers,
    schoolLeads,
  }
}

export async function saveOwnerContact() { return { saved: true } }
export async function saveSchoolLead() { return { saved: true } }
export async function sendCancellationRecoveryEmail() { return { sent: true, sentAt: new Date().toISOString() } }
export async function saveCancellationFeedback() { return { saved: true } }
