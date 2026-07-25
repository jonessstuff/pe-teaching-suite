import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const CACHE_KEY = 'pk12_first_name'

/** Time-of-day greeting prefix, e.g. "Good morning". */
export function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstNameFrom(full) {
  return (full ?? '').trim().split(/\s+/)[0] || ''
}

/**
 * Returns the signed-in user's first name for greetings.
 *
 * Reads the CANONICAL name from profiles.full_name (what Settings saves) —
 * not auth user_metadata, which is only seeded at signup and goes stale when
 * the name is edited. Falls back to user_metadata only if the profile row has
 * no name yet.
 *
 * Seeds initial state synchronously from localStorage so the greeting paints
 * the correct name on first render instead of flashing "" (or the old "there")
 * and re-rendering — fixing the reported flicker.
 */
export function useDisplayName() {
  const [firstName, setFirstName] = useState(() => {
    try { return localStorage.getItem(CACHE_KEY) || '' } catch { return '' }
  })

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user || cancelled) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        let name = firstNameFrom(profile?.full_name)
        if (!name) {
          const meta = user.user_metadata ?? {}
          name = firstNameFrom(meta.full_name ?? meta.name)
        }

        if (cancelled) return
        setFirstName(name)
        try {
          if (name) localStorage.setItem(CACHE_KEY, name)
          else localStorage.removeItem(CACHE_KEY)
        } catch { /* ignore storage errors */ }
      } catch { /* not signed in / offline — keep cached value */ }
    })()

    return () => { cancelled = true }
  }, [])

  return firstName
}

/** Clear the cached greeting name (call on sign-out so the next user is fresh). */
export function clearDisplayNameCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}
