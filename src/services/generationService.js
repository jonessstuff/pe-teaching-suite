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

async function toGenerationError(error) {
  // Prefer the function's real error body (e.g. "Anthropic API error (529): overloaded").
  try {
    const body = await error?.context?.json?.()
    if (body?.error) return new Error(body.error)
  } catch { /* no JSON body — e.g. a gateway timeout returns HTML/empty */ }
  const message = error?.message ?? 'Generation failed'
  // No structured body → detect a platform timeout / gateway / dropped connection
  // and turn the generic wrapper into a clear, retryable message.
  const status = error?.context?.status
  if (
    status === 504 || status === 546 ||
    /timeout|timed out|gateway|failed to send a request|network error|deadline exceeded/i.test(message)
  ) {
    return new GenerationTimeoutError()
  }
  return new Error(message)
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
  const { data, error } = await invokeWithTimeout('generate-lesson', {
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
  const { data, error } = await supabase.functions.invoke('generate-sub-plan', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateWeatherAlt(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-weather-alt', {
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
  const { data, error } = await supabase.functions.invoke('generate-visual-resources', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateParentNote(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-parent-note', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateObservationSummary(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-observation-summary', {
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
  const { data, error } = await supabase.functions.invoke('generate-quiz', {
    body: { lessonId },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateYearPlan({ subjects, gradeBand, state, totalWeeks }) {
  const { data, error } = await supabase.functions.invoke('generate-year-plan', {
    body: { subjects, gradeBand, state, totalWeeks },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generatePoster(lessonObject) {
  const { data, error } = await supabase.functions.invoke('generate-poster', {
    body: { lessonObject },
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateLibraryLesson(input) {
  const { data, error } = await supabase.functions.invoke('generate-library-lesson', {
    body: input,
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateAdaptivePE(input) {
  const { data, error } = await supabase.functions.invoke('generate-adaptive-pe', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateDance(input) {
  const { data, error } = await supabase.functions.invoke('generate-dance', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateTheater(input) {
  const { data, error } = await supabase.functions.invoke('generate-theater', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateGiftedTalented(input) {
  const { data, error } = await supabase.functions.invoke('generate-gifted-talented', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateSpecialEducation(input) {
  const { data, error } = await supabase.functions.invoke('generate-special-education', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateMakerProject(input) {
  const { data, error } = await supabase.functions.invoke('generate-maker-project', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateMathSpecialist(input) {
  const { data, error } = await supabase.functions.invoke('generate-math-specialist', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateTutoringSession(input) {
  const { data, error } = await supabase.functions.invoke('generate-tutoring-session', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateSstActivity(input) {
  const { data, error } = await supabase.functions.invoke('generate-sst-activity', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateSlp(input) {
  const { data, error } = await supabase.functions.invoke('generate-slp', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateOt(input) {
  const { data, error } = await supabase.functions.invoke('generate-ot', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateAfterSchoolClubs(input) {
  const { data, error } = await supabase.functions.invoke('generate-after-school-clubs', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateJrotc(input) {
  const { data, error } = await supabase.functions.invoke('generate-jrotc', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateDhh(input) {
  const { data, error } = await supabase.functions.invoke('generate-dhh', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateTvi(input) {
  const { data, error } = await supabase.functions.invoke('generate-tvi', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generatePt(input) {
  const { data, error } = await supabase.functions.invoke('generate-pt', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateWorldLanguages(input) {
  const { data, error } = await supabase.functions.invoke('generate-world-languages', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
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
  const { data, error } = await supabase.functions.invoke('generate-test-prep', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
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
  const { data, error } = await supabase.functions.invoke('generate-school-counselor', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateElementaryTech(input) {
  const { data, error } = await supabase.functions.invoke('generate-elementary-tech', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateStaffPd(input) {
  const { data, error } = await supabase.functions.invoke('generate-staff-pd', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateInstructionalCoaching(input) {
  const { data, error } = await supabase.functions.invoke('generate-instructional-coaching', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateIntervention(input) {
  const { data, error } = await supabase.functions.invoke('generate-intervention', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateEarlyChildhood(input) {
  const { data, error } = await supabase.functions.invoke('generate-early-childhood', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateEcse(input) {
  const { data, error } = await supabase.functions.invoke('generate-ecse', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateEslSpecialist(input) {
  const { data, error } = await supabase.functions.invoke('generate-esl-specialist', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateReadingSpecialist(input) {
  const { data, error } = await supabase.functions.invoke('generate-reading-specialist', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export async function generateStemLesson(input) {
  const { data, error } = await invokeWithTimeout('generate-stem-lesson', {
    body: input,
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateCteLesson(input) {
  const { data, error } = await supabase.functions.invoke('generate-cte-lesson', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
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
  const { data, error } = await invokeWithTimeout('generate-music-lesson', {
    body: input,
  })

  if (error) throw await toGenerationError(error)
  return data
}

export async function generateArtLesson(input) {
  const { data, error } = await supabase.functions.invoke('generate-art-lesson', {
    body: input,
  })

  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

// ── Secondary tool generators ────────────────────────────────────────────────

export async function generateRubric(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-rubric', { body: { lessonId } })
  if (error) throw await toGenerationError(error)
  return data
}

// Worksheets: independent-practice materials in teacher-selected format types.
export async function generateWorksheet(lessonId, formats) {
  const { data, error } = await supabase.functions.invoke('generate-worksheet', { body: { lessonId, formats } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateFamilyNewsletter(lessonId, weekOf) {
  const { data, error } = await supabase.functions.invoke('generate-family-newsletter', { body: { lessonId, weekOf } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateDifferentiatedLesson(lessonId, differentiationType) {
  const { data, error } = await supabase.functions.invoke('generate-differentiated-lesson', { body: { lessonId, differentiationType } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateProgressNote(lessonId, { studentName, iepGoal, goalCategory, observationNotes, performanceLevel }) {
  const { data, error } = await supabase.functions.invoke('generate-progress-note', {
    body: { lessonId, studentName, iepGoal, goalCategory, observationNotes, performanceLevel },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateExitTicket(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-exit-ticket', { body: { lessonId } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateCrossCurricular(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-cross-curricular', { body: { lessonId } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateWarmup({ subject, gradeBand, duration, equipment }) {
  const { data, error } = await supabase.functions.invoke('generate-warmup', { body: { subject, gradeBand, duration, equipment } })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateBehaviorNote({ studentName, incidentDescription, gradeLevel, subject }) {
  const { data, error } = await supabase.functions.invoke('generate-behavior-note', {
    body: { studentName, incidentDescription, gradeLevel, subject },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateIncidentReport({ dateTime, location, studentName, incidentDescription, witnesses, actionsTaken, followUpNeeded, subject }) {
  const { data, error } = await supabase.functions.invoke('generate-incident-report', {
    body: { dateTime, location, studentName, incidentDescription, witnesses, actionsTaken, followUpNeeded, subject },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateConferencePrep({ studentName, subject, gradeBand, strengths, areasOfConcern, goals }) {
  const { data, error } = await supabase.functions.invoke('generate-conference-prep', {
    body: { studentName, subject, gradeBand, strengths, areasOfConcern, goals },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateEoyNarrative({ subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals }) {
  const { data, error } = await supabase.functions.invoke('generate-eoy-narrative', {
    body: { subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateActivityBank({ subject, gradeBand, duration, occasion }) {
  const { data, error } = await supabase.functions.invoke('generate-activity-bank', {
    body: { subject, gradeBand, duration, occasion },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateFieldDay({ mode, numStudents, gradeLevels, duration, space, numStations, theme, gameIdea, equipmentOnHand }) {
  const { data, error } = await supabase.functions.invoke('generate-field-day', {
    body: { mode, numStudents, gradeLevels, duration, space, numStations, theme, gameIdea, equipmentOnHand },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateFitnessTestPrep({ gradeBands, testName, component, state, classSize, duration }) {
  const { data, error } = await invokeWithTimeout('generate-fitness-test-prep', {
    body: { gradeBands, testName, component, state, classSize, duration },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generateImportedLesson({ rawText, subject, gradeBand, targetLanguage, stemFocusArea }) {
  const { data, error } = await invokeWithTimeout('generate-imported-lesson', {
    body: { rawText, subject, gradeBand, targetLanguage, stemFocusArea },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generatePacingGuide({ subject, grade, state, quarterIndex, totalQuarters, schoolYearStart, schoolYearEnd, daysPerWeek, breaks, topics, previousQuarters }) {
  const { data, error } = await supabase.functions.invoke('generate-pacing-guide', {
    body: { subject, grade, state, quarterIndex, totalQuarters, schoolYearStart, schoolYearEnd, daysPerWeek, breaks, topics, previousQuarters },
  })
  if (error) throw await toGenerationError(error)
  return data
}

export async function generatePortfolio({ subject, yearsTeaching, philosophySeeds }) {
  const { data, error } = await supabase.functions.invoke('generate-portfolio', {
    body: { subject, yearsTeaching, philosophySeeds },
  })
  if (error) throw await toGenerationError(error)
  return data
}

// ── Unit builders ─────────────────────────────────────────────────────────────

export async function generateLibraryUnit(input) {
  const { data, error } = await invokeWithTimeout('generate-library-unit', { body: input })
  if (error) throw await toGenerationError(error)
  return data
}
