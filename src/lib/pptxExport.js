import { supabase } from './supabaseClient'

// PowerPoint (.pptx) export. The client turns a lesson object into a structured
// slide spec (title + content slides, each with a bullet hierarchy + full speaker
// notes); the PAID-gated generate-pptx function applies the ONE brand template and
// returns the actual .pptx. Server enforces the paywall (mirrors docxExport.js).

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : [])
const gradeLabel = (g) => (g === 0 ? 'K' : String(g))
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
const MAX_BULLETS = 5


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

function sentences(value, max = 5) {
  return String(value ?? '').split(/\n+|(?<=[.!?])\s+/).map((line) => clean(line.replace(/^(\d+[.)]|[-•*])\s*/, ''))).filter(Boolean).slice(0, max)
}

function studentSteps(value, max = 5) {
  return sentences(value, max).map((text, index) => ({ text: truncate(text, 125), level: 0, number: index + 1 }))
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

  // Student-facing deck: concise screen content; full teacher wording stays in notes.
  const target = clean(lo.learning_target) ||
    (lo.learning_targets ? Object.values(lo.learning_targets).map(clean).find(Boolean) : '')
  const criteria = flattenCriteria(lo.success_criteria)
  if (target || criteria.length) {
    slides.push({
      heading: 'Today We Will…', layout: 'focus', callout: truncate(target || criteria[0], 180),
      bullets: criteria.slice(0, 3).map((c) => ({ text: truncate(c.replace(/^Grade \w+:\s*/i, ''), 125), level: 0 })),
      notes: [target && `Learning target: ${target}`, criteria.length && `Success criteria:\n- ${criteria.join('\n- ')}`]
        .filter(Boolean).join('\n\n'),
    })
  }

  // Vocabulary
  const newV = asList(lo.new_vocabulary).map(clean).filter(Boolean)
  const knownV = asList(lo.known_vocabulary).map(clean).filter(Boolean)
  if (newV.length || knownV.length) {
    slides.push({
      heading: 'Words to Know', layout: 'cards', callout: 'Listen for these words during the lesson.',
      bullets: [...newV, ...knownV].slice(0, 6).map((w) => ({ text: truncate(w, 65), level: 0 })),
      notes: [newV.length && `New: ${newV.join(', ')}`, knownV.length && `Review: ${knownV.join(', ')}`]
        .filter(Boolean).join('\n'),
    })
  }

  const teachText = lo.whole_group_instruction || lo.direct_instruction || lo.mini_lesson
  if (teachText) slides.push({ heading: 'Watch & Notice', layout: 'focus', callout: 'What does success look like?', bullets: sentences(teachText, 4).map((text) => ({ text: truncate(text, 125), level: 0 })), notes: String(teachText) })

  const warmup = lo.warm_up || lo.opening
  if (warmup) slides.push({ heading: 'Get Ready', layout: 'steps', callout: 'Start here', bullets: studentSteps(warmup, 4), notes: String(warmup) })

  const activity = lo.independent_practice || lo.fitness_activities || lo.main_activity || lo.guided_practice
  if (activity) slides.push({ heading: 'Your Activity', layout: 'steps', callout: 'Do these in order', bullets: studentSteps(activity), notes: String(activity) })

  // Safety notes
  const safety = asList(lo.safety_notes).map(clean).filter(Boolean)
  if (safety.length) {
    slides.push({
      heading: 'Be Safe & Ready', layout: 'safety', callout: 'STOP · LOOK · LISTEN',
      bullets: safety.slice(0, MAX_BULLETS).map((s) => ({ text: truncate(s, 170), level: 0 })),
      notes: safety.join('\n'),
    })
  }

  if (criteria.length) slides.push({ heading: 'Check Yourself', layout: 'cards', callout: 'Can you show or explain these?', bullets: criteria.slice(0, 4).map((c) => ({ text: truncate(c.replace(/^Grade \w+:\s*/i, ''), 110), level: 0 })), notes: criteria.join('\n') })

  const closure = sentences(lo.closure, 3)
  slides.push({ heading: 'Reflect & Share', layout: 'reflection', callout: closure[0] || 'What did you learn, improve, or notice today?', bullets: closure.slice(1).map((text) => ({ text: truncate(text, 120), level: 0 })), notes: String(lo.closure || '') })

  return { title, subtitle, meta, slides }
}

// POST the slide spec to the paid-gated function and download the returned .pptx.
// Throws { status: 403 } when the caller isn't a paid subscriber.
export async function requestPptx({ filename, title, subtitle, meta, slides }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    const err = new Error('Your sign-in has expired. Refresh the page, sign in again, and retry the PowerPoint download.')
    err.status = 401
    throw err
  }
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pptx`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename, title, subtitle, meta, slides }),
    })
  } catch {
    throw new Error('Could not reach the download service. Check your internet connection and try again.')
  }
  if (!res.ok) {
    let message = 'Download failed'
    try { message = (await res.json()).error ?? message } catch { /* non-JSON */ }
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  const blob = await res.blob()
  if (!blob.size) throw new Error('The PowerPoint file was empty. Please try the download again.')
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = `${String(filename || 'lesson').replace(/[^a-z0-9._-]+/gi, '-')}.pptx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
