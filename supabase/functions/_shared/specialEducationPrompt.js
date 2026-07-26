/**
 * Special Education (Resource / Self-Contained) prompt builder.
 *
 * Like the other specialist modules, this reuses the "one AI call → structured
 * JSON → tolerant parse → save to the lessons table" shape. Three modes serve
 * three genuinely different jobs of a SPED teacher:
 *   - 'multitier'  → one self-contained lesson written at several access tiers at once
 *   - 'functional' → secondary functional / life-skills where independence IS the curriculum
 *   - 'coteaching' → push-in accommodations organized by Friend's co-teaching models
 *
 * CRITICAL: this is an INSTRUCTIONAL planning aid ONLY. It never writes IEP
 * goals, never diagnoses/classifies a disability, and never uses legal/compliance
 * language (FAPE, LRE, IDEA, 504, "compliance"…). Every output reads as "ideas to
 * adapt to your specific students and their IEPs," never authoritative on its own.
 */

const GRADE_BANDS = {
  "k-2": { label: "K–2", context: "early elementary — concrete, playful-but-purposeful, lots of hands-on and visual support." },
  "3-5": { label: "3–5", context: "upper elementary — concrete supports with growing independence." },
  "6-8": { label: "6–8", context: "middle school — PRE-TEEN/TEEN students. Use age-respectful contexts (peers, interests, real situations); never childish themes even when skills are foundational." },
  "9-12": { label: "9–12", context: "high school — TEENAGE / YOUNG-ADULT students, including secondary self-contained, Life Skills, and Functional Academics programs. Materials and tone MUST be adult and dignity-respecting; foundational skills are practiced through money, work, community, and independent-living contexts — never through elementary/childish materials." },
}

function resolveBand(gradeBand) {
  return GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
}

// The non-negotiable framing, injected into EVERY mode's system prompt.
const FRAMING = `CRITICAL — READ CAREFULLY. This is an INSTRUCTIONAL planning aid only:
- NEVER write IEP goals or objectives, and never phrase anything as one (no "measurable annual goal," no baseline/benchmark/mastery-criteria goal language, no "the student will… as measured by…").
- NEVER diagnose, classify, label, or determine eligibility for any disability. Say "students," "learners," or "students who need more support" — never assign a disability category to a student.
- NEVER use legal or compliance language: do NOT mention FAPE, LRE, IDEA, Section 504, due process, "legally required," "compliance," or any statute/regulation. Keep everything purely instructional.
- Frame ALL output as IDEAS TO ADAPT to the teacher's specific students and their existing IEPs — suggestions, not authoritative or sufficient on their own. Prefer "you might," "consider," "one option."
- Set instructional_support_note to a brief reminder that these are instructional ideas to adapt to each student's needs and existing IEP — not IEP goals, not a diagnosis, not a compliance determination.

AGE & DIGNITY (required): Match tone, examples, and materials to the students' AGE, not their skill level. For middle/high school — including secondary self-contained, Life Skills, Functional Academics, and Multiple Disabilities programs — use age-respectful, adult-relevant contexts. NEVER use childish cartoons, baby talk, infantilizing praise, or elementary themes for teenagers/young adults. A 17-year-old practicing early counting does it with money, tools, or job tasks — not teddy bears.`

const STANDARDS = `Ground your instructional ideas in:
- CEC Initial Practice-Based Professional Preparation Standards for Special Educators (Council for Exceptional Children, 2020) — the national professional standards. Draw especially on addressing each learner's developmental and learning needs (Std 2), specialized curricular knowledge (Std 3), and supporting learning through effective, specialized instruction (Std 5). Framework field: "CEC".
- Universal Design for Learning (UDL, CAST) — plan for multiple means of Representation, of Action & Expression, and of Engagement. Framework field: "UDL".`

const MODALITY_GUIDANCE = `response_modalities must offer genuinely DIFFERENT ways to demonstrate understanding (not just easier questions): include options such as verbal/spoken, AAC or picture-symbol selection, and an alternate/non-verbal response (gesture, eye-gaze, sorting, pointing, building, matching). Each entry names the modality and gives a concrete way a student uses it for THIS task.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

// Elementary hands-on/kinesthetic lens (K-2/3-5 toggle) — favors manipulatives,
// movement, and tactile work over worksheet/seatwork. Applied to the multitier
// and co-teaching modes (the functional mode is secondary and out of scope).
const HANDS_ON_DIRECTIVE = `\n\nHANDS-ON / KINESTHETIC EMPHASIS (elementary): Make the PRIMARY mode of learning hands-on, kinesthetic, and movement-based — NOT worksheets or seatwork. Favor manipulatives and physical objects (counters, tiles, cards, blocks, real materials), whole-body movement and gesture, tactile exploration, sorting / building / acting-out, learning stations, and partner or group activities where students are up and doing. The MAIN activity (and, for tiered work, the access options) should be concrete and physical (e.g., physical objects for counting / sorting / fraction work, movement- or gesture-based vocabulary, building and manipulating real materials). Actively STEER AWAY from paper-based independent worksheets as the core task — keep any written recording brief and secondary to the physical doing. Keep it developmentally appropriate for young learners' attention spans and motor skills.`

export function buildSpecialEducationPrompt(input) {
  const mode = input?.mode
  if (mode === "functional") return buildFunctionalPrompt(input)
  if (mode === "coteaching") return buildCoTeachingPrompt(input)
  return buildMultiTierPrompt(input)
}

// ─── Mode 1: Self-contained multi-tier differentiation ───────────────────────
function buildMultiTierPrompt({
  topic = "",
  contentArea = "",
  gradeBand = "3-5",
  teacherNotes = "",
  handsOn = false,
}) {
  const band = resolveBand(gradeBand)

  const system = `You are an experienced self-contained special education teacher writing ONE lesson that a single teacher can run for a classroom with a very wide range of needs at the same time. The same core topic is delivered at several access tiers simultaneously.

${FRAMING}

${STANDARDS}

${MODALITY_GUIDANCE}

${JSON_ONLY} Match this schema exactly:

{
  "mode": "multitier",
  "subject": "Special Education",
  "title": string,
  "grade_bands": number[],
  "topic": string,
  "content_area": string,
  "shared_objective": string,
  "udl_supports": [ { "principle": string, "how": string } ],
  "tiers": [ { "tier_name": string, "who_it_serves": string, "learning_target": string, "task": string, "response_modalities": [ { "modality": string, "how": string } ] } ],
  "functional_tie_in": string,
  "materials_supports": string[],
  "running_it_together": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "instructional_support_note": string
}

Field notes:
- subject: always exactly "Special Education".
- grade_bands: JSON array of grade numbers for this band (K = 0).
- shared_objective: the big idea every student engages with, stated so it's accessible to all tiers.
- udl_supports: 3 entries — one each for Representation, Action & Expression, and Engagement — each with a concrete "how" for this lesson.
- tiers: FOUR tiers spanning a WIDE range (wider than a gifted classroom's tiers): from emerging/foundational access, to early/developing skills, to approaching skills, to near-grade-level. tier_name labels the access level; who_it_serves briefly describes it (by support need, NOT by disability label); learning_target adapts the objective; task is what students actually do; response_modalities per ${MODALITY_GUIDANCE}
- functional_tie_in: a natural functional / life-skills connection (especially valuable at younger bands) — e.g., a measurement lesson tied to cooking or counting money. Age-appropriate to ${band.label}.
- materials_supports: specific manipulatives, visuals, AAC/symbol supports, and scaffolds — age-appropriate for ${band.label}.
- running_it_together: practical guidance on how ONE teacher (with any paraeducators) manages all tiers at once — grouping, rotation, and support flow.
- standards_alignment: 2–4 entries; framework exactly "CEC" or "UDL".
- ${band.label === "6–8" || band.label === "9–12" ? "AGE NOTE: these are teenage students — keep every tier, example, and material age-respectful and dignified." : "Keep materials concrete and supportive."}

LENGTH DISCIPLINE: Every field present and JSON closed matters more than length. Keep the 4 tiers tight and each field focused. A response cut off before the closing brace is a FAILED response.${handsOn ? HANDS_ON_DIRECTIVE : ""}`

  const user = `Generate a self-contained multi-tier lesson:

- Topic: ${topic || "(choose an appropriate topic for this band)"}
- Content area: ${contentArea || "(infer from the topic)"}
- Grade band: ${band.label} — ${band.context}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Do not use student names or identifying information. Return the JSON object now.`

  return { system, user }
}

// ─── Mode 2: Secondary functional / life-skills ──────────────────────────────
function buildFunctionalPrompt({
  skillArea = "Functional math",
  focus = "",
  gradeBand = "9-12",
  teacherNotes = "",
}) {
  const band = resolveBand(gradeBand)

  const system = `You are an experienced secondary special education teacher in a Life Skills / Functional Academics program. Here, vocational, community-based, and independent-living skills ARE the curriculum — not an add-on to academic content. Your students are teenagers and young adults and are treated with dignity.

${FRAMING}

${STANDARDS}

${MODALITY_GUIDANCE}

${JSON_ONLY} Match this schema exactly:

{
  "mode": "functional",
  "subject": "Special Education",
  "title": string,
  "grade_bands": number[],
  "skill_area": string,
  "focus": string,
  "real_world_purpose": string,
  "functional_objective": string,
  "instructional_sequence": [ { "step": string, "what_students_do": string } ],
  "community_or_vocational_extension": string,
  "generalization": string,
  "response_modalities": [ { "modality": string, "how": string } ],
  "materials_supports": string[],
  "age_respect_note": string,
  "informal_check": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "instructional_support_note": string
}

Field notes:
- subject: always exactly "Special Education".
- skill_area: the functional domain (e.g., functional math — budgeting/shopping/time, functional literacy — signs/forms/schedules, vocational / job-readiness, community navigation, self-advocacy).
- real_world_purpose: why this skill matters for independence and adult life — concrete and respectful.
- functional_objective: a practical, usable objective for the session (instructional, NOT an IEP goal).
- instructional_sequence: 4–6 explicit, systematic steps taught the way a functional-skills teacher would — with real materials (money, forms, schedules, tools), modeling, and guided practice.
- community_or_vocational_extension: how to extend into a community-based or job-site application.
- generalization: how to help students transfer the skill to real settings beyond the classroom.
- response_modalities: per ${MODALITY_GUIDANCE}
- materials_supports: specific, ADULT, age-appropriate materials (real currency, actual forms/apps, workplace tools) — explicitly nothing childish.
- age_respect_note: one sentence naming how the materials and tone are kept dignified and age-appropriate for teenage/young-adult students.
- informal_check: an instructional way to see whether students can use the skill (a quick check for understanding — NOT IEP data collection).
- standards_alignment: 2–4 entries; framework exactly "CEC" or "UDL".

LENGTH DISCIPLINE: Every field present and JSON closed. Keep fields focused. A truncated response is a FAILED response.`

  const user = `Generate a secondary functional / life-skills lesson:

- Functional skill area: ${skillArea}
- Specific focus: ${focus || "(choose a concrete, high-value life skill in this area)"}
- Grade band: ${band.label} — ${band.context}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

These are teenage / young-adult students — keep everything age-appropriate and dignity-respecting. Do not use student names. Return the JSON object now.`

  return { system, user }
}

// ─── Mode 3: Push-in / co-teaching support ───────────────────────────────────
function buildCoTeachingPrompt({
  genEdTopic = "",
  contentArea = "",
  gradeBand = "6-8",
  teacherNotes = "",
  handsOn = false,
}) {
  const band = resolveBand(gradeBand)

  const system = `You are an experienced push-in / co-teaching special education teacher who supports general-education lessons you do NOT own. Given a gen-ed topic, you provide fast, plug-in accommodation and modification ideas that fit into someone else's lesson rather than replacing it. You move between multiple classrooms and subjects in a day, so this must be quick-reference and fast to adapt.

${FRAMING}

${STANDARDS}
- Marilyn Friend's Co-Teaching Models — One Teach/One Assist, One Teach/One Observe, Station Teaching, Parallel Teaching, Alternative Teaching, and Team Teaching. Framework field: "Co-Teaching (Friend)".

${MODALITY_GUIDANCE}

${JSON_ONLY} Match this schema exactly:

{
  "mode": "coteaching",
  "subject": "Special Education",
  "title": string,
  "grade_bands": number[],
  "gen_ed_topic": string,
  "content_area": string,
  "quick_summary": string,
  "universal_accommodations": string[],
  "co_teaching_models": [ { "model": string, "how_this_topic_works": string, "sped_teacher_role": string } ],
  "modifications": string[],
  "response_modalities": [ { "modality": string, "how": string } ],
  "quick_wins": string[],
  "standards_alignment": [ { "framework": string, "text": string } ],
  "instructional_support_note": string
}

Field notes:
- subject: always exactly "Special Education".
- quick_summary: 1–2 sentences a busy push-in teacher can skim to get oriented to this topic.
- universal_accommodations: 4–6 low-effort supports that plug into the gen-ed lesson without changing it (access, not content) — e.g., graphic organizers, sentence starters, chunking, visual supports, extended time in-the-moment.
- co_teaching_models: cover Friend's models (at least 4 of the 6, including Station Teaching, Parallel Teaching, Alternative Teaching, and One Teach/One Assist). For each: model name; how_this_topic_works = how THIS specific topic could run in that model; sped_teacher_role = the SPED teacher's concrete role in that configuration.
- modifications: 3–5 deeper changes (to complexity/output/goal) for students who need more than access-level accommodations — framed as options to adapt to each student.
- response_modalities: per ${MODALITY_GUIDANCE}
- quick_wins: 3–4 fastest-to-implement supports for a teacher walking into the room with little prep time.
- standards_alignment: 2–4 entries; framework exactly "CEC", "UDL", or "Co-Teaching (Friend)".

LENGTH DISCIPLINE: Every field present and JSON closed. Keep it tight and quick-reference in tone. A truncated response is a FAILED response.${handsOn ? HANDS_ON_DIRECTIVE : ""}`

  const user = `Generate push-in / co-teaching support for a general-education lesson:

- Gen-ed topic: ${genEdTopic || "(choose an appropriate gen-ed topic for this band)"}
- Content area: ${contentArea || "(infer from the topic)"}
- Grade band: ${band.label} — ${band.context}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Keep it quick-reference and fast to adapt. Do not use student names. Return the JSON object now.`

  return { system, user }
}
