import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return false // default to light mode
  })

  useEffect(() => {
    const html = document.documentElement
    if (dark) {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  async function toggle() {
    const next = !dark
    setDark(next)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({ data: { theme: next ? 'dark' : 'light' } })
      }
    } catch {
      // non-critical — localStorage is the source of truth
    }
  }

  return { dark, toggle }
}
