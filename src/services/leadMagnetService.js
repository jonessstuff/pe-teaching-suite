import { supabase } from '../lib/supabaseClient'

// Calls the public `lead-magnet` edge function. Surfaces the real error message
// (the function returns it in the JSON body, not the generic FunctionsHttpError).
async function invoke(payload) {
  const { data, error } = await supabase.functions.invoke('lead-magnet', { body: payload })
  if (error) {
    let message = error.message ?? 'Something went wrong'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  return data
}

export function leadStart(email) {
  return invoke({ action: 'start', email })
}

export function leadFinalize({ token, subject, topic, gradeLabel, lessonObject }) {
  return invoke({ action: 'finalize', token, subject, topic, gradeLabel, lesson_object: lessonObject })
}

export function leadView(token) {
  return invoke({ action: 'view', token })
}
