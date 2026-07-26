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
  const { data, error } = await supabase.functions.invoke('generate-lesson', {
    body: input,
  })

  if (error) throw error
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
/**
 * Calls the server-side unit generation function. Returns an array
 * of fully populated LessonObjects (one per day, 1-3 days), each
 * tagged with unit_day_number and unit_total_days.
 *
 * @param {Object} input
 * @returns {Promise<{ days: import("../types/lessonObject").LessonObject[] }>}
 */
export async function generateUnit(input) {
  // Safety-net timeout on the client side: if the Edge Function's connection
  // drops without a clean response (runtime kill), we surface a timeout error
  // rather than hanging indefinitely. The function itself races at 140 s and
  // returns a JSON error first in the normal timeout case.
  const CLIENT_TIMEOUT_MS = 5 * 60 * 1000

  const invokePromise = supabase.functions.invoke('generate-unit', { body: input })
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), CLIENT_TIMEOUT_MS)
  )

  let result
  try {
    result = await Promise.race([invokePromise, timeoutPromise])
  } catch {
    throw new Error('timeout')
  }

  const { data, error } = result

  if (error) {
    // FunctionsHttpError.message is always a generic string. The real message
    // is in the JSON body returned by the Edge Function.
    let message = error.message ?? 'Generation failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }

  return data
}

export async function generateSubPlan(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-sub-plan', {
    body: { lessonId },
  })

  if (error) throw error
  return data
}

export async function generateWeatherAlt(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-weather-alt', {
    body: { lessonId },
  })

  if (error) throw error
  return data
}

export async function generateParentNote(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-parent-note', {
    body: { lessonId },
  })

  if (error) throw error
  return data
}

export async function generateObservationSummary(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-observation-summary', {
    body: { lessonId },
  })

  if (error) throw error
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

  if (error) throw error
  return data
}

export async function generateYearPlan({ subjects, gradeBand, state, totalWeeks }) {
  const { data, error } = await supabase.functions.invoke('generate-year-plan', {
    body: { subjects, gradeBand, state, totalWeeks },
  })

  if (error) throw error
  return data
}

export async function generatePoster(lessonObject) {
  const { data, error } = await supabase.functions.invoke('generate-poster', {
    body: { lessonObject },
  })

  if (error) throw error
  return data
}

export async function generateLibraryLesson(input) {
  const { data, error } = await supabase.functions.invoke('generate-library-lesson', {
    body: input,
  })

  if (error) throw error
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
  const { data, error } = await supabase.functions.invoke('generate-stem-lesson', {
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
  const { data, error } = await supabase.functions.invoke('generate-music-lesson', {
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
  if (error) throw error
  return data
}

export async function generateFamilyNewsletter(lessonId, weekOf) {
  const { data, error } = await supabase.functions.invoke('generate-family-newsletter', { body: { lessonId, weekOf } })
  if (error) throw error
  return data
}

export async function generateDifferentiatedLesson(lessonId, differentiationType) {
  const { data, error } = await supabase.functions.invoke('generate-differentiated-lesson', { body: { lessonId, differentiationType } })
  if (error) throw error
  return data
}

export async function generateProgressNote(lessonId, { studentName, iepGoal, goalCategory, observationNotes, performanceLevel }) {
  const { data, error } = await supabase.functions.invoke('generate-progress-note', {
    body: { lessonId, studentName, iepGoal, goalCategory, observationNotes, performanceLevel },
  })
  if (error) throw error
  return data
}

export async function generateExitTicket(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-exit-ticket', { body: { lessonId } })
  if (error) throw error
  return data
}

export async function generateCrossCurricular(lessonId) {
  const { data, error } = await supabase.functions.invoke('generate-cross-curricular', { body: { lessonId } })
  if (error) throw error
  return data
}

export async function generateWarmup({ subject, gradeBand, duration, equipment }) {
  const { data, error } = await supabase.functions.invoke('generate-warmup', { body: { subject, gradeBand, duration, equipment } })
  if (error) throw error
  return data
}

export async function generateBehaviorNote({ studentName, incidentDescription, gradeLevel, subject }) {
  const { data, error } = await supabase.functions.invoke('generate-behavior-note', {
    body: { studentName, incidentDescription, gradeLevel, subject },
  })
  if (error) throw error
  return data
}

export async function generateIncidentReport({ dateTime, location, studentName, incidentDescription, witnesses, actionsTaken, followUpNeeded, subject }) {
  const { data, error } = await supabase.functions.invoke('generate-incident-report', {
    body: { dateTime, location, studentName, incidentDescription, witnesses, actionsTaken, followUpNeeded, subject },
  })
  if (error) throw error
  return data
}

export async function generateConferencePrep({ studentName, subject, gradeBand, strengths, areasOfConcern, goals }) {
  const { data, error } = await supabase.functions.invoke('generate-conference-prep', {
    body: { studentName, subject, gradeBand, strengths, areasOfConcern, goals },
  })
  if (error) throw error
  return data
}

export async function generateEoyNarrative({ subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals }) {
  const { data, error } = await supabase.functions.invoke('generate-eoy-narrative', {
    body: { subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals },
  })
  if (error) throw error
  return data
}

export async function generateActivityBank({ subject, gradeBand, duration, occasion }) {
  const { data, error } = await supabase.functions.invoke('generate-activity-bank', {
    body: { subject, gradeBand, duration, occasion },
  })
  if (error) throw error
  return data
}

export async function generateFieldDay({ numStudents, gradeLevels, duration, space, numStations, theme }) {
  const { data, error } = await supabase.functions.invoke('generate-field-day', {
    body: { numStudents, gradeLevels, duration, space, numStations, theme },
  })
  if (error) throw error
  return data
}

export async function generateFitnessTestPrep({ gradeBands, testName, component, state, classSize, duration }) {
  const { data, error } = await supabase.functions.invoke('generate-fitness-test-prep', {
    body: { gradeBands, testName, component, state, classSize, duration },
  })
  if (error) throw error
  return data
}

export async function generateImportedLesson({ rawText, subject, gradeBand, targetLanguage }) {
  const { data, error } = await supabase.functions.invoke('generate-imported-lesson', {
    body: { rawText, subject, gradeBand, targetLanguage },
  })
  if (error) throw error
  return data
}

export async function generatePacingGuide({ subject, grade, state, quarterIndex, totalQuarters, schoolYearStart, schoolYearEnd, daysPerWeek, breaks, topics, previousQuarters }) {
  const { data, error } = await supabase.functions.invoke('generate-pacing-guide', {
    body: { subject, grade, state, quarterIndex, totalQuarters, schoolYearStart, schoolYearEnd, daysPerWeek, breaks, topics, previousQuarters },
  })
  if (error) throw error
  return data
}

export async function generatePortfolio({ subject, yearsTeaching, philosophySeeds }) {
  const { data, error } = await supabase.functions.invoke('generate-portfolio', {
    body: { subject, yearsTeaching, philosophySeeds },
  })
  if (error) throw error
  return data
}

// ── Unit builders ─────────────────────────────────────────────────────────────

export async function generateLibraryUnit(input) {
  const CLIENT_TIMEOUT_MS = 5 * 60 * 1000

  const invokePromise = supabase.functions.invoke('generate-library-unit', { body: input })
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), CLIENT_TIMEOUT_MS)
  )

  let result
  try {
    result = await Promise.race([invokePromise, timeoutPromise])
  } catch {
    throw new Error('timeout')
  }

  const { data, error } = result

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
