import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

// Landing page for the dunning "update your card" email link (plansk12.com/update-card).
// This route only renders once the user is authenticated (App.jsx gates it behind
// Login when there's no session, preserving the URL so a password sign-in lands
// right back here). On mount we mint a Stripe billing-portal session deep-linked
// to the payment_method_update flow and send the browser straight there — so it's
// one click for a logged-in user, and "log in once, then land on card update" for
// everyone else.
export default function UpdateCard() {
  const [error, setError] = useState(null)

  useEffect(() => {
    // Consume any pending redirect flag (set by the login gate) so it can't fire again.
    try { localStorage.removeItem('cardUpdateRedirect') } catch { /* ignore */ }

    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
          body: { flow: 'payment_method_update' },
        })
        if (error) throw error
        if (!data?.url) throw new Error('No card-update link was returned.')
        if (!cancelled) window.location.href = data.url
      } catch (err) {
        if (!cancelled) setError(err?.message ?? 'Could not open the secure card-update page.')
      }
    })()

    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm text-center">
        {error ? (
          <div className="card p-6">
            <h1 className="mb-2 text-lg font-semibold text-ink-50">We couldn’t open the card-update page</h1>
            <p className="mb-4 text-sm text-ink-400">{error}</p>
            <a href="/settings" className="btn-primary w-full justify-center">Update your card in Settings</a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-ink-300">
            <Loader2 size={22} className="animate-spin" />
            <p className="text-sm">Taking you to the secure card-update page…</p>
          </div>
        )}
      </div>
    </div>
  )
}
