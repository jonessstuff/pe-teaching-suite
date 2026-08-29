const customers = [
  { id: 'a', name: 'Alex Rivera', email: 'alex@example.com', status: 'canceling', segment: 'canceling', lessonCount: 8, inactiveDays: 12, teachingAreas: ['PE & Health'], joinedAt: '2026-06-03', lastActivityAt: '2026-08-17', accessEndsAt: '2026-09-03T12:00:00.000Z' },
  { id: 'b', name: 'Morgan Lee', email: 'morgan@example.com', status: 'trial', segment: 'never_activated', lessonCount: 0, inactiveDays: 3, teachingAreas: ['Art'], joinedAt: '2026-08-24', lastActivityAt: '2026-08-26', automaticEmailAt: '2026-08-27' },
  { id: 'c', name: 'Jamie Patel', email: 'jamie@example.com', status: 'paying', segment: 'inactive_30', lessonCount: 3, inactiveDays: 38, teachingAreas: ['SLP', 'Intervention'], joinedAt: '2026-04-11', lastActivityAt: '2026-07-22' },
  { id: 'd', name: 'Taylor Brooks', email: 'taylor@example.com', status: 'paying', segment: 'active', lessonCount: 21, inactiveDays: 0, teachingAreas: ['Early Childhood'], joinedAt: '2026-03-19', lastActivityAt: '2026-08-29' },
]

export async function getOwnerAnalytics() {
  return { subscriptions: { active: 54, trialing: 3, mrrCents: 53946, current: 57, scheduledCancel: 9, canceled30d: 4, canceledTotal: 23 }, funnel30d: { demoViews: 146, trialClicks: 31, newSignups: 18, sections: { lessons: 92, participation: 61, run_tracker: 78, specialists: 47 } }, product: { lessons30d: 284, totalLessons: 1842 }, activation: { activated: 45, activationRate: 79, neverActivated: 12, inactive7d: 17, inactive30d: 6, customers: 57 }, cancellation: { reasons: { not_using: 5, price: 3, missing_feature: 2 }, recent: [] }, customers }
}

export async function saveOwnerContact() { return { saved: true } }
export async function saveCancellationFeedback() { return { saved: true } }
