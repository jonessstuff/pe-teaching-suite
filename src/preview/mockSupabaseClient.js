/**
 * Mock supabase client for the standalone preview build.
 * Only implements what Settings.jsx and App.jsx use.
 */
export const supabase = {
  auth: {
    async getUser() {
      return { data: { user: { email: 'coach.stacey@example.edu' } } }
    },
    async getSession() {
      return { data: { session: { user: { email: 'coach.stacey@example.edu' } } } }
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } }
    },
    async signOut() {
      // no-op in preview
    },
  },
}
