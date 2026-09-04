/**
 * Lesson generation service.
 *
 * Per the build spec's strategic constraints, the actual prompt
 * engineering and content libraries must stay server-side (Supabase
 * Edge Function) and are never exposed to the client. This module is
 * the client-side entry point that calls that function.
 *
 * ONE call here returns a full LessonObject (see src/types/lessonObject.js).
 * Every renderer (Plan Book, sub plan, etc.) then reads from that object
 * with zero additional AI calls.
 */

import { supabase } from '../lib/supabaseClient'
import { trackToolUsage } from './productUsageService'

/**
 * Turn a supabase-js FunctionsHttpError into an Error carrying the function's
 * REAL message. `functions.invoke` rejects with a generic
 * "Edge Function returned a non-2xx status code" and stashes the actual
 * Response (with our `{ error }` body) on `error.context`. Read it so callers
 * surface e.g. "Anthropic API error (529): overloaded" instead of the wrapper.
 */
/** A generation that ran past the platform's wall-clock window. Carries a
 *  clear, actionable message every generator can render as-is. */
export class GenerationTimeoutError extends Error {
  constructor() {
    super(
      'This took too long to generate — it can happen with very dense topics. ' +
      'Please try again. Narrowing the topic or splitting it into two usually helps.'
    )
    this.name = 'GenerationTimeoutError'
    this.isTimeout = true
  }
}

// Client-side backstop so the UI never hangs forever if the platform never
// responds. Real timeouts normally surface sooner as a 504/546 from Supabase's
// ~150s function limit and are mapped by toGenerationError below; this only
// guards a fully dropped/hung connection. Kept generous so it never cuts a
// generation the platform would have finished.
const GENERATION_TIMEOUT_MS = 5 * 60 * 1000
const GENERATION_RETRY_DELAYS_MS = [1200, 3000]
const GENERATION_MODULE_BY_FUNCTION = {
  'generate-adaptive-pe': 'Adaptive PE',
  'generate-art-lesson': 'Art',
  'generate-dance': 'Dance',
  'generate-theater': 'Theater / Drama',
  'generate-music-lesson': 'Music',
  'generate-stem-lesson': 'STEM',
  'generate-library-lesson': 'Library & Media',
  'generate-library-unit': 'Library & Media',
  'generate-maker-project': 'Library & Media',
  'generate-cte-lesson': 'CTE',
  'generate-world-languages': 'World Languages',
  'generate-jrotc': 'JROTC',
  'generate-elementary-tech': 'Elementary Technology',
  'generate-esl-specialist': 'ESL / ELL',
  'generate-gifted-talented': 'Gifted & Talented',
  'generate-special-education': 'Special Education',
  'generate-reading-specialist': 'Reading Specialists',
  'generate-math-specialist': 'Math Specialists',
  'generate-early-childhood': 'Early Childhood / Pre-K',
  'generate-school-counselor': 'School Counselors',
  'generate-intervention': 'Interventionists',
  'generate-slp': 'Speech-Language Pathology',
  'generate-ot': 'Occupational Therapists',
  'generate-pt': 'Physical Therapists',
  'generate-tvi': 'Teacher of the Visually Impaired',
  'generate-dhh': 'Teacher of the Deaf & Hard of Hearing',
  'generate-ecse': 'Early Childhood Special Education',
  'generate-sst-activity': 'Student Support Team',
  'generate-test-prep': 'Test Prep',
  'generate-staff-pd': 'Staff PD & Meeting Planning',
  'generate-instructional-coaching': 'Instructional Coaching',
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generationTrackingContext(name, options) {
  const body = options?.body ?? {}
  const rawSubject = body.subject || body.moduleLabel || body.module || ''
  const moduleLabel = rawSubject === 'PE' || rawSubject === 'Health' || rawSubject === 'Family Life' || rawSubject === "Driver's Ed"
    ? 'PE & Health'
    : rawSubject || GENERATION_MODULE_BY_FUNCTION[name] || null
  return {
    toolKey: `ai-${name.replace(/^generate-/, '')}`,
    moduleLabel,
  }
}

function trackGeneration(name, action, options, metadata = {}) {
  const { toolKey, moduleLabel } = generationTrackingContext(name, options)
  void trackToolUsage(toolKey, action, { moduleLabel, metadata })
}

// Invoke an edge function but never wait past GENERATION_TIMEOUT_MS. Returns the
// same { data, error } shape as functions.invoke, or rejects with a
// GenerationTimeoutError (surfaced directly to the caller's catch).
async function invokeWithTimeout(name, options) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new GenerationTimeoutError()), GENERATION_TIMEOUT_MS)
  })
  try {
    return await Promise.race([supabase.functions.invoke(name, options), timeout])
  } finally {
    clearTimeout(timer)
  }
}

// Every AI-backed tool gets the same quiet recovery behavior. A caller that
// manages its own visible retry/resume flow (the Unit Builder) can set the
// private __clientHandlesRetry flag in its request body; the flag is removed
// before the request leaves the browser.
async function invokeGenerationFunction(name, options) {
  const body = options?.body ?? {}
  const clientHandlesRetry = body.__clientHandlesRetry === true
  const safeBody = { ...body }
  delete safeBody.__clientHandlesRetry
  const safeOptions = { ...options, body: safeBody }
  const maxAttempts = clientHandlesRetry ? 1 : 3
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let result
    try {
      result = await invokeWithTimeout(name, safeOptions)
    } catch (error) {
      if (!clientHandlesRetry) trackGeneration(name, 'generation_failed', options, { attempts: attempt, issue: 'timeout' })
      throw error
    }

    const responseError = result.error || (typeof result.data?.error === 'string' ? new Error(result.data.error) : null)
    if (!responseError) {
      if (attempt > 1) trackGeneration(name, 'generation_recovered', options, { attempts: attempt, issue: 'temporary_service_error' })
      return result
    }

    lastError = await toGenerationError(responseError)
    if (!lastError.isRetryable || attempt === maxAttempts) {
      if (!clientHandlesRetry) {
        trackGeneration(name, 'generation_failed', options, {
          attempts: attempt,
          issue: lastError.issue || 'generation_error',
        })
      }
      return { data: result.data, error: lastError }
    }

    trackGeneration(name, 'generation_retry', options, {
      attempts: attempt + 1,
      issue: lastError.issue || 'temporary_service_error',
    })
    await pause(GENERATION_RETRY_DELAYS_MS[attempt - 1])
  }

  return { data: null, error: lastError ?? new Error('Generation failed') }
}

async function toGenerationError(error) {
  // Prefer the function's real error body (e.g. "Anthropic API error (529): overloaded").
  let message = error?.message ?? 'Generation failed'
  try {
    const body = await error?.context?.json?.()
    if (body?.error) message = body.error
  } catch { /* no JSON body — e.g. a gateway timeout returns HTML/empty */ }
  const status = error?.context?.status
  if (
    status === 429 || status === 502 || status === 503 || status === 529 ||
    /overload|rate.?limit|temporarily unavailable|failed to send a request|network error/i.test(message)
  ) {
    const busy = new Error('The lesson service is unusually busy right now. PlansK12 retried automatically, but it still needs another moment. Your entries are safe—please try again shortly.')
    busy.isRetryable = true
    busy.issue = status === 429 || /rate.?limit/i.test(message) ? 'rate_limited' : 'service_busy'
    return busy
  }
  // No structured body → detect a platform timeout / gateway / dropped connection
  // and turn the generic wrapper into a clear, retryable message.
  if (
    status === 504 || status === 546 ||
    /timeout|timed out|gateway|failed to send a request|network error|deadline exceeded/i.test(message)
  ) {
    return new GenerationTimeoutError()
  }
  const mapped = new Error(message)
  mapped.issue = 'generation_error'
  return mapped
}

/**
 * @typedef {Object} GenerateLessonInput
 * @property {number[]} gradeBands       e.g. [6, 7, 8]
 * @property {string} unit               e.g. "Striking & Fielding"
 * @property {string} topic              e.g. "Kickball Day 1"
 * @property {"PE"|"Health"|"Family Life"|"Driver's Ed"} subject
 * @property {string[]} equipment        equipment on hand
 * @property {number} classSize
 * @property {number} durationMinutes
 */

/**
 * Calls the server-side lesson generation function.
 *
 * @param {GenerateLessonInput} input
 * @returns {Promise<import("../types/lessonObject").LessonObject>}
 */
export async function generateLesson(input) {
  const { data, error } = await invokeGenerationFunction('generate-lesson', {
    body: input,
  })

  if (error) throw await toGenerationError(error)
  return data
}

/**
 * Calls the server-side sub plan generation function for an existing
 * saved lesson. Populates the sub_* fields on the LessonObject.
 *
 * @param {string} lessonId
 * @returns {Promise<Pick<import("../types/lessonObject").LessonObject,
 *   "sub_friendly_instructions" | "sub_script" | "sub_management_script" | "sub_diagram">>}
 */
export async function generateSubPlan(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-sub-plan', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateWeatherAlt(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-weather-alt', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

/**
 * Second-pass Visual Teaching Resources for a saved lesson. Returns
 * { visual_resources: [...] } (empty array when the lesson genuinely needs none)
 * plus { skipped_visuals } (informational — true diagrams left for a future
 * image-generation capability).
 */
export async function generateVisualResources(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-visual-resources', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateParentNote(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-parent-note', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateObservationSummary(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-observation-summary', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

/**
 * Calls the server-side quiz generation function for an existing saved lesson.
 * Returns { quiz_questions: { "<grade>": { grade, questions[] } } } to be
 * merged onto the LessonObject.
 *
 * @param {string} lessonId
 * @returns {Promise<{ quiz_questions: Object }>}
 */
export async function generateQuiz(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-quiz', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateYearPlan({ subjects, gradeBand, state, totalWeeks }) {
  const { data, error } = await invokeGenerationFunction('generate-year-plan', {
    body: { subjects, gradeBand, state, totalWeeks },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generatePoster(lessonObject) {
  const { data, error } = await invokeGenerationFunction('generate-poster', {
    body: { lessonObject },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateLibraryLesson(input) {
  const { data, error } = await invokeGenerationFunction('generate-library-lesson', {
    body: input,
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateAdaptivePE(input) {
  const { data, error } = await invokeGenerationFunction('generate-adaptive-pe', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateDance(input) {
  const { data, error } = await invokeGenerationFunction('generate-dance', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateTheater(input) {
  const { data, error } = await invokeGenerationFunction('generate-theater', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateGiftedTalented(input) {
  const { data, error } = await invokeGenerationFunction('generate-gifted-talented', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateSpecialEducation(input) {
  const { data, error } = await invokeGenerationFunction('generate-special-education', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateMakerProject(input) {
  const { data, error } = await invokeGenerationFunction('generate-maker-project', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateMathSpecialist(input) {
  const { data, error } = await invokeGenerationFunction('generate-math-specialist', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateTutoringSession(input) {
  const { data, error } = await invokeGenerationFunction('generate-tutoring-session', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateSstActivity(input) {
  const { data, error } = await invokeGenerationFunction('generate-sst-activity', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateSlp(input) {
  const { data, error } = await invokeGenerationFunction('generate-slp', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateOt(input) {
  const { data, error } = await invokeGenerationFunction('generate-ot', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateAfterSchoolClubs(input) {
  const { data, error } = await invokeGenerationFunction('generate-after-school-clubs', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateJrotc(input) {
  const { data, error } = await invokeGenerationFunction('generate-jrotc', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateDhh(input) {
  const { data, error } = await invokeGenerationFunction('generate-dhh', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateTvi(input) {
  const { data, error } = await invokeGenerationFunction('generate-tvi', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generatePt(input) {
  const { data, error } = await invokeGenerationFunction('generate-pt', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateWorldLanguages(input) {
  const { data, error } = await invokeGenerationFunction('generate-world-languages', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  // generate-world-languages streams a keepalive to beat the 150s idle timeout, so a
  // generation failure comes back as HTTP 200 with an { error } body. Surface it.
  if (data?.error) {
    throw new Error(data.error)
  }
  return data
}

export async function generateTestPrep(input) {
  const { data, error } = await invokeGenerationFunction('generate-test-prep', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  // generate-test-prep streams a keepalive to beat the 150s idle timeout, so a
  // generation failure comes back as HTTP 200 with an { error } body rather than a
  // non-2xx status. Surface it instead of rendering a broken session.
  if (data?.error) {
    throw new Error(data.error)
  }
  return data
}

export async function generateSchoolCounselor(input) {
  const { data, error } = await invokeGenerationFunction('generate-school-counselor', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateElementaryTech(input) {
  const { data, error } = await invokeGenerationFunction('generate-elementary-tech', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateStaffPd(input) {
  const { data, error } = await invokeGenerationFunction('generate-staff-pd', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateInstructionalCoaching(input) {
  const { data, error } = await invokeGenerationFunction('generate-instructional-coaching', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateIntervention(input) {
  const { data, error } = await invokeGenerationFunction('generate-intervention', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateEarlyChildhood(input) {
  const { data, error } = await invokeGenerationFunction('generate-early-childhood', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateEcse(input) {
  const { data, error } = await invokeGenerationFunction('generate-ecse', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateEslSpecialist(input) {
  const { data, error } = await invokeGenerationFunction('generate-esl-specialist', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateReadingSpecialist(input) {
  const { data, error } = await invokeGenerationFunction('generate-reading-specialist', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

export async function generateStemLesson(input) {
  const { data, error } = await invokeGenerationFunction('generate-stem-lesson', {
    body: input,
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateCteLesson(input) {
  const { data, error } = await invokeGenerationFunction('generate-cte-lesson', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  // generate-cte-lesson streams a keepalive to beat the 150s idle timeout, so a
  // generation failure comes back as HTTP 200 with an { error } body rather than a
  // non-2xx status. Surface it instead of rendering a broken lesson.
  if (data?.error) {
    throw new Error(data.error)
  }
  return data
}

export async function generateMusicLesson(input) {
  const { data, error } = await invokeGenerationFunction('generate-music-lesson', {
    body: input,
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateArtLesson(input) {
  const { data, error } = await invokeGenerationFunction('generate-art-lesson', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* Preserve the already-friendly mapped error message. */ }
    throw new Error(message)
  }
  return data
}

// ── Secondary tool generators ────────────────────────────────────────────────

export async function generateRubric(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-rubric', { body: { lessonId } })
  if (error) throw await toGenerationError(error)
  return data
}

// Worksheets: independent-practice materials in teacher-selected format types.
export async function generateWorksheet(lessonId, formats) {
  const { data, error } = await invokeGenerationFunction('generate-worksheet', { body: { lessonId, formats } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateFamilyNewsletter(lessonId, weekOf) {
  const { data, error } = await invokeGenerationFunction('generate-family-newsletter', { body: { lessonId, weekOf } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateDifferentiatedLesson(lessonId, differentiationType) {
  const { data, error } = await invokeGenerationFunction('generate-differentiated-lesson', { body: { lessonId, differentiationType } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateProgressNote(lessonId, { studentName, iepGoal, goalCategory, observationNotes, performanceLevel }) {
  const { data, error } = await invokeGenerationFunction('generate-progress-note', {
    body: { lessonId, studentName, iepGoal, goalCategory, observationNotes, performanceLevel },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateExitTicket(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-exit-ticket', { body: { lessonId } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateCrossCurricular(lessonId) {
  const { data, error } = await invokeGenerationFunction('generate-cross-curricular', { body: { lessonId } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateWarmup({ subject, gradeBand, duration, equipment }) {
  const { data, error } = await invokeGenerationFunction('generate-warmup', { body: { subject, gradeBand, duration, equipment } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateBehaviorNote({ studentName, incidentDescription, gradeLevel, subject }) {
  const { data, error } = await invokeGenerationFunction('generate-behavior-note', {
    body: { studentName, incidentDescription, gradeLevel, subject },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateIncidentReport({ dateTime, location, studentName, incidentDescription, witnesses, actionsTaken, followUpNeeded, subject }) {
  const { data, error } = await invokeGenerationFunction('generate-incident-report', {
    body: { dateTime, location, studentName, incidentDescription, witnesses, actionsTaken, followUpNeeded, subject },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateConferencePrep({ studentName, subject, gradeBand, strengths, areasOfConcern, goals }) {
  const { data, error } = await invokeGenerationFunction('generate-conference-prep', {
    body: { studentName, subject, gradeBand, strengths, areasOfConcern, goals },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateEoyNarrative({ subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals }) {
  const { data, error } = await invokeGenerationFunction('generate-eoy-narrative', {
    body: { subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateActivityBank({ subject, gradeBand, duration, occasion }) {
  const { data, error } = await invokeGenerationFunction('generate-activity-bank', {
    body: { subject, gradeBand, duration, occasion },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateFieldDay({ mode, numStudents, gradeLevels, duration, space, numStations, theme, gameIdea, equipmentOnHand }) {
  const { data, error } = await invokeGenerationFunction('generate-field-day', {
    body: { mode, numStudents, gradeLevels, duration, space, numStations, theme, gameIdea, equipmentOnHand },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateFitnessTestPrep({ gradeBands, testName, component, state, classSize, duration }) {
  const { data, error } = await invokeGenerationFunction('generate-fitness-test-prep', {
    body: { gradeBands, testName, component, state, classSize, duration },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateImportedLesson({ rawText, subject, gradeBand, targetLanguage, stemFocusArea }) {
  const { data, error } = await invokeGenerationFunction('generate-imported-lesson', {
    body: { rawText, subject, gradeBand, targetLanguage, stemFocusArea },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generatePacingGuide({ subject, grade, state, quarterIndex, totalQuarters, schoolYearStart, schoolYearEnd, daysPerWeek, breaks, topics, previousQuarters }) {
  const { data, error } = await invokeGenerationFunction('generate-pacing-guide', {
    body: { subject, grade, state, quarterIndex, totalQuarters, schoolYearStart, schoolYearEnd, daysPerWeek, breaks, topics, previousQuarters },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generatePortfolio({ subject, yearsTeaching, philosophySeeds }) {
  const { data, error } = await invokeGenerationFunction('generate-portfolio', {
    body: { subject, yearsTeaching, philosophySeeds },
  })
  if (error) throw await toGenerationError(error)
  return data
}

// ── Unit builders ─────────────────────────────────────────────────────────────

export async function generateLibraryUnit(input) {
  const { data, error } = await invokeGenerationFunction('generate-library-unit', { body: input })
  if (error) throw await toGenerationError(error)
  return data
}
