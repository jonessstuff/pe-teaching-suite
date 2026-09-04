import { supabase } from '../lib/supabaseClient'

// Generate a classroom-management output (card | behavior-chart | reflection-form)
// via the edge function.
export async function generateClassroomCard({
  outputType = 'card', gradeBand = '6-8', classContext = '', challenge = '', classSize = '',
  noteType, studentName, noteDate, details, response, tone,
}) {
  const { data, error } = await supabase.functions.invoke('generate-classroom-management', {
    body: { outputType, gradeBand, classContext, challenge, classSize, noteType, studentName, noteDate, details, response, tone },
  })
  if (error) {
    let message = error.message ?? 'Generation failed'
    try {
      const bodyErr = await error.context?.json?.()
      if (bodyErr?.error) message = bodyErr.error
    } catch { /* Keep the original service message when the response has no JSON body. */ }
    throw new Error(message)
  }
  return data
}

// Persist a generated card. cardData holds the generated content plus the
// teacher's personalization (name, grade band, color theme).
export async function createCard({ name, cardData }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('classroom_management_cards')
    .insert({ teacher_id: user.id, name, card_data: cardData })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listCards() {
  const { data, error } = await supabase
    .from('classroom_management_cards')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getCard(id) {
  const { data, error } = await supabase
    .from('classroom_management_cards')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deleteCard(id) {
  const { error } = await supabase.from('classroom_management_cards').delete().eq('id', id)
  if (error) throw error
}
