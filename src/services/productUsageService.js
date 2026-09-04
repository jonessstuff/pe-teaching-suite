import { supabase } from '../lib/supabaseClient'

const ACTIONS = new Set([
  'opened', 'template_selected', 'created', 'updated', 'completed',
  'reopened', 'printed', 'exported', 'copied',
  'generation_retry', 'generation_recovered', 'generation_failed',
])
const METADATA_KEYS = new Set(['templateId', 'printable', 'status', 'source', 'attempts', 'issue'])
const openedThisVisit = new Set()
const trackedOnceThisVisit = new Set()

function safeText(value, max = 80) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function safeMetadata(metadata = {}) {
  return Object.fromEntries(Object.entries(metadata)
    .filter(([key, value]) => METADATA_KEYS.has(key) && ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 80) : value]))
}

export async function trackToolUsage(toolKey, action, { moduleLabel = null, metadata = {} } = {}) {
  const cleanToolKey = safeText(toolKey)
  if (!cleanToolKey || !ACTIONS.has(action)) return
  try {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id
    if (!userId) return
    await supabase.from('product_usage_events').insert({
      user_id: userId,
      tool_key: cleanToolKey,
      action,
      module_label: safeText(moduleLabel) || null,
      metadata: safeMetadata(metadata),
    })
  } catch {
    // Analytics must never interrupt the teacher's work.
  }
}

export function trackToolOpened(toolKey, options = {}) {
  const key = `${toolKey}:${options.moduleLabel ?? ''}`
  if (openedThisVisit.has(key)) return
  openedThisVisit.add(key)
  void trackToolUsage(toolKey, 'opened', options)
}

export function trackToolUsageOnce(toolKey, action, options = {}) {
  const key = `${toolKey}:${action}:${options.moduleLabel ?? ''}`
  if (trackedOnceThisVisit.has(key)) return
  trackedOnceThisVisit.add(key)
  void trackToolUsage(toolKey, action, options)
}
