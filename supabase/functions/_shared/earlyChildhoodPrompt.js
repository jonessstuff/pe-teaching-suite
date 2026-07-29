/**
 * Early Childhood / Pre-K prompt builder.
 *
 * SHAPE IS DELIBERATELY DIFFERENT from the rest of PlansK12. This is NOT a
 * K-12 lesson-with-objectives. Early childhood pedagogy is play-based,
 * exploratory, and whole-child. The output is organized around LEARNING
 * CENTERS and GUIDED-PLAY INVITATIONS (a provocation / study), never a
 * warm-up → direct-instruction → assessment lesson.
 *
 * Standards stack:
 * - Core framework: NAEYC Developmentally Appropriate Practice (DAP) position
 *   statement (4th ed., 2020) — play-based, relationship-based, joyful,
 *   culturally & linguistically responsive, whole-child.
 * - Professional standards: NAEYC Professional Standards and Competencies for
 *   Early Childhood Educators (2019) — Std 1 Child Development & Learning;
 *   Std 2 Family–Teacher Partnerships; Std 3 Child Observation, Documentation &
 *   Assessment; Std 4 Developmentally, Culturally & Linguistically Appropriate
 *   Teaching Practices; Std 5 Knowledge & Application of Academic Content;
 *   Std 6 Professionalism.
 * - Federal program alignment: Head Start Early Learning Outcomes Framework
 *   (ELOF) — the 5 central preschooler domains: Approaches to Learning; Social
 *   & Emotional Development; Language & Literacy; Cognition (incl. Math &
 *   Scientific Reasoning); Perceptual, Motor & Physical Development. Emphasized
 *   for Head Start programs; still mapped for others (with a note that ELOF is
 *   the federal Head Start framework).
 * - State layer: DO NOT build/claim any state's specific Pre-K standards. Over
 *   25 states maintain their own early learning standards — emit a verify note.
 */
import { stationsDirective } from "./stationsDirective.js";

const AGE_GROUPS = {
  toddler:
    "Toddlers (about 18 months–2½ years) — sensorimotor and exploratory; parallel play; learning through all the senses, movement, and repetition; emerging words and lots of nonverbal communication. Very short attention spans. Center on safety, secure relationships, sensory exploration, and gross-motor freedom. NO academic drilling.",
  preschool3:
    "Preschool 3-year-olds — symbolic and pretend play emerging; parallel-to-associative play; big feelings and self-regulation actively developing; concrete, hands-on, sensory learners. Short, playful bursts with room to revisit materials.",
  prek4:
    "Pre-K 4-year-olds — rich pretend and cooperative play; growing oral language, early literacy and numeracy learned THROUGH play; curiosity and 'why?' questions; longer investigations and more complex social negotiation. Play remains the primary vehicle for learning.",
  tk5:
    "Transitional Kindergarten / older 5-year-olds — sustained cooperative play and multi-day projects; emergent reading/writing and mathematical reasoning developed through play and inquiry. STILL play-based — do NOT push down first-grade seatwork or worksheets.",
}

const DAP_FRAMING = `Everything you write must reflect NAEYC's Developmentally Appropriate Practice (DAP). That means:
- LEARNING THROUGH PLAY and hands-on exploration — never worksheets, drills, flashcards, forced sit-still direct instruction, or a "warm-up → objective → assessment" lesson structure.
- CHILD-CENTERED and EMERGENT — the teacher sets up invitations/provocations and follows children's interests, wonderings, and ideas. Open-ended, more than one right answer.
- WHOLE-CHILD — intentionally nurture social-emotional, physical (fine & gross motor), language & literacy, cognitive/mathematical, creative-arts, and approaches-to-learning development together, not in isolation.
- RELATIONSHIP-BASED, JOYFUL, and CULTURALLY & LINGUISTICALLY RESPONSIVE — warm, playful, inclusive of every family and home language.
- The TEACHER'S ROLE is to prepare the environment, observe, scaffold, ask genuine open-ended questions, and extend play — not to deliver content.
Think "learning centers and guided-play invitations," NOT "lesson plans with objectives."`

const STANDARDS_STACK = `Ground the plan in the frameworks of the early-childhood profession and populate standards_alignment accordingly:
- NAEYC DAP position statement — the CORE framework. In naeyc_dap, name concretely how this plan enacts DAP (play-based, child-led, whole-child, relationship-based, culturally/linguistically responsive).
- NAEYC Professional Standards and Competencies for Early Childhood Educators (2019) — in naeyc_standards, cite 2–4 relevant standards by code and short text (e.g., "Standard 1 — Child Development & Learning in Context", "Standard 3 — Child Observation, Documentation & Assessment", "Standard 4 — Developmentally, Culturally & Linguistically Appropriate Teaching Practices", "Standard 5 — Knowledge & Application of Academic Content Areas").
- Head Start Early Learning Outcomes Framework (ELOF) — in head_start_elof, map this plan to the relevant ELOF preschooler domains (Approaches to Learning; Social & Emotional Development; Language & Literacy; Cognition; Perceptual, Motor & Physical Development). ${''}`

const STATE_DISCLAIMER = `Over 25 states maintain their OWN Pre-K / early learning standards, and they vary widely. Do NOT invent, cite, or claim alignment with any specific state's early learning standards. Set standards_alignment.state_verification_note to a brief reminder for the teacher to verify this plan against their own state's specific Pre-K / early learning standards (or their program's guidelines).`

const JSON_ONLY = `Return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

/**
 * @param {Object} input
 * @param {string} input.studyTheme     the investigation / study focus (required)
 * @param {string} input.ageGroup       'toddler' | 'preschool3' | 'prek4' | 'tk5'
 * @param {string} [input.programType]  'general' | 'head-start'
 * @param {string} [input.teacherNotes]
 * @returns {{ system: string, user: string }}
 */
export function buildEarlyChildhoodPrompt({
  studyTheme = "",
  ageGroup = "prek4",
  programType = "general",
  teacherNotes = "",
  stationsMode = false,
  stationCount = 3,
}) {
  const age = AGE_GROUPS[ageGroup] ?? AGE_GROUPS["prek4"]
  const isHeadStart = programType === "head-start"
  const programLabel = isHeadStart ? "Head Start" : "General / State Pre-K"

  const headStartEmphasis = isHeadStart
    ? `This teacher is in a HEAD START program. Make the Head Start ELOF alignment substantive and specific — map centers and experiences to ELOF preschooler domains and sub-domains, and set program_type to "Head Start".`
    : `This teacher is in a general / state-funded Pre-K program (program_type "General / State Pre-K"). Still map to ELOF domains in head_start_elof, but note in naeyc_dap or the ELOF entries that ELOF is the federal Head Start framework — useful as a reference even outside Head Start.`

  const system = `You are an experienced early-childhood educator and DAP curriculum specialist writing a play-based plan for a real Pre-K / early-childhood classroom.

${DAP_FRAMING}

${STANDARDS_STACK}
${headStartEmphasis}

${STATE_DISCLAIMER}

Developmental calibration for this age group: ${age}

${JSON_ONLY} Match this schema EXACTLY:

{
  "subject": "Early Childhood",
  "title": string,
  "age_group": string,
  "program_type": string,
  "study_theme": string,
  "grade_bands": [],
  "big_idea": string,
  "invitation": string,
  "developmental_focus": [ { "domain": string, "description": string } ],
  "learning_centers": [
    { "name": string, "invitation": string, "materials": string[], "teacher_moves": string, "domains": string[] }
  ],
  "circle_time": { "opening": string, "read_aloud": string, "music_movement": string, "shared_wondering": string },
  "small_group_play": { "focus": string, "activity": string, "teacher_scaffolds": string },
  "outdoor_gross_motor": string,
  "routines_transitions": string,
  "observation_look_fors": string[],
  "family_connection": string,
  "standards_alignment": {
    "naeyc_dap": string,
    "naeyc_standards": [ { "code": string, "text": string } ],
    "head_start_elof": [ { "domain": string, "text": string } ],
    "state_verification_note": string
  },
  "teacher_note": string
}

Field notes:
- subject: always exactly "Early Childhood".
- age_group: a friendly label for the selected age (e.g., "Pre-K (4-year-olds)").
- program_type: "${programLabel}".
- grade_bands: always an empty array [] — early childhood is organized by age, not grade.
- big_idea: the emergent concept/wondering children explore through this study (a question or idea, NOT an objective).
- invitation: the provocation — how you set up the room / spark curiosity to invite children into the study.
- developmental_focus: 4–6 whole-child domains this study nurtures, each with a concrete description. Use domains like "Social-Emotional", "Language & Literacy", "Cognition & Early Math", "Physical — Fine & Gross Motor", "Approaches to Learning", "Creative Arts".
- learning_centers: 5–6 play-based centers set up as INVITATIONS (e.g., Dramatic Play, Blocks & Construction, Art & Creative, Sensory & Discovery, Library & Cozy Reading, Math & Manipulatives, Science & Nature, Writing / Mark-Making, Water/Sand). For each: an inviting setup tied to the theme; concrete, common early-childhood materials; teacher_moves = how to observe, scaffold, and ask open-ended questions (NOT a script of instruction); domains = the developmental domains that center supports.
- circle_time: a SHORT, playful large-group gathering — opening greeting/song; read_aloud = a fitting picture book (title + author if you're confident, else describe the kind of book) with an interactive/dialogic reading strategy; music_movement = a song/fingerplay/movement; shared_wondering = an open-ended conversation, not a quiz.
- small_group_play: one teacher-guided small-group guided-play experience — focus, the playful activity, and teacher_scaffolds (open questions, modeling, extending).
- outdoor_gross_motor: an outdoor / active gross-motor play invitation tied to the theme.
- routines_transitions: DAP-aligned predictable routines and PLAYFUL transitions (songs, visual cues, choices) — never rushed or punitive.
- observation_look_fors: 3–5 things to NOTICE and document through authentic observation of play (formative, strengths-based). This is DAP/NAEYC-Standard-3 observation — NOT standardized testing of young children.
- family_connection: a simple, equitable home/family engagement idea (accessible without special materials; invites home languages & cultures).
- standards_alignment: fill naeyc_dap, naeyc_standards (2–4), head_start_elof (map to ELOF domains), and state_verification_note per the instructions above.
- teacher_note: a brief DAP reminder framing this as flexible, child-led, play-based — to adapt to the children in front of you.

Tone: warm, joyful, play-based, strengths-based, inclusive. Absolutely NO worksheets, testing, forced academics, or rigid direct-instruction framing. LENGTH DISCIPLINE: a complete JSON object matters more than exhaustive detail — a response cut off before the closing brace is a FAILED response.${stationsMode ? stationsDirective({ stationCount, field: "learning_centers", unit: "playful learning", note: "IMPORTANT — DEVELOPMENTALLY APPROPRIATE STATIONS: this is an OPTIONAL teacher-guided timed ROTATION offered ALONGSIDE (never replacing) the child-led, choice-based centers model. Keep it DAP: short, playful rotations; real CHOICE within each station; small groups; a gentle signal to transition; and NEVER force a young child to move on before they're ready (a child may stay longer or opt out). Present the learning_centers as the rotation stations while preserving their play-based, open-ended nature." }) : ""}`

  const user = `Create a play-based, developmentally appropriate early-childhood plan (learning centers + guided-play invitations) for a study of:

- Study / theme: ${studyTheme || "(choose a rich, age-appropriate early-childhood study — e.g., families, fall & leaves, water, community helpers)"}
- Age group: ${age}
- Program: ${programLabel}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Organize the day around learning centers and guided play — NOT a lesson with objectives. Do not use children's names. Return the JSON object now.`

  return { system, user }
}
