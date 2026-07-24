/**
 * Speech-Language Pathologists (SLP) prompt builder.
 *
 * Generates INSTRUCTIONAL / ACTIVITY plans for school-based SLPs (Tier k12) and,
 * as an EXPERIMENTAL tier, adult rehabilitation contexts (Tier adult). SLP is a
 * licensed clinical profession — this tool is an activity-idea aid ONLY. It does
 * not diagnose, determine eligibility, or replace clinical judgment.
 *
 * Standards: ASHA Scope of Practice in Speech-Language Pathology (primary), and
 * ASHA "Roles and Responsibilities of SLPs in Schools" (k12 tier). State
 * licensure/credentialing varies — every output carries a verify-your-state note.
 *
 * The adult tier applies the STRICTEST version of the clinical boundary: no
 * treatment plan, no prognosis, and no swallowing/dysphagia clinical guidance
 * (a distinct, higher-risk domain that must come from the clinician's own assessment).
 */

const K12_BANDS = {
  "k-2": { label: "K–2", context: "young children — playful, concrete, movement- and play-based drill; short activities and lots of models." },
  "3-5": { label: "3–5", context: "upper elementary — structured practice with growing metalinguistic awareness; still concrete supports." },
  "6-8": { label: "6–8", context: "middle school / pre-teens — AGE-RESPECTFUL contexts and materials (peers, interests, real situations); never childish, even when targets are foundational." },
  "9-12": { label: "9–12", context: "high school / teens — dignified, real-world communication contexts (jobs, self-advocacy, social settings); adult-relevant materials, never babyish." },
}

const K12_AREAS = {
  articulation: { label: "Articulation / Phonological", guide: "speech-sound production practice — age-appropriate target sounds, placement/manner cues, minimal-pairs contrasts, from isolation → syllable → word → phrase → conversation." },
  language: { label: "Language (expressive & receptive)", guide: "vocabulary, syntax/grammar, following directions, and narrative/storytelling — both expressive and receptive, with visual and organizational supports." },
  fluency: { label: "Fluency", guide: "activities and strategies for students who stutter — easy onset, pausing/phrasing, self-monitoring, and building communication confidence. Handle with sensitivity and student comfort in mind; never pressure disfluency." },
  pragmatics: { label: "Social communication / Pragmatics", guide: "conversational turn-taking, topic maintenance, understanding non-literal language (idioms/sarcasm), perspective-taking, and reading social cues." },
  aac: { label: "AAC support", guide: "activities for students using AAC (SGDs, core boards, picture symbols) — build AAC use INTO the activity alongside verbal/other response options; model on the device (aided language stimulation) and honor all communication attempts." },
}

const ADULT_AREAS = {
  aphasia: { label: "Aphasia / language", guide: "functional word-finding, auditory comprehension, and expressive language for everyday communication (e.g., naming, following directions, conversation) after stroke." },
  cognitive_communication: { label: "Cognitive-communication", guide: "attention, memory, organization, and executive-function supports for communication after stroke/TBI — compensatory strategies and functional real-life tasks." },
  motor_speech: { label: "Motor speech", guide: "intelligibility-focused practice for dysarthria/apraxia — rate, loudness, over-articulation, and functional phrases (non-prescriptive activity ideas only)." },
  adult_pragmatics: { label: "Social communication", guide: "conversation, turn-taking, and social-communication practice in functional adult contexts after TBI/stroke." },
  adult_aac: { label: "AAC support", guide: "AAC activity ideas for adults with acquired communication impairment — building device/board/partner-assisted use into functional, dignified adult tasks." },
}

// The non-negotiable clinical boundary, injected into every tier.
const FRAMING = `CRITICAL — this is an INSTRUCTIONAL / ACTIVITY-PLANNING aid only, NOT a clinical tool:
- Do NOT diagnose a communication disorder, determine eligibility for services, or assign a clinical label.
- Do NOT write a treatment plan or clinical goal (no "the client will… by [date] with X% accuracy" goal language), and do NOT give a prognosis.
- Do NOT replace clinical judgment. Frame EVERYTHING as activity ideas the SLP adapts to their own caseload, treatment plan, and clinical judgment — suggestions, not protocols ("you might," "consider," "one option").
- Avoid legal/compliance language (do not cite IDEA/statute specifics or licensure law); keep it purely instructional/activity-based.
- Set clinical_boundary_note to a brief reminder that these are activity ideas to adapt to the SLP's caseload and treatment plan — not a diagnosis, eligibility determination, treatment plan, or substitute for clinical judgment.

AGE & DIGNITY: match materials and tone to the person's AGE, not their skill level. For middle/high-school students (and adults), use age-respectful, adult-relevant contexts — never childish characters, cartoons, or babyish materials for a teen or adult working on foundational targets.`

const STANDARDS = `Ground activities in the profession's frameworks:
- ASHA Scope of Practice in Speech-Language Pathology — the national governing framework. Framework field: "ASHA Scope of Practice".`

const SCHOOLS_STANDARD = `- ASHA "Roles and Responsibilities of Speech-Language Pathologists in Schools" — the school-practice policy. Framework field: "ASHA (Schools)".`

const STATE_DISCLAIMER = `SLP licensure and credentialing requirements vary by state and setting. Do NOT claim compliance with any specific state's requirements. Populate state_verification_note with a brief reminder to verify the SLP's own state licensure/credentialing requirements.`

const MODALITY_GUIDANCE = `response_modalities must offer genuinely different ways to respond and communicate (not just "say it") — include verbal/spoken, AAC (device / core board / picture symbols with aided language modeling), and a gesture/sign/non-verbal or partner-assisted option. Each entry names the modality and how a person uses it for THIS activity.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "Speech-Language Pathologists",
  "tier": string,
  "title": string,
  "band_label": string,
  "grade_bands": number[],
  "content_area": string,
  "focus": string,
  "session_length_minutes": number,
  "target_area_summary": string,
  "warm_up": string,
  "activities": [ { "name": string, "how_to_run": string, "why_it_works": string } ],
  "cueing_and_scaffolding": string[],
  "response_modalities": [ { "modality": string, "how": string } ],
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
- subject: always exactly "Speech-Language Pathologists".
- grade_bands: JSON array of grade numbers (K = 0) for a k12 band; [] for the adult tier.
- target_area_summary: the communication area/skill this session works on (a plain description, NOT an IEP/clinical goal).
- warm_up: a brief, engaging opener tied to the target.
- activities: 2–3 concrete activities, each with name, how_to_run (step by step, materials in hand), and why_it_works (the communication rationale).
- cueing_and_scaffolding: 3–5 specific supports the SLP can use in the moment (models, placement/phonetic cues, visual supports, sentence frames, wait time, fading of cues) — phrased as usable moves, not a rigid protocol.
- response_modalities: ${MODALITY_GUIDANCE}
- materials: specific, age-appropriate materials (real objects, age-relevant photos/topics, the student's AAC system) — nothing childish for teens/adults.
- generalization: how to carry the target into real, functional communication.
- progress_check: an INFORMAL way to notice how the target went this session — the SLP folds it into their own data system and goals; NOT a clinical assessment or eligibility measure.
- age_dignity_note: one sentence naming how materials/tone are kept age-appropriate and dignified for this band/tier.
- standards_alignment: 2–4 entries; framework field exactly one of the framework names above.
- ${STATE_DISCLAIMER}`

export function buildSlpPrompt(input) {
  return input?.gradeBand === "adult" ? buildAdultPrompt(input) : buildK12Prompt(input)
}

// ─── K-12 school-based SLP ────────────────────────────────────────────────────
function buildK12Prompt({ gradeBand = "3-5", contentArea = "articulation", focus = "", sessionLengthMinutes = 30, teacherNotes = "" }) {
  const band = K12_BANDS[gradeBand] ?? K12_BANDS["3-5"]
  const area = K12_AREAS[contentArea] ?? K12_AREAS.articulation

  const system = `You are an experienced school-based Speech-Language Pathologist writing session ACTIVITY ideas for a fellow SLP to adapt to their own caseload and treatment plans. Your activities are practical, evidence-informed, and engaging.

${FRAMING}

${STANDARDS}
${SCHOOLS_STANDARD}

Service area — ${area.label}: ${area.guide}
Band calibration — ${band.label}: ${band.context}

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${FIELD_NOTES}
- tier: always exactly "k12". band_label: "${band.label}". content_area: "${area.label}".
- clinical_boundary_note: activity ideas to adapt to your caseload and treatment plan — not a diagnosis, eligibility determination, or substitute for clinical judgment.

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate SLP session activity ideas:

- Service area: ${area.label}
- Specific target / focus: ${focus || "(choose an appropriate, age-appropriate target for this area and band)"}
- Grade band: ${band.label} — ${band.context}
- Session length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- SLP notes: ${teacherNotes}` : ""}

Activity ideas to adapt to your caseload — not a diagnosis or treatment plan. Do not use student names. Return the JSON object now.`

  return { system, user }
}

// ─── Adult / Rehabilitation (EXPERIMENTAL, strictest boundary) ────────────────
function buildAdultPrompt({ contentArea = "cognitive_communication", focus = "", sessionLengthMinutes = 45, teacherNotes = "" }) {
  const area = ADULT_AREAS[contentArea] ?? ADULT_AREAS.cognitive_communication

  const system = `You are an experienced Speech-Language Pathologist offering GENERAL, non-prescriptive ACTIVITY ideas for an adult-rehabilitation SLP to consider and adapt to their own patient, assessment, and plan of care. This is an EXPERIMENTAL context outside the platform's core K-12 focus, involving a vulnerable, higher-stakes clinical population — so the clinical boundary here is the STRICTEST in the entire tool.

${FRAMING}

ADULT-REHAB — ADDITIONAL, STRICTER RULES (this population is vulnerable and the stakes are high):
- Absolutely NO treatment plan, plan of care, prognosis, or predicted recovery.
- NO clinical decision-making, dosage/frequency prescriptions, or claims about what "will" help a specific patient.
- SWALLOWING / DYSPHAGIA / FEEDING is a distinct, higher-risk clinical domain — do NOT provide swallowing or feeding clinical guidance, exercises, diet/texture recommendations, or safety strategies. If it comes up at all, keep it at the most general, non-prescriptive level and state clearly that any swallowing/feeding recommendations must come from the clinician's OWN assessment and dysphagia evaluation.
- Everything is a general activity IDEA only, to be filtered entirely through the treating clinician's judgment and the patient's individualized assessment.

${STANDARDS}

Service area — ${area.label}: ${area.guide}
Population: adult rehabilitation (e.g., stroke recovery, TBI, cognitive-communication rehabilitation). Keep tasks FUNCTIONAL, dignified, and adult-relevant.

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${FIELD_NOTES}
- tier: always exactly "adult". band_label: "Adult / Rehabilitation (experimental)". grade_bands: [].
- clinical_boundary_note: use the STRICTEST framing — these are general activity ideas only, for the treating SLP to filter through their own assessment, plan of care, and clinical judgment; NOT a treatment plan, prognosis, diagnosis, or clinical protocol. Explicitly include that any swallowing/feeding recommendations must come from the clinician's own assessment.

LENGTH DISCIPLINE: complete JSON over detail. A truncated response is a FAILED response.`

  const user = `Generate GENERAL adult-rehabilitation SLP activity ideas (experimental tier):

- Service area: ${area.label}
- Focus / context: ${focus || "(choose a functional, adult-appropriate activity in this area, e.g., for stroke recovery)"}
- Session length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- SLP notes: ${teacherNotes}` : ""}

Strictest boundary: general activity ideas ONLY — no treatment plan, prognosis, or swallowing/feeding clinical guidance; all filtered through the treating clinician's assessment and judgment. Do not use patient names. Return the JSON object now.`

  return { system, user }
}
