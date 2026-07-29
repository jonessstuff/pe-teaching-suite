/**
 * Gifted & Talented (GT) prompt builder.
 *
 * Structurally mirrors buildAdaptivePEPrompt: both modules serve a teacher
 * differentiating for a specific student population rather than teaching a
 * standalone subject, so this reuses the same "one AI call → structured JSON,
 * tolerant parse, save to the lessons table" shape.
 *
 * Three modes, matching the three GT workflows:
 *   - 'differentiate' → extend a topic with the Depth & Complexity framework (Kaplan)
 *   - 'enrich'        → enrichment (Renzulli Triad) vs. acceleration options for a topic
 *   - 'support'       → identifying & supporting 2e / underachieving / asynchronous GT learners
 *
 * National-framework-first (NAGC / NAGC-CEC / Kaplan / Renzulli). State GT
 * identification and service rules vary, so every mode carries a state
 * verification disclaimer instead of any state-specific content.
 */
import { stationsDirective } from "./stationsDirective.js";

const GRADE_BANDS = {
  "k-2": { label: "K–2", grades: [0, 1, 2] },
  "3-5": { label: "3–5", grades: [3, 4, 5] },
  "6-8": { label: "6–8", grades: [6, 7, 8] },
  "9-12": { label: "9–12", grades: [9, 10, 11, 12] },
}

function resolveBand(gradeBand) {
  return GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
}

// Shared standards / framework grounding injected into every mode's system prompt.
// Keeps the stack identical across the three workflows.
const STANDARDS_STACK = `You ground your work in the recognized frameworks of gifted education:
- NAGC Pre-K–Grade 12 Gifted Programming Standards (National Association for Gifted Children, 2019 revision) — the primary programming framework. Its six standard areas are: 1) Learning and Development, 2) Assessment, 3) Curriculum Planning and Instruction, 4) Learning Environments, 5) Programming, and 6) Professional Learning. Reference the relevant standard by area when you cite one. Framework field: "NAGC".
- NAGC-CEC Teacher Preparation Standards in Gifted Education (endorsed by CEC-TAG, The Association for the Gifted, Council for Exceptional Children) — the teacher-preparation layer for what an effective GT educator knows and does. Framework field: "NAGC-CEC".
- The Depth and Complexity framework (Sandra Kaplan) — the core classroom differentiation tool. Its eleven dimensions are the eight Depth prompts (Language of the Discipline, Details, Patterns, Rules, Trends, Unanswered Questions, Ethics, Big Ideas) and the three Complexity prompts (Over Time, Across Disciplines / Points of View, Multiple Perspectives), plus the Content Imperatives (Origin, Convergence, Parallels, Paradox, Contribution) used to deepen further.
- Renzulli's Enrichment Triad Model — Type I (general exploratory experiences), Type II (group training in thinking/research/creativity skills), and Type III (individual & small-group investigations of real problems).
- Core GT instructional strategies: curriculum compacting, tiered assignments, flexible grouping, and deliberate acceleration-vs-enrichment decision-making.

Gifted education is not only academic rigor. NAGC treats the social-emotional dimension as CORE, not an optional add-on: asynchronous development (uneven intellectual, emotional, and physical growth), perfectionism, underachievement, and twice-exceptional (2e) learners (gifted AND having a disability). Weave these considerations in wherever they are relevant, never as an afterthought.`

const STATE_DISCLAIMER = `State-specific GT identification criteria, eligibility cut-scores, and service-delivery requirements vary widely by state and district. Do NOT invent or assert any state-specific rule. Populate state_verification_note with a brief reminder that the teacher/coordinator should verify identification and service requirements against their own state and district GT policy.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function bandContextLine(band) {
  return `Grade band: ${band.label} (use grade_bands ${JSON.stringify(band.grades)} — a JSON array of numbers, 0 = Kindergarten)`
}

/**
 * @param {Object} input
 * @param {'differentiate'|'enrich'|'support'} input.mode
 * @param {string}  input.gradeBand  one of 'k-2' | '3-5' | '6-8' | '9-12'
 *
 * Mode 'differentiate' / 'enrich':
 * @param {string}  input.topic
 * @param {string}  [input.contentArea]
 * @param {string}  [input.teacherNotes]
 *
 * Mode 'support':
 * @param {string}  input.focus  e.g. 'Twice-exceptional (2e)' | 'Underachievement' | 'Perfectionism'
 * @param {string}  [input.situation]
 *
 * @returns {{ system: string, user: string }}
 */
// Elementary hands-on/kinesthetic lens (K-2/3-5 toggle) — favors manipulatives,
// movement, and tactile work over worksheet/seatwork. Applied to the differentiate
// and enrich modes (the support mode is advisory guidance, not a lesson).
const HANDS_ON_DIRECTIVE = `\n\nHANDS-ON / KINESTHETIC EMPHASIS (elementary): Deliver the depth and challenge through hands-on, kinesthetic, and movement-based work — NOT worksheets or seatwork. Favor manipulatives and physical objects, model-building and design, investigations, tactile exploration, sorting / building / acting-out, movement, and open-ended making, plus partner or group work where students are up and doing. The MAIN task should be concrete and physical while still raising depth, complexity, and cognitive demand (rigor comes from the thinking, not from paper). Actively STEER AWAY from paper-based independent worksheets as the core task — keep any written recording brief and secondary to the physical doing. Keep it developmentally appropriate for young learners' attention spans and motor skills.`

export function buildGiftedTalentedPrompt(input) {
  const { mode } = input
  if (mode === "enrich") return buildEnrichPrompt(input)
  if (mode === "support") return buildSupportPrompt(input)
  return buildDifferentiatePrompt(input)
}

// ─── Mode: Differentiate (Depth & Complexity) ────────────────────────────────
function buildDifferentiatePrompt({
  gradeBand = "3-5",
  topic = "",
  contentArea = "",
  teacherNotes = "",
  handsOn = false,
  stationsMode = false,
  stationCount = 3,
}) {
  const band = resolveBand(gradeBand)

  const system = `You are an experienced Gifted & Talented specialist and curriculum coordinator helping a teacher take a grade-level topic and build a differentiated, extended version for gifted and high-ability learners. Your job is to raise the depth, complexity, and cognitive demand of the topic WITHOUT simply assigning more work. Every extension must be intellectually richer, not merely longer.

${STANDARDS_STACK}

For this mode, the Depth and Complexity framework (Kaplan) is the primary engine. Select the Depth and Complexity dimensions that genuinely fit this topic (do not force all eleven) and turn each into a concrete, usable thinking prompt AND a student task — not just a label.

${JSON_ONLY} Match this schema exactly:

{
  "mode": "differentiate",
  "title": string,
  "subject": "Gifted & Talented",
  "grade_bands": number[],
  "topic": string,
  "content_area": string,
  "learning_target": string,
  "depth_complexity": [ { "dimension": string, "prompt": string, "task": string } ],
  "tiered_assignments": { "on_grade_level": string, "advanced": string, "highly_advanced": string },
  "curriculum_compacting": string,
  "higher_order_questions": string[],
  "extension_products": string[],
  "flexible_grouping": string,
  "assessment": string,
  "social_emotional_note": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "state_verification_note": string
}

Field notes:
- title: specific and topic-flavored (e.g., "Beyond the Water Cycle: Systems, Change Over Time, and Unanswered Questions").
- subject: always exactly "Gifted & Talented".
- grade_bands: ${JSON.stringify(band.grades)} exactly.
- learning_target: one advanced "Students will…" target pitched above grade level for this band.
- depth_complexity: 4–6 entries. dimension = the Kaplan dimension name (e.g., "Patterns", "Ethics", "Over Time", "Multiple Perspectives"); prompt = the thinking prompt phrased for students; task = a concrete task or question students actually do with that lens on THIS topic.
- tiered_assignments: three genuinely different tiers of the SAME topic by readiness — on_grade_level (the base), advanced, and highly_advanced. Each escalates abstraction/independence, not volume.
- curriculum_compacting: how a teacher pre-assesses and compacts this topic for students who have already mastered the grade-level content, and what those students do with the bought-back time.
- higher_order_questions: 3–5 open, analysis/evaluation/creation-level questions (no single right answer).
- extension_products: 3–5 authentic products or performances that demonstrate deep understanding (e.g., a policy proposal, a model, an expert interview, a documentary).
- flexible_grouping: how to group students for this topic (cluster grouping, like-readiness pairs, interest groups) and when to regroup.
- assessment: how to assess the deeper thinking — rubric focus on reasoning and transfer, not recall.
- social_emotional_note: one focused note on a relevant SE consideration for THIS work (e.g., perfectionism during open-ended products, asynchronous development, engaging an underachiever, supporting a 2e learner's access).
- standards_alignment: 2–4 entries citing NAGC (by standard area) and/or NAGC-CEC; framework field must be exactly "NAGC" or "NAGC-CEC".
- ${STATE_DISCLAIMER}${handsOn ? HANDS_ON_DIRECTIVE : ""}${stationsMode ? stationsDirective({ stationCount, field: "depth_complexity prompts and extension_products", unit: "enrichment / depth", note: "GIFTED FRAMING: frame each station around DEPTH & ENRICHMENT — e.g., an INQUIRY station, a RESEARCH station, an INDEPENDENT-PROJECT / product station, an open-ended CHALLENGE station — NOT skill-drill or remediation rotation. Each station raises depth, complexity, and cognitive demand with higher-order questions, real choice, and student-directed work. Keep the depth_complexity, tiered_assignments, and extension_products intact." }) : ""}`

  const user = `Build a Depth & Complexity differentiation for gifted / high-ability learners:

- Topic: ${topic || "(choose an appropriate grade-band topic)"}
- Content area: ${contentArea || "(infer from the topic)"}
- ${bandContextLine(band)}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Return the JSON object now.`

  return { system, user }
}

// ─── Mode: Enrich vs Accelerate (Renzulli Triad) ─────────────────────────────
function buildEnrichPrompt({
  gradeBand = "3-5",
  topic = "",
  contentArea = "",
  teacherNotes = "",
  handsOn = false,
  stationsMode = false,
  stationCount = 3,
}) {
  const band = resolveBand(gradeBand)

  const system = `You are an experienced Gifted & Talented specialist advising a teacher or GT coordinator on how to extend a topic for gifted learners through ENRICHMENT and/or ACCELERATION, and on how to decide between them. Be concrete and practical, and be honest that these are two different responses to giftedness that serve different needs.

${STANDARDS_STACK}

For this mode, use Renzulli's Enrichment Triad Model to structure the enrichment options (label each as Type I, II, or III), and treat acceleration as a distinct, legitimate option (content acceleration, subject/grade acceleration, curriculum compacting that buys time to move ahead). Give the teacher clear decision-making guidance for enrichment vs. acceleration.

${JSON_ONLY} Match this schema exactly:

{
  "mode": "enrich",
  "title": string,
  "subject": "Gifted & Talented",
  "grade_bands": number[],
  "topic": string,
  "content_area": string,
  "enrichment_options": [ { "renzulli_type": string, "title": string, "description": string } ],
  "acceleration_options": [ { "type": string, "description": string } ],
  "acceleration_vs_enrichment": string,
  "flexible_grouping": string,
  "recommended_products": string[],
  "social_emotional_note": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "state_verification_note": string
}

Field notes:
- title: topic-flavored (e.g., "Fractions, Faster and Deeper: Enrichment and Acceleration Paths").
- subject: always exactly "Gifted & Talented"; grade_bands: ${JSON.stringify(band.grades)} exactly.
- enrichment_options: 3–4 entries. renzulli_type = "Type I", "Type II", or "Type III"; title = short name; description = what students actually do, tied to THIS topic.
- acceleration_options: 2–3 realistic acceleration moves for this topic/band (e.g., compact-and-move-ahead, single-subject acceleration, above-level materials/assessment), each with a concrete description.
- acceleration_vs_enrichment: a practical paragraph on how to decide — when acceleration is the right call (pace/mastery, above-level readiness) vs. when enrichment fits (depth, breadth, creative productivity) — including the role of above-level assessment data.
- flexible_grouping: how grouping supports these options for this topic.
- recommended_products: 3–5 authentic products/outcomes.
- social_emotional_note: one relevant SE consideration (e.g., peer fit after acceleration, perfectionism, underachievement re-engagement, 2e access).
- standards_alignment: 2–4 entries; framework exactly "NAGC" or "NAGC-CEC".
- ${STATE_DISCLAIMER}${handsOn ? HANDS_ON_DIRECTIVE : ""}${stationsMode ? stationsDirective({ stationCount, field: "enrichment_options", unit: "enrichment / inquiry", note: "GIFTED FRAMING: frame each station around DEPTH & ENRICHMENT — e.g., an INQUIRY station, a RESEARCH station, an INDEPENDENT-PROJECT / product station, an open-ended CHALLENGE station — NOT skill-drill or remediation rotation. Each station raises depth, complexity, and cognitive demand with higher-order questions and real student choice, consistent with the Renzulli enrichment framing." }) : ""}`

  const user = `Suggest enrichment and acceleration options for gifted learners:

- Topic: ${topic || "(choose an appropriate grade-band topic)"}
- Content area: ${contentArea || "(infer from the topic)"}
- ${bandContextLine(band)}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Return the JSON object now.`

  return { system, user }
}

// ─── Mode: Support (2e / underachievement / asynchronous) ────────────────────
function buildSupportPrompt({
  gradeBand = "3-5",
  focus = "",
  situation = "",
}) {
  const band = resolveBand(gradeBand)

  const system = `You are an experienced Gifted & Talented specialist and consultant helping a teacher or GT coordinator identify and support gifted students whose needs are easy to miss — twice-exceptional (2e) learners, underachieving gifted students, and students whose asynchronous development or perfectionism is affecting them. Your guidance must be practical, strengths-based, and non-deficit in tone. You never pathologize giftedness; you help the adult see the student clearly and respond well.

${STANDARDS_STACK}

This is guidance for the educator, not a diagnosis. Be clear that identification of a disability is a formal process; your role is to help the teacher recognize indicators, respond supportively, and know when to loop in specialists, families, and school teams.

${JSON_ONLY} Match this schema exactly:

{
  "mode": "support",
  "title": string,
  "focus": string,
  "grade_band_label": string,
  "overview": string,
  "identification_indicators": string[],
  "common_misconceptions": string[],
  "support_strategies": string[],
  "asynchronous_development_note": string,
  "perfectionism_note": string,
  "social_emotional_supports": string[],
  "collaboration_note": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "state_verification_note": string
}

Field notes:
- title: specific to the focus and band (e.g., "Spotting and Supporting Twice-Exceptional Learners in Grades 3–5").
- focus: the population/issue in focus (echo the requested focus).
- grade_band_label: "${band.label}".
- overview: 1–2 paragraphs framing the focus in strengths-based, developmentally appropriate terms for this band.
- identification_indicators: 4–6 concrete, observable indicators a teacher might notice for this focus at this band (behavioral and academic) — clearly framed as signals to explore, not proof.
- common_misconceptions: 3–4 myths/misreads to avoid (e.g., "a 2e student can't be gifted because they struggle in reading").
- support_strategies: 5–7 practical, classroom-level strategies the teacher can use — specific, not generic.
- asynchronous_development_note: how uneven development shows up for this focus/band and how to respond.
- perfectionism_note: how perfectionism may present and healthy ways to address it (or, if less relevant to this focus, how it may interact).
- social_emotional_supports: 3–5 SE supports (self-advocacy, mindset, safe risk-taking, connection with intellectual peers).
- collaboration_note: how and when to involve families, special education / 504 teams, counselors, and GT staff.
- standards_alignment: 2–4 entries; framework exactly "NAGC" (esp. Standard 1 Learning & Development and Standard 4 Learning Environments) or "NAGC-CEC".
- ${STATE_DISCLAIMER}`

  const user = `Provide identification and support guidance for a gifted-education educator:

- Focus: ${focus || "Twice-exceptional (2e) learners"}
- ${bandContextLine(band)}${situation ? `\n- Situation / context: ${situation}` : ""}

Do not use student names or personally identifying information. Return the JSON object now.`

  return { system, user }
}
