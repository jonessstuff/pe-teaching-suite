/**
 * Occupational Therapists (OT) prompt builder.
 *
 * Generates INSTRUCTIONAL / ACTIVITY plans for school-based OTs to adapt to
 * their own caseload and treatment plans. OT is a licensed clinical profession
 * — this tool is an activity-idea aid ONLY. It does not diagnose, evaluate,
 * determine eligibility for services, or replace clinical judgment.
 *
 * Standards: the Occupational Therapy Practice Framework (OTPF-4, AOTA) as the
 * primary practice document, and AOTA Scope of Practice / Standards of Practice
 * as the governing body. School-based OT works within the EDUCATION system (not
 * the medical system) to support student participation in school "occupations."
 * State licensure/credentialing varies — every output carries a verify-your-state note.
 */

const BANDS = {
  "k-2": { label: "K–2", context: "young children — play-based, concrete, multisensory; short activities with lots of modeling; fine-motor and sensory foundations, pre-writing and early self-care." },
  "3-5": { label: "3–5", context: "upper elementary — structured practice with growing independence; handwriting fluency, organization, and self-regulation routines; still concrete, engaging supports." },
  "6-8": { label: "6–8", context: "middle school / pre-teens — AGE-RESPECTFUL contexts and materials (peers, interests, real routines); keyboarding/organization and independence; never childish, even when targets are foundational." },
  "9-12": { label: "9–12", context: "high school / teens — dignified, real-world contexts (jobs, self-advocacy, independent living); adult-relevant materials, never babyish; lean toward vocational/independent-living application." },
}

const AREAS = {
  fine_motor: { label: "Fine motor & handwriting readiness", guide: "pencil grip and grasp patterns, in-hand manipulation, scissor/cutting skills, hand and finger strengthening, bilateral coordination, and pre-writing/handwriting formation." },
  sensory: { label: "Sensory processing & self-regulation", guide: "sensory-diet-style movement / heavy-work and calming activities, self-regulation strategies (recognizing and managing arousal / 'engine' level), and sensory-friendly classroom accommodations. Individualize — a sensory strategy is never one-size-fits-all." },
  adls: { label: "Activities of daily living (ADLs)", guide: "age-appropriate independence and self-care relevant to the school day — managing clothing/fasteners and outerwear, backpack and materials organization, mealtime/utensil skills, and hygiene routines — building toward independence." },
  visual_motor: { label: "Visual-motor & visual-perceptual", guide: "eye-hand coordination, near-point and far-point (board) copying, form/letter formation, spatial organization on the page, and visual scanning/tracking that support handwriting and classroom work." },
  vocational: { label: "Vocational & independent-living readiness", guide: "secondary-focus — workplace-relevant fine-motor and organizational skills, task sequencing and time/materials management, and age-appropriate independent-living routines, framed with dignity for teens (real, adult-relevant contexts; never childish)." },
}

// The non-negotiable clinical boundary, injected into every generation.
const FRAMING = `CRITICAL — this is an INSTRUCTIONAL / ACTIVITY-PLANNING aid only, NOT a clinical tool:
- Do NOT diagnose, evaluate, determine eligibility for OT services, or assign a clinical label.
- Do NOT write a treatment plan, plan of care, or clinical goal (no "the student will… by [date] with X% accuracy" goal language), and do NOT give a prognosis.
- Do NOT replace clinical judgment. Frame EVERYTHING as activity ideas the OT adapts to their own caseload, treatment plan, and clinical judgment — suggestions, not protocols ("you might," "consider," "one option").
- Avoid legal/compliance language (do not cite IDEA/statute specifics or licensure law); keep it purely instructional/activity-based.
- Set clinical_boundary_note to a brief reminder that these are activity ideas to adapt to the OT's caseload and treatment plan — not a diagnosis, evaluation, eligibility determination, treatment plan, or substitute for clinical judgment.

AGE & DIGNITY: match materials and tone to the student's AGE, not their skill level. For middle/high-school students, use age-respectful, real-world contexts (peers, interests, jobs, independent living) — never childish characters, cartoons, or babyish materials for a teen working on foundational fine-motor, sensory, or ADL targets.`

const STANDARDS = `Ground activities in the profession's frameworks:
- Occupational Therapy Practice Framework: Domain and Process, 4th Edition (OTPF-4, AOTA) — the profession's core practice document (occupations, performance skills, contexts). Framework field: "OTPF-4".
- AOTA Scope of Practice and Standards of Practice for Occupational Therapy — the governing professional standards. Framework field: "AOTA (Scope & Standards)".
- School-based practice note: school-based OT works within the EDUCATION system (not the medical/health system) to support the student's participation in school "occupations" (handwriting, classroom participation, self-care, organization) — keep activities educationally relevant and tied to school routines. Framework field for this lens: "AOTA (School Practice)".`

const STATE_DISCLAIMER = `OT licensure and credentialing requirements vary by state and setting. Do NOT claim compliance with any specific state's requirements. Populate state_verification_note with a brief reminder to verify the OT's own state licensure/credentialing requirements.`

const GRADING_GUIDANCE = `grading_the_activity must give at least one way to SIMPLIFY (grade down) and one way to CHALLENGE (grade up) the SAME activity — a core OT activity-analysis move. Each entry names the adjustment ("To simplify" or "To challenge") and how to make it for THIS activity.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "Occupational Therapists",
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
- subject: always exactly "Occupational Therapists".
- tier: always exactly "k12".
- grade_bands: JSON array of grade numbers (K = 0) covered by this band.
- target_area_summary: the performance skill / area this session works on (a plain description, NOT an IEP/clinical goal).
- warm_up: a brief opener that primes the body / hands / attention for the target (e.g., heavy-work or a hand warm-up).
- activities: 2–3 concrete activities, each with name, how_to_run (step by step, materials in hand), and why_it_works (the OT rationale in terms of the performance skill).
- supports_and_adaptations: 3–5 specific supports the OT can use in the moment — positioning/seating, adaptive tools (pencil grips, slant board, adapted scissors), environmental setup, hand-over-hand → fading, and visual/verbal cues. Phrased as usable moves, not a rigid protocol.
- grading_the_activity: ${GRADING_GUIDANCE}
- materials: specific, age-appropriate materials (real objects, age-relevant tasks, adaptive equipment) — nothing childish for teens.
- generalization: how to carry the skill into real classroom and home routines and functional participation.
- progress_check: an INFORMAL way to notice how the target went this session — the OT folds it into their own data system and goals; NOT a clinical assessment, evaluation, or eligibility measure.
- age_dignity_note: one sentence naming how materials/tone are kept age-appropriate and dignified for this band.
- standards_alignment: 2–4 entries; framework field exactly one of the framework names above.
- SENSORY & EQUIPMENT SAFETY: keep any sensory or physical strategies general and individualized — sensory strategies and any adaptive/therapeutic equipment must be selected and cleared by the treating OT and team for the individual student; say so rather than prescribing.
- ${STATE_DISCLAIMER}`

export function buildOtPrompt({ gradeBand = "3-5", contentArea = "fine_motor", focus = "", sessionLengthMinutes = 30, teacherNotes = "" }) {
  const band = BANDS[gradeBand] ?? BANDS["3-5"]
  const area = AREAS[contentArea] ?? AREAS.fine_motor

  const system = `You are an experienced school-based Occupational Therapist writing session ACTIVITY ideas for a fellow OT to adapt to their own caseload and treatment plans. Your activities are practical, evidence-informed, engaging, and grounded in real school routines.

${FRAMING}

${STANDARDS}

Service area — ${area.label}: ${area.guide}
Band calibration — ${band.label}: ${band.context}

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${FIELD_NOTES}
- band_label: "${band.label}". content_area: "${area.label}".
- clinical_boundary_note: activity ideas to adapt to your caseload and treatment plan — not a diagnosis, evaluation, eligibility determination, treatment plan, or substitute for clinical judgment.

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate OT session activity ideas:

- Service area: ${area.label}
- Specific target / focus: ${focus || "(choose an appropriate, age-appropriate target for this area and band)"}
- Grade band: ${band.label} — ${band.context}
- Session length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- OT notes: ${teacherNotes}` : ""}

Activity ideas to adapt to your caseload — not a diagnosis, evaluation, or treatment plan. Do not use student names. Return the JSON object now.`

  return { system, user }
}
