import { supabase } from '../lib/supabaseClient'

export async function getActiveYearPlan() {
  const { data: plans, error: planError } = await supabase
    .from('year_plans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (planError) throw planError
  if (!plans || plans.length === 0) return null

  const plan = plans[0]

  const { data: units, error: unitsError } = await supabase
    .from('year_plan_units')
    .select('*')
    .eq('year_plan_id', plan.id)
    .order('order_index', { ascending: true })

  if (unitsError) throw unitsError

  return { ...plan, units: units ?? [] }
}

export async function createYearPlan(name) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('year_plans')
    .insert({ user_id: user.id, name })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function bulkAddUnits(yearPlanId, units) {
  const rows = units.map((u, i) => ({
    year_plan_id: yearPlanId,
    order_index: i,
    subject: u.subject,
    unit_name: u.unit_name,
    estimated_weeks: Number(u.estimated_weeks),
    standards_covered: u.standards_covered ?? [],
    notes: u.notes ?? null,
    start_month: null,
    end_month: null,
  }))

  const { data, error } = await supabase
    .from('year_plan_units')
    .insert(rows)
    .select('*')
  if (error) throw error
  return data ?? []
}

export async function addUnit(yearPlanId, unitFields) {
  const { data: existing } = await supabase
    .from('year_plan_units')
    .select('order_index')
    .eq('year_plan_id', yearPlanId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existing?.length > 0 ? existing[0].order_index + 1 : 0

  const { data, error } = await supabase
    .from('year_plan_units')
    .insert({ year_plan_id: yearPlanId, order_index: nextIndex, ...unitFields })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateUnit(unitId, changes) {
  const { data, error } = await supabase
    .from('year_plan_units')
    .update(changes)
    .eq('id', unitId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteUnit(unitId) {
  const { error } = await supabase
    .from('year_plan_units')
    .delete()
    .eq('id', unitId)
  if (error) throw error
}

export async function reorderUnits(yearPlanId, orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('year_plan_units')
      .update({ order_index: i })
      .eq('id', orderedIds[i])
    if (error) throw error
  }
}
