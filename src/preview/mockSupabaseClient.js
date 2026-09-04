/**
 * Mock supabase client for the standalone preview build.
 * Only implements what Settings.jsx and App.jsx use.
 */
const previewProfile = {
  id: 'preview-user',
  full_name: 'Stacey',
  is_owner: true,
  subscription_status: 'active',
  subscription_synced_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  export_count: 0,
  teaching_areas: ['pe_health'],
  cte_pathways: [],
}

export const supabase = {
  auth: {
    async getUser() {
      return { data: { user: { id: 'preview-user', email: 'coach.stacey@example.edu' } } }
    },
    async getSession() {
      return { data: { session: { user: { id: 'preview-user', email: 'coach.stacey@example.edu' } } } }
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } }
    },
    async signOut() {
      // no-op in preview
    },
  },
  functions: { async invoke() { return { data: { status: 'active' }, error: null } } },
  from(table) {
    const result = () => ({ data: { ...previewProfile }, error: null, count: 1 })
    const chain = new Proxy({}, { get(_target, prop) {
      if (prop === 'then') return (resolve) => resolve(result())
      if (prop === 'single' || prop === 'maybeSingle') return async () => result()
      if (prop === 'update') return (values) => { if (table === 'profiles') Object.assign(previewProfile, values); return chain }
      return () => chain
    } })
    return chain
  },
}
