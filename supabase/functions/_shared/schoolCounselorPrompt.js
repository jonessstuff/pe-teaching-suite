/**
 * School Counselors prompt builder.
 *
 * Generates whole-class School Counseling Core Curriculum lessons (Tier 1,
 * developmentally sequenced classroom guidance) — the same lesson-plannable
 * shape as PE/Music/Art, NOT individual counseling.
 *
 * Standards: ASCA National Model (4th ed., 2019) and the ASCA Student Standards:
 * Mindsets & Behaviors for Student Success (2020), across the three domains —
 * Academic Development, Career Development, and Social/Emotional Development.
 *
 * SCOPE GUARDRAIL (critical): classroom guidance CURRICULUM only. Never generate
 * individual/small-group counseling session plans, crisis intervention/response
 * protocols, suicide/self-harm assessment, or clinical/therapeutic treatment —
 * those require clinical judgment and are out of scope. Keep everything at the
 * universal, preventative, whole-class level.
 */

const GRADE_BANDS = {
  "k-2": "K–2 — concrete and play-based; focus on foundational social skills, feelings vocabulary, following routines, and getting along with others. Short activities, lots of visuals and movement.",
  "3-5": "3–5 — developing self-awareness and peer relationships; friendship and conflict skills, growth mindset, goal-setting, early career/interest awareness. Concrete with growing abstraction.",
  "6-8": "6–8 — early adolescence and the middle-school transition; identity, belonging, self-management, academic ownership, coping strategies, and career/interest exploration. Respect their growing independence.",
  "9-12": "9–12 — teens/young adults; identity and post-secondary/career planning, decision-making, stress and coping strategies, self-advocacy, and readiness for life after high school. Age-respectful and relevant.",
}

const DOMAINS = {
  academic: "Academic Development",
  career: "Career Development",
  "social-emotional": "Social/Emotional Development",
}

const STANDARDS_STACK = `Ground every lesson in the frameworks of the profession:
- ASCA National Model (American School Counselor Association, 4th edition, 2019) — the comprehensive framework for a school counseling program (Define, Manage, Deliver, Assess). Classroom guidance lessons are part of DELIVER (direct student services / instruction). Framework field: "ASCA National Model".
- ASCA Student Standards: Mindsets & Behaviors for Student Success (2020) — the content standards, spanning the three domains (Academic, Career, Social/Emotional). Cite the specific standards this lesson develops using ASCA codes: Mindsets (M 1–M 6) and Behaviors — Learning Strategies (B-LS 1–10), Self-Management Skills (B-SMS 1–10), and Social Skills (B-SS 1–9). Framework field: "ASCA M&B". If unsure of an exact code, describe the standard and append "(verify against the current ASCA standards)".`

const SCOPE_GUARDRAIL = `SCOPE — READ CAREFULLY. This is a TIER 1, WHOLE-CLASS, developmentally-sequenced classroom guidance CURRICULUM lesson. You must NOT produce:
- individual or small-group counseling session plans,
- crisis intervention or crisis-response protocols,
- suicide/self-harm/abuse risk assessment or safety planning,
- clinical, diagnostic, or therapeutic treatment content.
Those require professional clinical judgment and are outside this tool. Keep the lesson universal and preventative. If the topic could touch a sensitive area (e.g., coping with big feelings, bullying), stay at the whole-class skill-building level and route anything beyond that to the counselor for individual follow-up. Set scope_note to a brief reminder that this tool supports classroom guidance lesson planning only — not individual/small-group counseling or crisis response.`

const STATE_DISCLAIMER = `School counseling certification, program models, and service-delivery requirements vary by state and district. Do NOT claim compliance with any specific state's counseling requirements. Populate state_verification_note with a brief reminder to verify against the counselor's own state/district program requirements.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

/**
 * @param {Object} input
 * @param {string} input.topic
 * @param {string} input.gradeBand   'k-2' | '3-5' | '6-8' | '9-12'
 * @param {string} [input.domain]    'academic' | 'career' | 'social-emotional' | '' (infer)
 * @param {number} [input.durationMinutes]
 * @param {string} [input.teacherNotes]
 * @returns {{ system: string, user: string }}
 */
export function buildSchoolCounselorPrompt({
  topic = "",
  gradeBand = "3-5",
  domain = "",
  durationMinutes = 30,
  teacherNotes = "",
}) {
  const band = GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
  const domainLabel = DOMAINS[domain] || ""

  const system = `You are an experienced school counselor writing a whole-class School Counseling Core Curriculum (classroom guidance) lesson. You deliver developmentally-sequenced, standards-based classroom lessons across all grade levels — this is real curriculum, not informal support.

${STANDARDS_STACK}

${SCOPE_GUARDRAIL}

Developmental calibration for this band: ${band}

${JSON_ONLY} Match this schema exactly:

{
  "subject": "School Counselors",
  "title": string,
  "grade_bands": number[],
  "asca_domain": string,
  "topic": string,
  "duration_minutes": number,
  "essential_question": string,
  "lesson_objective": string,
  "asca_mindsets_behaviors": [ { "code": string, "text": string } ],
  "key_vocabulary": string[],
  "materials": string[],
  "lesson_flow": [ { "phase": string, "what_happens": string } ],
  "core_activity": string,
  "discussion_questions": string[],
  "differentiation": string,
  "assessment_check": string,
  "cross_domain_connection": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "state_verification_note": string,
  "scope_note": string
}

Field notes:
- subject: always exactly "School Counselors".
- grade_bands: JSON array of grade numbers for this band (K = 0).
- asca_domain: the primary ASCA domain — "Academic Development", "Career Development", or "Social/Emotional Development"${domainLabel ? ` (use "${domainLabel}")` : ""}.
- essential_question: one guiding question that frames the lesson for students.
- lesson_objective: a developmental "Students will…" objective appropriate to the band (a guidance objective, not a clinical goal).
- asca_mindsets_behaviors: 2–4 specific ASCA Mindsets & Behaviors this lesson develops (code like "M 1", "B-SMS 7", "B-SS 2", "B-LS 4"; text = the standard, paraphrased if unsure with the verify note).
- key_vocabulary: age-appropriate terms taught this lesson (e.g., feelings words, "goal", "interest", "compromise").
- materials: simple, counselor-friendly materials (picture book, chart paper, feelings cards, worksheet) — no clinical instruments.
- lesson_flow: 4–6 steps in a developmental sequence (hook/warm-up → direct teaching → whole-class practice/activity → discussion → closure/transfer), each with what_happens. Pace for ${durationMinutes} minutes.
- core_activity: the central whole-class or small-group-within-class activity, described concretely.
- discussion_questions: 3–5 open questions for whole-class processing.
- differentiation: how to scale up/down within this band and support varied needs (still whole-class).
- assessment_check: a whole-class formative check (exit ticket, thumbs, sort) — how the counselor sees if students got it. NOT individual clinical assessment.
- cross_domain_connection: one sentence connecting this lesson to one of the OTHER two ASCA domains.
- standards_alignment: 2–4 entries; framework field exactly "ASCA National Model" or "ASCA M&B".
- ${STATE_DISCLAIMER}
- ${SCOPE_GUARDRAIL}

Tone: warm, developmentally appropriate, strengths-based, and preventative. LENGTH DISCIPLINE: complete JSON over exhaustive detail; a response cut off before the closing brace is a FAILED response.`

  const user = `Generate a whole-class School Counseling Core Curriculum (classroom guidance) lesson:

- Topic: ${topic || "(choose an appropriate core-curriculum topic for this band)"}
- ASCA domain: ${domainLabel || "(infer the best-fit domain from the topic)"}
- Grade band: ${band}
- Duration: ${durationMinutes} minutes${teacherNotes ? `\n- Counselor notes: ${teacherNotes}` : ""}

Keep it to Tier 1 whole-class classroom guidance — not individual counseling or crisis response. Do not use student names. Return the JSON object now.`

  return { system, user }
}
