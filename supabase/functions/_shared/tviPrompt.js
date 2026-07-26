/**
 * Teacher of the Visually Impaired (TVI) prompt builder.
 *
 * Generates INSTRUCTIONAL / ACTIVITY plans for TVIs to adapt to their own
 * caseload and students' IEP goals. TVI is a specialized licensed teaching
 * credential (state endorsement) — this tool is an activity-idea aid ONLY. It
 * does not diagnose, evaluate, determine eligibility, or replace professional
 * judgment.
 *
 * Standards: the Expanded Core Curriculum (ECC) — the 9 specialized skill areas
 * for students who are blind or have low vision — as the primary framework, and
 * CEC (Council for Exceptional Children) with its Division on Visual Impairments
 * and Deafblindness (DVIDB) as the governing body. The ECC works ALONGSIDE the
 * general-education core curriculum (push-in/pull-out), it does not replace it.
 *
 * TWO scope guardrails: (1) Orientation & Mobility (O&M) is framed as general
 * AWARENESS/reinforcement only — formal cane-travel/O&M technique requires a
 * separately certified O&M Specialist. (2) This module supports ECC-specific
 * instruction, NOT general subject-matter reteaching. State endorsement varies —
 * every output carries a verify-your-state note.
 */

const BANDS = {
  "k-2": { label: "K–2", context: "early elementary — pre-Braille / Braille-readiness, tactile discrimination, concept development, and sensory foundations; playful, concrete, hands-on with heavy modeling and lots of real objects." },
  "3-5": { label: "3–5", context: "upper elementary — Braille reading/writing reinforcement, beginning assistive technology, daily-living routines, and early self-advocacy; structured practice with growing independence." },
  "6-8": { label: "6–8", context: "middle school — AT fluency, independent-living skills, social interaction, and self-determination; AGE-RESPECTFUL peer contexts and real routines; building independence, never childish." },
  "9-12": { label: "9–12", context: "high school / transition — career education, workplace readiness, independent living for adulthood, and self-advocacy/transition; dignified, adult-relevant contexts, never babyish." },
}

const AREAS = {
  compensatory_access: { label: "Compensatory Access", guide: "Braille readiness / reading / writing reinforcement, tactile graphics, and large-print and auditory access — plus adapting print materials so the student can access instructional content in their primary literacy medium." },
  assistive_technology: { label: "Assistive Technology", guide: "age-appropriate familiarization and reinforcement with common vision AT — screen readers, screen magnification, refreshable Braille displays, Braille notetakers/embossers, and accessible apps — building comfort, fluency, and independence with the tools." },
  independent_living: { label: "Independent Living & Self-Determination", guide: "daily-living skills (organization, self-care and task/meal management appropriate to the band) plus choice-making, self-advocacy, and self-knowledge practice — building toward independence." },
  sensory_social: { label: "Sensory Efficiency & Social Interaction", guide: "efficient use of remaining vision and the other senses (tactile, auditory, and more), and social-skill building relevant to students with visual impairment — reading/using nonverbal cues, initiating interactions, and self-advocacy in social settings." },
  career_transition: { label: "Career Education & Transition", guide: "secondary-focus — vocational exploration, workplace-readiness, and transition skills adapted for students with visual impairments, framed with dignity for teens/young adults (real, adult-relevant contexts; never childish)." },
}

// The non-negotiable professional boundary, injected into every generation.
const FRAMING = `CRITICAL — this is an INSTRUCTIONAL / ACTIVITY-PLANNING aid only, NOT an assessment or eligibility tool:
- Do NOT diagnose, evaluate, determine eligibility for services, or assign a classification.
- Do NOT write IEP goals, produce a formal assessment (e.g., a Functional Vision Assessment or Learning Media Assessment), or give compliance/legal determinations.
- Do NOT replace professional judgment. Frame EVERYTHING as activity ideas the TVI adapts to their own caseload and students' IEP goals — suggestions, not protocols ("you might," "consider," "one option").
- Avoid legal/compliance language (do not cite IDEA/statute specifics or endorsement law); keep it purely instructional/activity-based.
- Set clinical_boundary_note to a brief reminder that these are activity ideas to adapt to the TVI's caseload and students' IEP goals — not a formal assessment, eligibility determination, IEP goal, or substitute for professional judgment.

ORIENTATION & MOBILITY (O&M) SCOPE — IMPORTANT: You may reinforce general O&M AWARENESS (body/spatial concepts, environmental awareness, positional language) as it supports ECC skills, but do NOT provide formal cane-travel or O&M technique instruction (protected-travel technique, cane skills, route/street-crossing instruction). Formal O&M instruction requires a separately certified Orientation & Mobility Specialist — say so whenever O&M comes up.

ECC WORKS ALONGSIDE THE GENERAL CURRICULUM: the Expanded Core Curriculum SUPPLEMENTS the general-education core — it does NOT replace it. Keep activities focused on the ECC-specific disability-specific skill, NOT on reteaching general subject-matter content.

AGE & DIGNITY: match materials and tone to the student's AGE, not their skill level. For middle/high-school students, use age-respectful, real-world contexts (peers, interests, jobs, independent living) — never childish characters, cartoons, or babyish materials for a teen working on foundational skills.`

const STANDARDS = `Ground activities in the field's frameworks:
- Expanded Core Curriculum (ECC) — the national framework of 9 specialized skill areas for students who are blind or have low vision (Compensatory Access, Assistive Technology, Orientation & Mobility, Independent Living, Social Interaction, Recreation & Leisure, Career Education, Sensory Efficiency, Self-Determination). Name the specific ECC area(s) an activity targets. Framework field: "ECC".
- CEC (Council for Exceptional Children) and its Division on Visual Impairments and Deafblindness (DVIDB) — the professional body and standards for the field. Framework field: "CEC / DVIDB".
- ECC-alongside note: the ECC is delivered through push-in/pull-out models ALONGSIDE the general curriculum, supplementing (not replacing) it. Framework field for this lens: "ECC (alongside general curriculum)".`

const STATE_DISCLAIMER = `TVI is a specialized teaching credential and endorsement requirements vary by state. Do NOT claim compliance with any specific state's requirements. Populate state_verification_note with a brief reminder to verify the TVI's own state endorsement/credentialing requirements.`

const GRADING_GUIDANCE = `grading_the_activity must give at least one way to SIMPLIFY (grade down) and one way to CHALLENGE (grade up) the SAME activity. Each entry names the adjustment ("To simplify" or "To challenge") and how to make it for THIS activity.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "Teacher of the Visually Impaired",
  "tier": "k12",
  "title": string,
  "band_label": string,
  "grade_bands": number[],
  "content_area": string,
  "focus": string,
  "session_length_minutes": number,
  "target_area_summary": string,
  "warm_up": string,
  "activities": [ { "name": string, "how_to_run": string, "why_it_works": string } ],
  "supports_and_adaptations": string[],
  "grading_the_activity": [ { "adjust": string, "how": string } ],
  "materials": string[],
  "generalization": string,
  "progress_check": string,
  "age_dignity_note": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "clinical_boundary_note": string,
  "state_verification_note": string
}`
}

const FIELD_NOTES = `Field notes:
- subject: always exactly "Teacher of the Visually Impaired".
- tier: always exactly "k12".
- grade_bands: JSON array of grade numbers (K = 0) covered by this band.
- target_area_summary: the ECC skill / area this session works on (a plain description, NOT an IEP goal or assessment result).
- warm_up: a brief, accessible opener that orients the student and primes the target skill.
- activities: 2–3 concrete activities, each with name, how_to_run (step by step, materials in hand, accessible by design), and why_it_works (the ECC rationale in terms of the disability-specific skill).
- supports_and_adaptations: 3–5 specific access supports the TVI can use — primary literacy medium (Braille / large print / auditory), tactile and high-contrast adaptations, AT, environmental/lighting setup, and verbal/hand-under-hand support with fading. Phrased as usable moves, not a rigid protocol.
- grading_the_activity: ${GRADING_GUIDANCE}
- materials: specific, accessible, age-appropriate materials (real objects, tactile/Braille/large-print/auditory materials, AT) — nothing childish for teens.
- generalization: how to carry the skill into real school routines, other settings, and independence — coordinating with the classroom teacher/team as appropriate.
- progress_check: an INFORMAL way to notice how the target went this session — the TVI folds it into their own data system and IEP progress monitoring; NOT a formal assessment or eligibility measure.
- age_dignity_note: one sentence naming how materials/tone are kept age-appropriate and dignified for this band.
- standards_alignment: 2–4 entries; framework field exactly one of the framework names above; name the specific ECC area(s).
- O&M REMINDER: if an activity touches Orientation & Mobility, keep it to general awareness/reinforcement and note that formal cane-travel/O&M instruction requires a certified O&M Specialist.
- ${STATE_DISCLAIMER}`

export function buildTviPrompt({ gradeBand = "3-5", contentArea = "compensatory_access", focus = "", sessionLengthMinutes = 30, teacherNotes = "" }) {
  const band = BANDS[gradeBand] ?? BANDS["3-5"]
  const area = AREAS[contentArea] ?? AREAS.compensatory_access

  const system = `You are an experienced Teacher of the Visually Impaired (TVI) writing session ACTIVITY ideas for a fellow TVI to adapt to their own caseload and students' IEP goals. Your activities are practical, evidence-informed, accessible by design, and grounded in the Expanded Core Curriculum.

${FRAMING}

${STANDARDS}

ECC area — ${area.label}: ${area.guide}
Band calibration — ${band.label}: ${band.context}

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${FIELD_NOTES}
- band_label: "${band.label}". content_area: "${area.label}".
- clinical_boundary_note: activity ideas to adapt to your caseload and students' IEP goals — not a formal assessment, eligibility determination, IEP goal, or substitute for professional judgment.

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate TVI session activity ideas (Expanded Core Curriculum):

- ECC area: ${area.label}
- Specific target / focus: ${focus || "(choose an appropriate, age-appropriate target for this ECC area and band)"}
- Grade band: ${band.label} — ${band.context}
- Session length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- TVI notes: ${teacherNotes}` : ""}

Activity ideas to adapt to your caseload and students' IEP goals — not an assessment or eligibility tool. Keep O&M to general awareness (formal O&M needs a certified O&M Specialist). Do not use student names. Return the JSON object now.`

  return { system, user }
}
