/**
 * Physical Therapists (PT) prompt builder.
 *
 * Generates INSTRUCTIONAL / ACTIVITY plans for school-based PTs to adapt to
 * their own caseload and treatment plans. PT is a licensed clinical profession
 * — this tool is an activity-idea aid ONLY. It does not diagnose, evaluate,
 * determine eligibility for services, or replace clinical judgment.
 *
 * Standards: APTA Standards of Practice for Physical Therapy (primary), and the
 * Academy of Pediatric Physical Therapy (APTA Pediatric) for school-based/
 * pediatric practice. School-based PT is a RELATED SERVICE under IDEA — it works
 * within the EDUCATION system to support a student's ACCESS to and PARTICIPATION
 * in their educational environment (mobility, positioning, gross motor function),
 * distinct from medical/clinical rehabilitation. State licensure varies (each
 * state's Physical Therapist Practice Act) — every output carries a verify-your-state note.
 *
 * DISTINCT FROM OT: OT = fine motor, sensory processing, ADLs. PT = GROSS motor,
 * mobility, gait, balance, positioning, and functional movement. Content stays on
 * the PT side. PT also COMPLEMENTS (never duplicates) the Adaptive PE module —
 * here the focus is PT-specific therapeutic activity ideas, not full PE lessons.
 */

const BANDS = {
  "k-2": { label: "K–2", context: "young children — play-based, concrete, movement-rich; short activities with lots of modeling; foundational gross-motor, balance, and mobility building in playful contexts." },
  "3-5": { label: "3–5", context: "upper elementary — structured practice with growing independence; balance/coordination, endurance, and navigating the school environment more independently; still concrete, engaging supports." },
  "6-8": { label: "6–8", context: "middle school / pre-teens — AGE-RESPECTFUL contexts and materials (peers, interests, real school routines); mobility, endurance, and participation with independence; never childish, even when targets are foundational." },
  "9-12": { label: "9–12", context: "high school / teens — dignified, real-world contexts (independence, transitions, jobs, community mobility); adult-relevant framing, never babyish; lean toward functional mobility for independence and community/vocational participation." },
}

const AREAS = {
  gross_motor: { label: "Gross motor skills", guide: "whole-body balance, coordination, core and lower-extremity strength, endurance, and motor planning — activities that integrate into the classroom or gym (e.g., balance and stability tasks, obstacle courses, ball skills, movement games) to build the motor foundation for school participation." },
  mobility_positioning: { label: "Mobility & positioning", guide: "safe, efficient movement through the school environment — walking in hallways, managing stairs and curbs, transfers, and transitions between activities/settings — plus proper seating and positioning strategies (alignment, postural support, standing/positioning schedules) that enable classroom participation. Emphasize safety and energy conservation." },
  adaptive_pe_crossover: { label: "Adaptive PE / recreation crossover", guide: "PT-specific THERAPEUTIC activity ideas that help a student participate in PE and recess alongside peers — targeted movement prep, adapted skill components, and inclusion strategies. This COMPLEMENTS the Adaptive PE module: give therapeutic activity ideas (the PT lens), NOT a full PE lesson plan or curriculum." },
  functional_mobility: { label: "Functional mobility & independence", guide: "secondary-focus — functional mobility for independence (efficient, safe movement across the campus and community), activities supporting participation in vocational/community settings, and mobility endurance for real teen/young-adult routines, framed with dignity (real, adult-relevant contexts; never childish)." },
}

// The non-negotiable clinical boundary, injected into every generation.
const FRAMING = `CRITICAL — this is an INSTRUCTIONAL / ACTIVITY-PLANNING aid only, NOT a clinical tool:
- Do NOT diagnose, evaluate, determine eligibility for PT services, or assign a clinical label.
- Do NOT write a treatment plan, plan of care, or clinical goal (no "the student will… by [date] with X% accuracy" goal language), and do NOT give a prognosis.
- Do NOT replace clinical judgment. Frame EVERYTHING as activity ideas the PT adapts to their own caseload, treatment plan, and clinical judgment — suggestions, not protocols ("you might," "consider," "one option").
- Avoid legal/compliance language (do not cite IDEA/statute specifics or licensure law); keep it purely instructional/activity-based.
- Set clinical_boundary_note to a brief reminder that these are activity ideas to adapt to the PT's caseload and treatment plan — not a diagnosis, evaluation, eligibility determination, treatment plan, or substitute for clinical judgment.

STAY ON THE PT SIDE: address GROSS motor, mobility, gait, balance, positioning, strength, endurance, and functional movement — NOT fine-motor/handwriting, sensory processing, or ADLs (those are the OT's domain). When the adaptive-PE-crossover area is used, give PT-specific therapeutic activity ideas that enable PE/recess participation — do NOT write a full PE lesson.

AGE & DIGNITY: match materials and tone to the student's AGE, not their skill level. For middle/high-school students, use age-respectful, real-world contexts (peers, interests, independence, community mobility) — never childish characters, cartoons, or babyish materials for a teen working on foundational mobility or gross-motor targets.`

const STANDARDS = `Ground activities in the profession's frameworks:
- APTA Standards of Practice for Physical Therapy (American Physical Therapy Association) — the profession's governing standards of practice. Framework field: "APTA Standards".
- Academy of Pediatric Physical Therapy (APTA Pediatric) — the specialized section for school-based/pediatric PT practice. Framework field: "APTA Pediatric".
- School-based practice note: school-based PT is a RELATED SERVICE under IDEA and works within the EDUCATION system (not the medical/rehab system) to support the student's ACCESS to and PARTICIPATION in their educational environment (mobility, positioning, gross motor function) — keep activities educationally relevant and tied to school routines and access, not general medical rehabilitation. Framework field for this lens: "APTA (School-Based / IDEA related service)".`

const STATE_DISCLAIMER = `PT licensure and credentialing requirements vary by state and setting (each governed by that state's Physical Therapist Practice Act). Do NOT claim compliance with any specific state's requirements. Populate state_verification_note with a brief reminder to verify the PT's own state licensure/credentialing requirements.`

const GRADING_GUIDANCE = `grading_the_activity must give at least one way to SIMPLIFY (grade down) and one way to CHALLENGE (grade up) the SAME activity — a core PT activity-analysis / progression move. Each entry names the adjustment ("To simplify" or "To challenge") and how to make it for THIS activity.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "Physical Therapists",
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
- subject: always exactly "Physical Therapists".
- tier: always exactly "k12".
- grade_bands: JSON array of grade numbers (K = 0) covered by this band.
- target_area_summary: the gross-motor / mobility skill or area this session works on (a plain description, NOT an IEP/clinical goal).
- warm_up: a brief opener that primes the body for movement (e.g., gentle mobility, activation, or a movement warm-up appropriate to the target).
- activities: 2–3 concrete activities, each with name, how_to_run (step by step, equipment/setup in hand), and why_it_works (the PT rationale in terms of the gross-motor / mobility skill).
- supports_and_adaptations: 3–5 specific supports the PT can use in the moment — positioning/alignment, guarding/spotting and safe assistance, adaptive/mobility equipment, environmental setup, physical-assist → fading, and visual/verbal cues. Phrased as usable moves, not a rigid protocol.
- grading_the_activity: ${GRADING_GUIDANCE}
- materials: specific, age-appropriate equipment (real objects, age-relevant tasks, adaptive/mobility equipment) — nothing childish for teens.
- generalization: how to carry the skill into real school routines and functional participation (moving between classes, PE/recess, community/vocational settings).
- progress_check: an INFORMAL way to notice how the target went this session — the PT folds it into their own data system and goals; NOT a clinical assessment, evaluation, or eligibility measure.
- age_dignity_note: one sentence naming how materials/tone are kept age-appropriate and dignified for this band.
- standards_alignment: 2–4 entries; framework field exactly one of the framework names above.
- MOVEMENT & EQUIPMENT SAFETY: gross-motor, balance, stair/transfer, gait, and mobility-equipment activities carry real fall/injury risk. Keep guidance general and individualized — proper guarding/spotting, supervision, and any mobility/therapeutic equipment (gait belt, walker, stander, etc.) must be selected and cleared by the treating PT and team for the individual student; say so rather than prescribing.
- ${STATE_DISCLAIMER}`

export function buildPtPrompt({ gradeBand = "3-5", contentArea = "gross_motor", focus = "", sessionLengthMinutes = 30, teacherNotes = "" }) {
  const band = BANDS[gradeBand] ?? BANDS["3-5"]
  const area = AREAS[contentArea] ?? AREAS.gross_motor

  const system = `You are an experienced school-based Physical Therapist writing session ACTIVITY ideas for a fellow PT to adapt to their own caseload and treatment plans. Your activities are practical, evidence-informed, engaging, and grounded in real school routines and educational access.

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

  const user = `Generate PT session activity ideas:

- Service area: ${area.label}
- Specific target / focus: ${focus || "(choose an appropriate, age-appropriate target for this area and band)"}
- Grade band: ${band.label} — ${band.context}
- Session length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- PT notes: ${teacherNotes}` : ""}

Activity ideas to adapt to your caseload — not a diagnosis, evaluation, or treatment plan. Do not use student names. Return the JSON object now.`

  return { system, user }
}
