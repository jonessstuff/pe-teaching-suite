/**
 * Builds the system + user prompt for year plan generation.
 *
 * The key pedagogical framing: Health and other non-PE subjects are woven
 * into PE class time as shorter focused breaks (1–3 weeks), not grouped
 * into a separate semester-long block. The generated sequence should feel
 * like how a real teacher actually runs a school year.
 */
import { resolveStateName } from "./stateNames.js";

export function buildYearPlanPrompt({ subjects, gradeBand, state, totalWeeks }) {
  const gradeStr = gradeBand === 0 ? 'Kindergarten' : `Grade ${gradeBand}`
  const subjectList = subjects.join(', ')
  const stateName = resolveStateName(state)
  const nonPE = subjects.filter((s) => s !== 'PE')
  const hasNonPE = nonPE.length > 0

  const system = `You are an experienced K-12 PE and Health curriculum coordinator helping a teacher plan a realistic school year. You understand how these subjects actually work in schools.

Key principles:
- PE units are the primary blocks, typically 2–6 weeks each.
- Health, Family Life, and Driver's Ed are taught as shorter focused stretches (1–3 weeks each) woven throughout the PE schedule — not grouped at the end or into a single semester block. A typical rhythm: 3–4 weeks of PE, then 1–2 weeks of Health, back to PE, etc.
- Sequence units with seasonal logic: fall suits outdoor invasion games and striking/fielding; winter suits fitness focus, gymnastics, and indoor activities; spring suits net/wall games, track/field, and return to outdoor activities.
- Vary activity types so students aren't doing the same sport category back to back (e.g. don't put two invasion-games units consecutively).
- The sequence should feel like what a real teacher would actually plan — practical, varied, and well-paced.

For each unit, include the relevant ${stateName} standard codes in "standards_covered". Use the correct code format for ${stateName} — for example, Virginia uses formats like "PE.6.2.a" for PE or "HE.6.1" for Health. Only include a standard code if you are confident it matches the official ${stateName} standards framework for that subject. If you are not certain of the exact code, use the closest real code structure you can reasonably infer and append " (verify against official standards)" to that code string — do not present an uncertain code as definitively correct. Aim for 2–4 codes per unit, focusing on the primary standards addressed rather than an exhaustive list.

Full-year coverage: Before finalizing your response, review the complete set of units and verify that the major standard strand categories for each subject at ${gradeStr} are each represented at least once somewhere across the year. If a major strand is absent, adjust units or add coverage to include it. The plan as a whole should address the key domains of each subject — not just the most commonly taught units.

Respond ONLY with valid JSON matching this exact schema. No text before or after.
{
  "units": [
    {
      "unit_name": string,
      "subject": string (must be one of: ${subjectList}),
      "estimated_weeks": integer (1–8),
      "standards_covered": string[],
      "notes": string or null
    }
  ]
}

CRITICAL: The sum of all estimated_weeks values MUST equal exactly ${totalWeeks}. Count carefully before responding.`

  const blendingNote = hasNonPE
    ? `\nFor the non-PE subject(s) (${nonPE.join(', ')}): distribute them as short units of 1–3 weeks woven naturally between PE units throughout the year. Do not group them all together.`
    : ''

  const user = `Build a full-year curriculum plan for a ${gradeStr} class in ${stateName}.

Subjects to include: ${subjectList}
Total school weeks: ${totalWeeks}${blendingNote}

Return all units in teaching order (start of year to end of year). The estimated_weeks values must sum to exactly ${totalWeeks}. Include standards_covered for every unit using the ${stateName} standards framework.`

  return { system, user }
}
