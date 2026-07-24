/**
 * Student Support Team Activities prompt builder.
 *
 * A SHARED bank of ready-to-run, small-group SEL/behavioral skill-building
 * ACTIVITIES for student-support-team roles: School Social Workers, School
 * Psychologists, Military & Family Life Counselors (MFLC/CYB-MFLC), and (secondary
 * audience) Behavior Specialists/Interventionists. The SAME core activity is
 * generated; the standards stack and scope note are LAYERED per selected role.
 *
 * CRITICAL: this fills ONE narrow gap — the activity / lesson STRUCTURE that
 * clinical graduate training in social work, psychology, or counseling did not
 * typically cover (unlike a classroom teacher's pedagogical training). It is NOT
 * a substitute for these professionals' clinical training and must never produce
 * individual counseling plans, assessment/eligibility content, FBAs/BIPs, crisis
 * protocols, or diagnostic/clinical content.
 */

const GRADE_BANDS = {
  "k-2": "K–2 — young children; concrete, playful, movement-based, short segments and lots of modeling.",
  "3-5": "3–5 — upper elementary; concrete supports with growing reflection and peer awareness.",
  "6-8": "6–8 — middle school / pre-teens; AGE-RESPECTFUL contexts (peers, interests, real situations); never childish, even for foundational skills.",
  "9-12": "9–12 — high school / teens; dignified, real-world and future-focused contexts; adult-relevant, never babyish.",
}

const SKILL_AREAS = {
  emotional_regulation: "Emotional regulation & coping skills",
  social_skills: "Social skills & friendship",
  conflict: "Conflict resolution & anger management",
  self_esteem: "Self-esteem & confidence",
  stress_mindfulness: "Stress management & mindfulness",
  executive_function: "Executive function & organization",
  transitions: "Change, transitions & resilience",
}

// Per-role standards + scope layering. Same core activity; only these change.
const ROLES = {
  social_worker: {
    label: "School Social Worker",
    standards: `- NASW Standards for School Social Work Services and the SSWAA (School Social Work Association of America) National School Social Work Practice Model — the frameworks for school social work service delivery, including small-group skill-building. Framework field: "NASW / SSWAA".`,
    scope: "For a School Social Worker: this supplies group-activity structure alongside your professional training — it does not replace your social work practice, assessment, or individual/family work.",
  },
  school_psych: {
    label: "School Psychologist",
    standards: `- NASP Practice Model (2020) — cite ONLY the direct small-group intervention / service-delivery domain (Domain 4: Mental and Behavioral Health Services and Interventions — direct social/emotional/behavioral skill interventions). Do NOT cite or imply the assessment or data-based-decision-making/eligibility domains. Framework field: "NASP Practice Model".`,
    scope: "For a School Psychologist: this supports the structure of Tier 2/3 small-group skill intervention ONLY — explicitly NOT psychoeducational/cognitive assessment, eligibility determination, or data-based decision-making, which are separate professional functions.",
  },
  mflc: {
    label: "Military & Family Life Counselor (MFLC / CYB-MFLC)",
    standards: `- The DoD Military and Family Life Counseling (MFLC) Program scope — NON-MEDICAL, short-term, situational, preventative support. Framework field: "DoD MFLC Program".`,
    scope: "For an MFLC/CYB-MFLC: keep everything within the non-medical, short-term, situational-support scope. Anything that appears to meet clinical or diagnostic criteria is OUTSIDE this role and must be referred to appropriate behavioral health providers.",
  },
  behavior_specialist: {
    label: "Behavior Specialist / Interventionist",
    standards: `- No single dedicated standards body governs this role; ground the activity in general, evidence-informed SEL / behavioral skill-building best practice. Framework field: "General SEL/behavioral practice".`,
    scope: "For a Behavior Specialist/Interventionist: this provides ready-made group-activity structure. It is NOT a Functional Behavioral Assessment (FBA), a Behavior Intervention Plan (BIP), or an individual behavior-plan tool — those require your own assessment and process.",
  },
}

const SCOPE = `SCOPE — READ CAREFULLY. This provides STRUCTURED, READY-TO-RUN SMALL-GROUP ACTIVITIES ONLY. You must NOT produce:
- individual counseling or therapy session plans,
- psychoeducational, cognitive, or any standardized assessment content,
- eligibility-determination guidance,
- Functional Behavioral Assessments (FBAs) or Behavior Intervention Plans (BIPs),
- crisis intervention or crisis-response protocols,
- diagnostic, clinical, or therapeutic treatment content.
The professionals using this have extensive clinical training this tool must NEVER replace. It fills ONE narrow gap: the ACTIVITY / lesson STRUCTURE their graduate training did not typically cover (unlike a classroom teacher's pedagogical training). Stay entirely at the level of a structured, preventative, skill-building GROUP activity, and frame everything as ready-to-run structure to adapt to your group. Set scope_note to a brief reminder of this boundary.`

const AGE_DIGNITY = `AGE & DIGNITY: match materials and tone to the students' AGE, not their skill level. For middle/high school, use age-respectful, real-world contexts — never childish characters, cartoons, or babyish materials for teens.`

const STATE_DISCLAIMER = `Credentialing, scope, and program requirements vary by role, state, district, and (for MFLCs) DoD program rules. Do NOT claim compliance with any specific requirement. Populate state_verification_note with a brief reminder to verify the practitioner's own role/state/program scope and requirements.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

/**
 * @param {Object} input
 * @param {string} input.role       'social_worker'|'school_psych'|'mflc'|'behavior_specialist'
 * @param {string} input.skillArea  a SKILL_AREAS key
 * @param {string} input.gradeBand  'k-2'|'3-5'|'6-8'|'9-12'
 * @param {string} [input.focus]    specific skill/topic
 * @param {string} [input.groupSize]
 * @param {number} [input.sessionLengthMinutes]
 * @param {string} [input.teacherNotes]
 * @returns {{ system: string, user: string }}
 */
export function buildSstActivityPrompt({
  role = "social_worker",
  skillArea = "emotional_regulation",
  gradeBand = "3-5",
  focus = "",
  groupSize = "Small group (4–6)",
  sessionLengthMinutes = 30,
  teacherNotes = "",
}) {
  const r = ROLES[role] ?? ROLES.social_worker
  const band = GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
  const area = SKILL_AREAS[skillArea] ?? SKILL_AREAS.emotional_regulation

  const system = `You are an experienced student-support-team facilitator writing a ready-to-run, small-group SEL/behavioral skill-building ACTIVITY for a ${r.label}. Your gift is STRUCTURE: you turn a skill into a clear, well-paced, facilitator-friendly group activity — the kind of pedagogical scaffolding a clinician's graduate training did not cover.

${SCOPE}

${AGE_DIGNITY}

Ground the activity's standards layer for this role in:
${r.standards}

Role scope for this practitioner: ${r.scope}

Skill area — ${area}. Grade band — ${band}

${JSON_ONLY} Match this schema exactly:

{
  "subject": "Student Support Team Activities",
  "role": "${r.label}",
  "title": string,
  "grade_bands": number[],
  "skill_area": "${area}",
  "focus": string,
  "group_size_label": string,
  "session_length_minutes": number,
  "skill_objective": string,
  "opening": string,
  "group_agreements": string[],
  "core_activity": { "name": string, "how_to_run": string, "why_it_works": string },
  "practice_and_processing": string,
  "discussion_questions": string[],
  "closing": string,
  "facilitation_tips": string[],
  "materials": string[],
  "differentiation": string,
  "generalization": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "role_scope_note": string,
  "scope_note": string,
  "state_verification_note": string
}

Field notes:
- subject: always exactly "Student Support Team Activities". role: always exactly "${r.label}".
- grade_bands: JSON array of grade numbers for this band (K = 0). group_size_label: "${groupSize}". session_length_minutes: ${sessionLengthMinutes}.
- skill_objective: what the group will practice — a skill-building objective, NOT a clinical/treatment goal.
- opening: a brief check-in / rapport-building / warm-up to start the group.
- group_agreements: 3–4 simple group norms to establish or restate (confidentiality-within-reason, one voice, right to pass, respect).
- core_activity: the central structured activity — name, how_to_run (clear step-by-step a facilitator can run with no guesswork), and why_it_works (the skill rationale).
- practice_and_processing: guided practice plus how to process/debrief the experience as a group.
- discussion_questions: 3–5 open group-processing questions.
- closing: a wrap-up that names the takeaway and a transfer-to-real-life prompt.
- facilitation_tips: 4–6 concrete GROUP-FACILITATION moves (pacing, drawing in quiet members, handling an off-task or dominating member, transitions, keeping it strengths-based, time management) — this is the structure gap this tool fills, so be genuinely useful here.
- materials: simple, age-appropriate materials — nothing childish for teens.
- differentiation: how to scale the activity up/down within the band and for varied needs.
- generalization: how students carry the skill into real settings.
- standards_alignment: 2–3 entries using ONLY the framework field named above for this role.
- role_scope_note: the role-specific boundary — ${r.scope}
- scope_note: the universal boundary — structured group activities only; not individual counseling, assessment/eligibility, FBA/BIP, crisis response, or diagnostic/clinical content; adapt this ready-made structure to your group.
- ${STATE_DISCLAIMER}

Tone: warm, strengths-based, developmentally appropriate, preventative. LENGTH DISCIPLINE: complete JSON over exhaustive detail; a response cut off before the closing brace is a FAILED response.`

  const user = `Generate a ready-to-run small-group activity:

- Practitioner role: ${r.label}
- Skill area: ${area}
- Specific skill / focus: ${focus || "(choose an appropriate, age-appropriate skill in this area)"}
- Grade band: ${band}
- Group size: ${groupSize}
- Session length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- Facilitator notes: ${teacherNotes}` : ""}

Structured group activity only — not individual counseling, assessment, FBA/BIP, or crisis content. Do not use student names. Return the JSON object now.`

  return { system, user }
}
