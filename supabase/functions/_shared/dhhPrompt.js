/**
 * Teacher of the Deaf & Hard of Hearing (D/HH) prompt builder.
 *
 * Generates INSTRUCTIONAL / ACTIVITY plans for teachers of D/HH students to adapt
 * to their own caseload and students' IEP goals. This is a specialized licensed
 * teaching credential (state endorsement) — this tool is an activity-idea aid
 * ONLY. It does not diagnose, evaluate, determine eligibility, or replace
 * professional judgment.
 *
 * Standards: the Expanded Core Curriculum for students who are Deaf or Hard of
 * Hearing (ECC-DHH, 8 content areas) as the primary framework, with CEC (Council
 * for Exceptional Children) Initial Specialty Set: DHH and CED (Council on
 * Education of the Deaf) as governing bodies. The ECC-DHH supplements — does not
 * replace — the general-education curriculum.
 *
 * METHODOLOGICAL NEUTRALITY (important): the field includes genuinely diverse,
 * EQUALLY LEGITIMATE communication approaches — bilingual-bicultural (ASL as the
 * primary language alongside English literacy) and Listening & Spoken Language /
 * auditory-oral (spoken-language development, amplification / cochlear implants).
 * The tool NEVER assumes one is universal or "correct." It respects the teacher's
 * specified approach; when unspecified, it offers content adaptable to either and
 * notes where the two would diverge.
 */

const BANDS = {
  "k-2": { label: "K–2", context: "early elementary — foundational language and communication, incidental-learning access, early self-awareness and social foundations; playful, concrete, highly visual/accessible with heavy modeling." },
  "3-5": { label: "3–5", context: "upper elementary — expanding language/communication, beginning self-advocacy and technology self-management, and social-skill development; structured practice with growing independence." },
  "6-8": { label: "6–8", context: "middle school — self-advocacy fluency, social-emotional navigation of mainstream settings, technology self-management, and identity; AGE-RESPECTFUL peer contexts, building independence, never childish." },
  "9-12": { label: "9–12", context: "high school / transition — career education, workplace readiness, independent self-advocacy for adulthood, and transition planning; dignified, adult-relevant contexts, never babyish." },
}

const AREAS = {
  communication: { label: "Communication", guide: "communication skill-building — expressive and receptive language, conversational/discourse skills, incidental-learning access, and repair strategies. ADAPT to the program's communication approach (see the approach directive)." },
  self_advocacy: { label: "Self-Determination & Advocacy", guide: "self-advocacy specific to navigating a hearing world — requesting accommodations, explaining one's hearing technology and access needs to peers and teachers, using interpreters/captioning effectively, and advocating in group settings." },
  social_emotional: { label: "Social-Emotional Skills", guide: "social dynamics specific to D/HH students — peer relationships, friendship and conversation entry/repair, D/HH identity and (where relevant) Deaf culture, and navigating mainstream social settings and feelings of difference or fatigue." },
  technology_audiology: { label: "Technology & Audiology Awareness", guide: "age-appropriate familiarity with and self-management of hearing technology — hearing aids, cochlear implants, FM/DM (remote-microphone) systems, captioning and alerting devices — including basic troubleshooting, care, and knowing when/how to ask for help. Audiology AWARENESS only (not audiological assessment)." },
  career_transition: { label: "Career Education & Transition", guide: "secondary-focus — vocational exploration, workplace-readiness, and transition skills adapted for D/HH students (disclosing access needs, requesting workplace accommodations, communication access at work), framed with dignity for teens/young adults; real, adult-relevant contexts, never childish." },
}

const APPROACHES = {
  both: { label: "Adaptable to either approach", directive: "The teacher has NOT specified a communication philosophy. Present the activity so it is ADAPTABLE to EITHER a bilingual-bicultural (ASL as primary language + English literacy) OR a Listening & Spoken Language (auditory-oral) approach. Where the two would genuinely differ (e.g., how a concept is expressed/received, or how access is provided), briefly note BOTH options rather than choosing one. Treat both approaches as equally legitimate throughout." },
  bilingual_bicultural: { label: "Bilingual-Bicultural (ASL/English)", directive: "This program uses a BILINGUAL-BICULTURAL approach — ASL as the primary language alongside English literacy. Tailor the activity to visual/ASL access and Deaf-culture-affirming practice. Respect that Listening & Spoken Language is an EQUALLY legitimate approach used in other programs — never frame ASL as compensatory or as 'better/worse' than spoken language." },
  listening_spoken_language: { label: "Listening & Spoken Language", directive: "This program uses a LISTENING & SPOKEN LANGUAGE (auditory-oral) approach — spoken-language development and use of amplification / cochlear implants for auditory access. Tailor the activity to auditory access and spoken-language development. Respect that bilingual-bicultural (ASL/English) is an EQUALLY legitimate approach used in other programs — never frame spoken language as 'better/worse' than ASL." },
}

// The non-negotiable professional boundary, injected into every generation.
const FRAMING = `CRITICAL — this is an INSTRUCTIONAL / ACTIVITY-PLANNING aid only, NOT an assessment or eligibility tool:
- Do NOT diagnose, evaluate, determine eligibility for services, or assign a classification (no audiological or communication assessment).
- Do NOT write IEP goals, produce a formal assessment, or give compliance/legal determinations.
- Do NOT replace professional judgment. Frame EVERYTHING as activity ideas the teacher adapts to their own caseload and students' IEP goals — suggestions, not protocols ("you might," "consider," "one option").
- Avoid legal/compliance language (do not cite IDEA/statute specifics or endorsement law); keep it purely instructional/activity-based.
- Set clinical_boundary_note to a brief reminder that these are activity ideas to adapt to the teacher's caseload and students' IEP goals — not a formal assessment, eligibility determination, IEP goal, or substitute for professional judgment.

METHODOLOGICAL NEUTRALITY — CRITICAL: bilingual-bicultural (ASL primary + English literacy) and Listening & Spoken Language (auditory-oral) are BOTH legitimate, EQUALLY VALID approaches; families and programs choose among them. NEVER assume one is universal or the "correct" one, and never frame one as superior. Follow the program-approach directive below for this lesson.

ECC-DHH WORKS ALONGSIDE THE GENERAL CURRICULUM: the ECC-DHH SUPPLEMENTS the general-education core — it does NOT replace it. Keep activities focused on the disability-specific ECC-DHH skill, NOT on reteaching general subject-matter content.

AGE & DIGNITY: match materials and tone to the student's AGE, not their skill level. For middle/high-school students, use age-respectful, real-world contexts (peers, interests, jobs, independence) — never childish characters, cartoons, or babyish materials for a teen working on foundational skills.`

const STANDARDS = `Ground activities in the field's frameworks:
- Expanded Core Curriculum for students who are Deaf or Hard of Hearing (ECC-DHH) — the framework of 8 specialized content areas (Audiology, Career Education, Communication, Family Education, Functional Skills for Educational Success, Self-Determination & Advocacy, Social-Emotional Skills, Technology). Name the specific ECC-DHH area(s) an activity targets. Framework field: "ECC-DHH".
- CEC (Council for Exceptional Children) Initial Specialty Set: Deaf and Hard of Hearing — the professional preparation standards. Framework field: "CEC (DHH)".
- CED (Council on Education of the Deaf) — the field's standards/accreditation body. Framework field: "CED".
- ECC-DHH-alongside note: the ECC-DHH is delivered ALONGSIDE the general curriculum, supplementing (not replacing) it. Framework field for this lens: "ECC-DHH (alongside general curriculum)".`

const STATE_DISCLAIMER = `D/HH teaching is a specialized credential and endorsement requirements vary by state. Do NOT claim compliance with any specific state's requirements. Populate state_verification_note with a brief reminder to verify the teacher's own state D/HH teaching endorsement/credentialing requirements.`

const GRADING_GUIDANCE = `grading_the_activity must give at least one way to SIMPLIFY (grade down) and one way to CHALLENGE (grade up) the SAME activity. Each entry names the adjustment ("To simplify" or "To challenge") and how to make it for THIS activity.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "Teacher of the Deaf & Hard of Hearing",
  "tier": "k12",
  "title": string,
  "band_label": string,
  "grade_bands": number[],
  "content_area": string,
  "communication_approach": string,
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
- subject: always exactly "Teacher of the Deaf & Hard of Hearing".
- tier: always exactly "k12".
- grade_bands: JSON array of grade numbers (K = 0) covered by this band.
- communication_approach: echo the chosen approach label (or "Adaptable to either approach" when unspecified).
- target_area_summary: the ECC-DHH skill / area this session works on (a plain description, NOT an IEP goal or assessment result).
- warm_up: a brief, accessible opener that orients the student and primes the target skill.
- activities: 2–3 concrete activities, each with name, how_to_run (step by step, materials in hand, accessible by design), and why_it_works (the ECC-DHH rationale). Honor the communication-approach directive in every activity.
- supports_and_adaptations: 3–5 specific access supports — visual supports, ASL/interpreter or spoken-language access as appropriate to the approach, hearing-technology/FM-DM use, captioning, preferential seating/acoustics/lighting for visual access, and verbal/visual modeling with fading. Phrased as usable moves, not a rigid protocol.
- grading_the_activity: ${GRADING_GUIDANCE}
- materials: specific, accessible, age-appropriate materials (real objects, visual/ASL or auditory materials, hearing technology, captioned media) — nothing childish for teens.
- generalization: how to carry the skill into real school routines, other settings, and independence — coordinating with the classroom teacher/team and interpreters as appropriate.
- progress_check: an INFORMAL way to notice how the target went this session — the teacher folds it into their own data system and IEP progress monitoring; NOT a formal assessment or eligibility measure.
- age_dignity_note: one sentence naming how materials/tone are kept age-appropriate and dignified for this band.
- standards_alignment: 2–4 entries; framework field exactly one of the framework names above; name the specific ECC-DHH area(s).
- ${STATE_DISCLAIMER}`

export function buildDhhPrompt({ gradeBand = "3-5", contentArea = "communication", communicationApproach = "both", focus = "", sessionLengthMinutes = 30, teacherNotes = "" }) {
  const band = BANDS[gradeBand] ?? BANDS["3-5"]
  const area = AREAS[contentArea] ?? AREAS.communication
  const approach = APPROACHES[communicationApproach] ?? APPROACHES.both

  const system = `You are an experienced Teacher of the Deaf & Hard of Hearing writing session ACTIVITY ideas for a fellow D/HH teacher to adapt to their own caseload and students' IEP goals. Your activities are practical, evidence-informed, accessible by design, and grounded in the Expanded Core Curriculum for students who are Deaf or Hard of Hearing.

${FRAMING}

PROGRAM COMMUNICATION APPROACH FOR THIS LESSON — ${approach.label}: ${approach.directive}

${STANDARDS}

ECC-DHH area — ${area.label}: ${area.guide}
Band calibration — ${band.label}: ${band.context}

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${FIELD_NOTES}
- band_label: "${band.label}". content_area: "${area.label}". communication_approach: "${approach.label}".
- clinical_boundary_note: activity ideas to adapt to your caseload and students' IEP goals — not a formal assessment, eligibility determination, IEP goal, or substitute for professional judgment.

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate Teacher of the Deaf & Hard of Hearing session activity ideas (ECC-DHH):

- ECC-DHH area: ${area.label}
- Communication approach: ${approach.label}
- Specific target / focus: ${focus || "(choose an appropriate, age-appropriate target for this ECC-DHH area and band)"}
- Grade band: ${band.label} — ${band.context}
- Session length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Activity ideas to adapt to your caseload and students' IEP goals — not an assessment or eligibility tool. Honor the communication-approach directive and keep both approaches respected as equally valid. Do not use student names. Return the JSON object now.`

  return { system, user }
}
