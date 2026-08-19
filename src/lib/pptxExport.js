import { supabase } from './supabaseClient'

// PowerPoint (.pptx) export. The client turns a lesson object into a structured
// slide spec (title + content slides, each with a bullet hierarchy + full speaker
// notes); the PAID-gated generate-pptx function applies the ONE brand template and
// returns the actual .pptx. Server enforces the paywall (mirrors docxExport.js).

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : [])
const gradeLabel = (g) => (g === 0 ? 'K' : String(g))
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

const MAX_BULLETS = 7 // per slide before continuing on a "(cont.)" slide
const MAX_SLIDES_PER_SECTION = 3 // hard cap; remainder still lives in the notes

// Split a prose/step section into short bullet lines with a light 2-level
// hierarchy: mini-headers (labels / "PHASE 1 (3 min)" / ALL-CAPS) sit at level 0,
// their following lines and numbered/dashed steps nest at level 1.
function sectionToBullets(text) {
  const lines = String(text ?? '')
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean)
  const out = []
  let haveLabel = false
  for (const line of lines) {
    const listItem = /^(\d+[.)]|[-•*•])\s+/.test(line)
    const stripped = line.replace(/^(\d+[.)]|[-•*•])\s+/, '').trim()
    const label = !listItem && (
      /:$/.test(line) ||
      /^(phase|part|step|section|setup|transition|warm[- ]?up|cool[- ]?down|closure|opening|hook)\b/i.test(line) ||
      (line === line.toUpperCase() && /[A-Z]/.test(line) && line.split(/\s+/).length <= 8)
    )
    if (label) { out.push({ text: truncate(clean(line), 120), level: 0 }); haveLabel = true }
    else out.push({ text: truncate(clean(stripped), 160), level: haveLabel ? 1 : 0 })
  }
  return out
}

// One lesson section → one or more slides (chunked), each carrying the FULL
// original section text as speaker notes so the teacher keeps complete guidance.
function sectionSlides(heading, text) {
  const bullets = sectionToBullets(text)
  if (!bullets.length) return []
  const slides = []
  const capped = bullets.slice(0, MAX_BULLETS * MAX_SLIDES_PER_SECTION)
  for (let i = 0; i < capped.length; i += MAX_BULLETS) {
    const chunk = capped.slice(i, i + MAX_BULLETS)
    const isCont = i > 0
    slides.push({
      heading: isCont ? `${heading} (cont.)` : heading,
      bullets: chunk,
      notes: String(text), // full detail in presenter view
    })
  }
  if (bullets.length > capped.length && slides.length) {
    slides[slides.length - 1].bullets.push({ text: 'Full details in speaker notes ▾', level: 0 })
  }
  return slides
}

// Flatten success_criteria which may be an array OR an object keyed by grade
// (STEM/CTE use { "<grade>": string[] }).
function flattenCriteria(sc) {
  if (Array.isArray(sc)) return sc.map(clean).filter(Boolean)
  if (sc && typeof sc === 'object') {
    return Object.entries(sc).flatMap(([g, v]) =>
      asList(v).map((c) => `Grade ${gradeLabel(Number(g))}: ${clean(c)}`))
      .filter(Boolean)
  }
  return []
}

// Build the full slide spec from a lesson object. Emits a section only when the
// underlying field exists, so it adapts to PE / CTE / Art / Music / STEM shapes.
export function lessonToSlides(lo) {
  if (!lo) return { title: 'Lesson', subtitle: '', meta: [], slides: [] }

  const title = clean(lo.title) || 'Lesson'
  const meta = []
  if (lo.subject) meta.push(clean(lo.subject))
  const grades = asList(lo.grade_bands).map(gradeLabel).join('/')
  if (grades) meta.push(`Grade ${grades}`)
  else if (lo.tier_label) meta.push(clean(lo.tier_label))
  if (lo.duration_minutes) meta.push(`${lo.duration_minutes} min`)
  if (lo.class_size) meta.push(`Class of ${lo.class_size}`)
  const subtitle = lo.unit ? `Unit: ${clean(lo.unit)}` : ''

  const slides = []

  // Standards / competencies
  const standards = asList(lo.standards)
    .map((s) => (typeof s === 'string' ? s : `${s.code ? s.code + ': ' : ''}${s.text ?? ''}`))
    .concat(asList(lo.competencies).map((c) =>
      `${c.framework ? c.framework + ' — ' : ''}${c.text ?? c.competency ?? c.description ?? ''}`))
    .map(clean).filter(Boolean)
  if (standards.length) {
    slides.push({
      heading: 'Standards',
      bullets: standards.slice(0, MAX_BULLETS).map((s) => ({ text: truncate(s, 170), level: 0 })),
      notes: standards.join('\n'),
    })
  }

  // Learning target + success criteria (combined — logically one "goals" slide)
  const target = clean(lo.learning_target) ||
    (lo.learning_targets ? Object.values(lo.learning_targets).map(clean).join('  |  ') : '')
  const criteria = flattenCriteria(lo.success_criteria)
  if (target || criteria.length) {
    const bullets = []
    if (target) bullets.push({ text: truncate(target, 200), level: 0 })
    if (criteria.length) {
      bullets.push({ text: 'Success criteria — I can…', level: 0 })
      criteria.slice(0, MAX_BULLETS - 1).forEach((c) => bullets.push({ text: truncate(c, 160), level: 1 }))
    }
    slides.push({
      heading: 'Learning Target',
      bullets,
      notes: [target && `Learning target: ${target}`, criteria.length && `Success criteria:\n- ${criteria.join('\n- ')}`]
        .filter(Boolean).join('\n\n'),
    })
  }

  // Vocabulary
  const newV = asList(lo.new_vocabulary).map(clean).filter(Boolean)
  const knownV = asList(lo.known_vocabulary).map(clean).filter(Boolean)
  if (newV.length || knownV.length) {
    const bullets = []
    if (newV.length) {
      bullets.push({ text: 'New words', level: 0 })
      newV.slice(0, 6).forEach((w) => bullets.push({ text: w, level: 1 }))
    }
    if (knownV.length) {
      bullets.push({ text: 'Review words', level: 0 })
      knownV.slice(0, 4).forEach((w) => bullets.push({ text: w, level: 1 }))
    }
    slides.push({
      heading: 'Vocabulary',
      bullets,
      notes: [newV.length && `New: ${newV.join(', ')}`, knownV.length && `Review: ${knownV.join(', ')}`]
        .filter(Boolean).join('\n'),
    })
  }

  // Lesson flow — PE / CTE / specialist shapes share these fields. Only emit
  // sections that are actually present (Core-Activity-Only lessons drop warm_up/closure).
  for (const [label, val] of [
    ['Warm-Up / Opening', lo.warm_up],
    ['Instruction', lo.whole_group_instruction],
    ['Main Activity', lo.fitness_activities],
    ['Independent Practice', lo.independent_practice],
    ['Closure', lo.closure],
  ]) {
    if (val && String(val).trim()) slides.push(...sectionSlides(label, val))
  }

  // Modifications
  if (lo.modifications) {
    const m = lo.modifications
    let notes = ''
    let bullets = []
    if (typeof m === 'string') { bullets = sectionToBullets(m).slice(0, MAX_BULLETS); notes = m }
    else if (Array.isArray(m)) {
      const items = m.map((x) => (typeof x === 'string' ? x : Object.values(x).join(' — '))).map(clean).filter(Boolean)
      bullets = items.slice(0, MAX_BULLETS).map((t) => ({ text: truncate(t, 160), level: 0 }))
      notes = items.join('\n')
    } else {
      const items = Object.entries(m).map(([k, v]) => `${k}: ${clean(v)}`)
      bullets = items.slice(0, MAX_BULLETS).map((t) => ({ text: truncate(t, 160), level: 0 }))
      notes = items.join('\n')
    }
    if (bullets.length) slides.push({ heading: 'Modifications', bullets, notes })
  }

  // Safety notes
  const safety = asList(lo.safety_notes).map(clean).filter(Boolean)
  if (safety.length) {
    slides.push({
      heading: 'Safety Notes',
      bullets: safety.slice(0, MAX_BULLETS).map((s) => ({ text: truncate(s, 170), level: 0 })),
      notes: safety.join('\n'),
    })
  }

  return { title, subtitle, meta, slides }
}

// POST the slide spec to the paid-gated function and download the returned .pptx.
// Throws { status: 403 } when the caller isn't a paid subscriber.
export async function requestPptx({ filename, title, subtitle, meta, slides }) {
  const { data: { session } } = await supabase.auth.getSession()
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pptx`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, title, subtitle, meta, slides }),
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
  a.download = `${String(filename || 'lesson').replace(/[^a-z0-9._-]+/gi, '-')}.pptx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
