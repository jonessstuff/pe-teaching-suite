const ATTRIBUTION_KEY = 'plansk12_campaign_attribution'
const VISITOR_KEY = 'plansk12_campaign_visitor'

function clean(value, max = 100) {
  return typeof value === 'string'
    ? value.trim().replace(/[^a-zA-Z0-9 _&/+.-]/g, '').slice(0, max) || null
    : null
}

function storage() {
  try { return window.localStorage } catch { return null }
}

export function getCampaignVisitorId() {
  if (typeof window === 'undefined') return null
  const saved = storage()?.getItem(VISITOR_KEY)
  if (saved && /^[a-zA-Z0-9_-]{8,64}$/.test(saved)) return saved
  const generated = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64)
  try { storage()?.setItem(VISITOR_KEY, generated) } catch { /* attribution is best-effort */ }
  return generated
}

export function captureCampaignAttribution() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const incoming = {
    source: clean(params.get('utm_source') ?? params.get('source')),
    medium: clean(params.get('utm_medium') ?? params.get('medium')),
    campaign: clean(params.get('utm_campaign') ?? params.get('campaign')),
    module: clean(params.get('utm_module') ?? params.get('module')),
    content: clean(params.get('utm_content') ?? params.get('content')),
  }
  const hasIncoming = Object.values(incoming).some(Boolean)
  if (hasIncoming) {
    try { storage()?.setItem(ATTRIBUTION_KEY, JSON.stringify(incoming)) } catch { /* best-effort */ }
    return incoming
  }
  try {
    const saved = JSON.parse(storage()?.getItem(ATTRIBUTION_KEY) ?? '{}')
    return Object.fromEntries(Object.entries(saved).map(([key, value]) => [key, clean(value)]))
  } catch {
    return {}
  }
}

export function getCampaignAttribution() {
  return captureCampaignAttribution()
}

export function checkoutUrl(baseUrl) {
  if (typeof window === 'undefined') return baseUrl
  try {
    const url = new URL(baseUrl)
    const visitorId = getCampaignVisitorId()
    const attribution = getCampaignAttribution()
    if (visitorId) url.searchParams.set('client_reference_id', visitorId)
    if (attribution.source) url.searchParams.set('utm_source', attribution.source.replaceAll(' ', '_'))
    if (attribution.medium) url.searchParams.set('utm_medium', attribution.medium.replaceAll(' ', '_'))
    if (attribution.campaign) url.searchParams.set('utm_campaign', attribution.campaign.replaceAll(' ', '_'))
    if (attribution.content) url.searchParams.set('utm_content', attribution.content.replaceAll(' ', '_'))
    return url.toString()
  } catch {
    return baseUrl
  }
}

export function campaignLink({ source = 'facebook', medium = 'social', campaign, module, content } = {}) {
  const origin = typeof window === 'undefined' ? 'https://plansk12.com' : window.location.origin
  const url = new URL('/', origin)
  if (source) url.searchParams.set('utm_source', source)
  if (medium) url.searchParams.set('utm_medium', medium)
  if (campaign) url.searchParams.set('utm_campaign', campaign)
  if (module) url.searchParams.set('utm_module', module)
  if (content) url.searchParams.set('utm_content', content)
  return url.toString()
}
