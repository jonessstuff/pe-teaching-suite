import { supabase } from '../lib/supabaseClient'

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function getMyCode() {
  const { data: { user } } = await supabase.auth.getUser()
  const existing = user.user_metadata?.referral_code
  if (existing) return existing

  const code = generateCode()
  await supabase.auth.updateUser({ data: { referral_code: code } })
  return code
}

export async function getReferralStats() {
  const { data, error } = await supabase
    .from('referrals')
    .select('status')
  if (error) throw error

  const signedUp = data.filter(r => ['signed_up', 'subscribed', 'credited'].includes(r.status)).length
  const monthsEarned = data.filter(r => r.status === 'credited').length
  return { signedUp, monthsEarned }
}

export async function recordReferralSignup(referralCode) {
  if (!referralCode) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Find the referrer by code stored in their user_metadata — via referrals table
  // Insert a referral record for this signup
  await supabase.from('referrals').insert({
    referrer_id: user.id, // placeholder — actual referrer lookup requires service role
    referee_id: user.id,
    referral_code: referralCode,
    status: 'signed_up',
  }).select()
}
