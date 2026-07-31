import { supabase } from './supabaseClient'

// Word (.docx) export. The heading-structured content is built client-side into
// a normalized block list, then sent to the PAID-gated generate-docx function,
// which builds and returns the actual .docx (server enforces the paywall).

const push = (arr, style, text) => {
  if (text == null) return
  String(text).split(/\n+/).map((t) => t.trim()).filter(Boolean)
    .forEach((line) => arr.push({ style, text: line }))
}
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : [])
const gradeLabel = (g) => (g === 0 ? 'K' : String(g))

// Structured serializer for a full lesson object (handles PE + CTE + specialist
// shapes via the common fields — emits a section only when the field exists).
export function lessonToBlocks(lo) {
  const b = []
  if (!lo) return b

  const meta = []
  if (lo.subject) meta.push(lo.subject)
  const grades = asList(lo.grade_bands).map(gradeLabel).join('/')
  if (grades) meta.push(`Grades ${grades}`)
  if (lo.tier_label) meta.push(lo.tier_label)
  if (lo.duration_minutes) meta.push(`${lo.duration_minutes} min`)
  if (lo.class_size) meta.push(`Class size ${lo.class_size}`)
  if (meta.length) push(b, 'p', meta.join('  ·  '))
  if (lo.unit) push(b, 'p', `Unit: ${lo.unit}`)

  const standards = asList(lo.standards)
    .map((s) => (typeof s === 'string' ? s : `${s.code ? s.code + ': ' : ''}${s.text ?? ''}`))
    .concat(asList(lo.competencies).map((c) => `${c.framework ? c.framework + ' — ' : ''}${c.text ?? c.competency ?? c.description ?? ''}`))
    .map((s) => s.trim()).filter(Boolean)
  if (standards.length) { b.push({ style: 'h2', text: 'Standards' }); standards.forEach((s) => push(b, 'bullet', s)) }

  const target = lo.learning_target ?? (lo.learning_targets ? Object.values(lo.learning_targets).join(' | ') : '')
  if (target) { b.push({ style: 'h2', text: 'Learning Target' }); push(b, 'p', target) }

  const criteria = asList(lo.success_criteria)
  if (criteria.length) { b.push({ style: 'h2', text: 'Success Criteria' }); criteria.forEach((c) => push(b, 'bullet', c)) }

  const newV = asList(lo.new_vocabulary), knownV = asList(lo.known_vocabulary)
  if (newV.length || knownV.length) {
    b.push({ style: 'h2', text: 'Vocabulary' })
    if (newV.length) push(b, 'p', `New: ${newV.join(', ')}`)
    if (knownV.length) push(b, 'p', `Review: ${knownV.join(', ')}`)
  }

  const equip = asList(lo.equipment_needed)
  if (equip.length) { b.push({ style: 'h2', text: 'Equipment / Materials' }); equip.forEach((e) => push(b, 'bullet', e)) }

  // Lesson flow — PE and CTE use different field names for the same phases.
  for (const [label, val] of [
    ['Warm-Up / Opener', lo.warm_up],
    ['Instruction', lo.whole_group_instruction],
    ['Skill Demonstration / Activity', lo.fitness_activities],
    ['Independent Practice / Hands-On', lo.independent_practice],
    ['Closure', lo.closure],
  ]) {
    if (val && String(val).trim()) { b.push({ style: 'h2', text: label }); push(b, 'p', val) }
  }

  const mods = lo.modifications
  if (mods) {
    b.push({ style: 'h2', text: 'Modifications' })
    if (typeof mods === 'string') push(b, 'p', mods)
    else if (Array.isArray(mods)) mods.forEach((m) => push(b, 'bullet', typeof m === 'string' ? m : Object.values(m).join(' — ')))
    else Object.entries(mods).forEach(([k, v]) => push(b, 'bullet', `${k}: ${v}`))
  }

  const safety = asList(lo.safety_notes)
  if (safety.length) { b.push({ style: 'h2', text: 'Safety Notes' }); safety.forEach((s) => push(b, 'bullet', s)) }

  return b
}

// Generic serializer for a rendered tool output (Quiz/Rubric/Worksheet/…) via
// its DOM: headings → heading blocks, list items → bullets, paragraphs → text.
// Skips print/download chrome (.no-print) so buttons/answer keys aren't dumped.
export function domToBlocks(el) {
  const blocks = []
  if (!el) return blocks
  const skip = (n) => n.nodeType === 1 && (n.classList?.contains('no-print') || n.hasAttribute?.('data-no-print'))
  const walk = (node) => {
    for (const child of node.children ?? []) {
      if (skip(child)) continue
      const tag = child.tagName?.toLowerCase()
      if (/^h[1-6]$/.test(tag)) {
        const lvl = Number(tag[1])
        push(blocks, lvl <= 1 ? 'h1' : lvl === 2 ? 'h2' : 'h3', child.textContent)
      } else if (tag === 'li') {
        push(blocks, 'bullet', child.textContent)
      } else if (tag === 'p') {
        push(blocks, 'p', child.textContent)
      } else if (tag === 'table') {
        for (const row of child.querySelectorAll('tr')) {
          const cells = Array.from(row.children).map((c) => c.textContent.trim()).filter(Boolean)
          if (cells.length) push(blocks, 'bullet', cells.join('  |  '))
        }
      } else if (child.children?.length) {
        walk(child)
      } else {
        push(blocks, 'p', child.textContent)
      }
    }
  }
  walk(el)
  return blocks
}

// POST the blocks to the paid-gated function and download the returned .docx.
// Throws { status: 403 } when the caller isn't a paid subscriber.
export async function requestDocx({ filename, title, blocks }) {
  const { data: { session } } = await supabase.auth.getSession()
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-docx`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, title, blocks }),
  })
  if (!res.ok) {
    let message = 'Download failed'
    try { message = (await res.json()).error ?? message } catch { /* non-JSON */ }
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = `${String(filename || 'lesson').replace(/[^a-z0-9._-]+/gi, '-')}.docx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
