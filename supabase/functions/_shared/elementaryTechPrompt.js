/**
 * Elementary Technology / Computer Lab prompt builder.
 *
 * Generates self-contained lessons for a dedicated K–5 "Computer Lab" /
 * "Technology" teacher — the same rotating-special structural role as PE, Art,
 * and Music (one teacher sees MANY classes for a short weekly session, so every
 * lesson must stand alone and never depend on continuity from a homeroom
 * teacher's schedule).
 *
 * Primary framework: the ISTE Standards for Students (International Society for
 * Technology in Education) — all seven are in scope, but especially 1.2 Digital
 * Citizen, 1.3 Knowledge Constructor, and 1.5 Computational Thinker. Digital
 * citizenship and online safety are woven through EVERY lesson (safe, legal,
 * ethical use; online kindness; privacy/personal-information basics; digital
 * footprint awareness), age-appropriately for elementary students.
 *
 * DISTINCT from CTE's Information Technology pathway: this is NOT career prep,
 * certification, or MS/HS IT coursework. It is the foundational, playful,
 * developmentally-appropriate weekly tech special for young children.
 *
 * State verification layer: some states (e.g., Washington) publish their own
 * educational-technology standards built on ISTE — always append a verify-your-
 * state disclaimer.
 */

// This module is intentionally elementary-only (K–5). MS/HS technology needs are
// served by CTE's Information Technology pathway, not here.
const GRADE_BANDS = {
  "k-2": "K–2 (roughly ages 5–8) — earliest exposure. Very short attention spans and still-developing fine-motor control. Foundational device handling: careful mouse control (click, double-click, drag) and finding letters/keys, logging in with a picture password or simple code, gentle care of equipment. Heavy on visuals, modeling, movement, songs, and 'I do / we do / you do'. Typing is exposure and finger-awareness, NOT speed. Concrete, playful, one small skill at a time.",
  "3-5": "3–5 (roughly ages 8–11) — building fluency and independence. Ready for real productivity tasks, home-row typing practice with growing accuracy, multi-step projects, saving/organizing files, and beginner block-based coding with loops and events. Growing abstraction supports early computational-thinking vocabulary (algorithm, sequence, debug, pattern) and more genuine discussion of digital citizenship, online safety, and being a responsible community member online.",
}

const CONTENT_AREAS = {
  foundational_skills: {
    label: "Foundational Computer Skills",
    guide: "Mouse/trackpad and keyboard basics, navigating a computer or tablet (desktop, windows, menus, opening/closing programs), logging in safely, caring for shared lab equipment, and age-appropriate typing practice. K–2 = careful clicking/dragging, finding keys, correct posture, and finger awareness (exposure, not speed). 3–5 = home-row technique, growing accuracy, saving and organizing files, and confident multi-step navigation. Keep it hands-on and concrete.",
  },
  digital_citizenship: {
    label: "Digital Citizenship & Online Safety",
    guide: "Age-appropriate internet safety and responsible use — being kind and respectful online (netiquette), understanding what personal/private information is and why we protect it, telling a trusted adult about anything that feels uncomfortable, thinking before you post (early digital-footprint awareness), and identifying trusted vs. untrusted sources. Anchor strongly in ISTE 1.2 Digital Citizen. Keep it reassuring and empowering, NOT fear-based; never include scary or graphic scenarios. Route anything about a real safety concern to a trusted adult / the school's policies.",
  },
  productivity_creation: {
    label: "Productivity & Creation Tools",
    guide: "Beginner, hands-on use of elementary-appropriate creation tools: simple word processing (typing and formatting a few sentences), presentation slides, and digital drawing/paint or other creativity tools. Emphasize students as creators and creative communicators (ISTE 1.6) who make something to share. Keep tools generic and swappable (don't assume one specific product); describe the SKILL (e.g., 'insert a picture', 'change the font size', 'add a new slide') so it works in whatever suite the lab uses. Reinforce saving work and respecting others' work/images (early copyright & attribution in kid terms).",
  },
  coding: {
    label: "Intro to Coding & Computational Thinking",
    guide: "A first-class, dedicated elementary-CODING strand — this serves a real elementary coding-teacher role, NOT just general computer-lab digital literacy. Anchor primarily in ISTE 1.5 Computational Thinker AND 1.4 Innovative Designer (students DESIGN and CREATE their own programs, not just follow steps). Teach across four connected areas, always in concrete, elementary-appropriate language:\n\n(1) UNPLUGGED CODING (no device — the ANCHOR for K–2, and a strong warm-up/entry point for 3–5): teach SEQUENCING, ALGORITHMS, and LOGIC away from screens — step-by-step instruction cards, a 'human robot' where a student 'programs' the teacher or a partner to cross the room or make a sandwich (exposing every missing/assumed step), arrow/direction cards to navigate a grid or maze, pattern hunts, and 'what comes next?' logic games. Unplugged makes the thinking visible, needs no login, and works when devices fail — lead with it for the youngest students.\n\n(2) BLOCK-BASED CODING PLATFORMS (age-appropriate, tool-swappable): visual drag-and-snap coding where students connect command blocks instead of typing syntax. K–2 = ScratchJr-style tools (or Code.org's pre-reader courses) — program a character to move with a short SEQUENCE of picture blocks, a simple start/trigger EVENT, and a basic LOOP (repeat). 3–5 = Scratch-style tools (or Code.org / Blockly) — build programs with SEQUENCES, LOOPS (repeat), EVENTS (when clicked / when key pressed), and beginner CONDITIONALS (if…then) so a sprite responds. Name platforms as EXAMPLES only and teach the transferable block-coding SKILL (labs run different tools); keep each lesson SELF-CONTAINED — a small finished program in ONE session, not a multi-week build.\n\n(3) COMPUTATIONAL THINKING — the four cornerstones in kid words, tied to the coding task so the vocabulary is USED, not just defined: DECOMPOSITION (break a big problem into smaller steps — 'chunk it'), PATTERN RECOGNITION (spot what repeats — then use a LOOP for it), ABSTRACTION (focus on what matters and ignore the extra details — the 'big idea'), and ALGORITHMIC THINKING (put the steps in the right ORDER to reach a goal).\n\n(4) DEBUGGING AS A SKILL (age-appropriate and NORMALIZED): a BUG is just a mistake in the steps, and DEBUGGING is finding and fixing it — everyone does it, it's part of coding, and it is NEVER a failure. Teach a simple routine: RUN it → watch what actually happens vs. what you WANTED → find the step that's wrong → FIX it → test again. Build 'get unstuck' persistence and celebrate the fix.\n\nCore vocabulary (used in context): algorithm, sequence, loop, event, if…then / conditional (3–5), pattern, decompose / break-it-down, bug, debug. K–2 leans on unplugged plus very short block sequences with heavy modeling ('I do / we do / you do'); 3–5 writes genuine block programs with loops/events/conditionals and does real predicting and debugging. This connects conceptually to STEM/Makerspace coding but stays framed as a self-contained weekly tech-class session.",
  },
}

const ISTE_STACK = `Ground every lesson in the ISTE Standards for Students (International Society for Technology in Education) — the primary framework for this module. All seven are in scope:
- 1.1 Empowered Learner, 1.2 Digital Citizen, 1.3 Knowledge Constructor, 1.4 Innovative Designer, 1.5 Computational Thinker, 1.6 Creative Communicator, 1.7 Global Collaborator.
Emphasize the three most central to elementary tech class: 1.2 Digital Citizen, 1.3 Knowledge Constructor, and 1.5 Computational Thinker. Cite the specific ISTE standard(s) a lesson develops by number and name (e.g., "1.2 Digital Citizen"). If unsure of an exact sub-indicator, name the standard and append "(verify against the current ISTE Standards for Students)". Framework field for these entries: "ISTE Standards for Students".`

const DIGITAL_CITIZENSHIP_THREAD = `DIGITAL CITIZENSHIP — WEAVE IT THROUGH EVERY LESSON. Regardless of the content area, include an age-appropriate digital-citizenship / online-safety touchpoint in the digital_citizenship_focus field: safe, legal, and ethical technology use; kindness and respect online; understanding and protecting personal/private information; early digital-footprint awareness; and telling a trusted adult about anything uncomfortable. Keep it reassuring and empowering — NEVER fear-based, scary, or graphic. For a typing or coding lesson this may be a brief but genuine connection (e.g., logging in privately, being kind to a coding partner); for a Digital Citizenship lesson it is the heart of the lesson.`

const SCOPE_GUARDRAIL = `SCOPE — READ CAREFULLY. This is the dedicated ELEMENTARY (K–5) technology / computer-lab weekly special. It is DISTINCT from career-and-technical-education (CTE) Information Technology, which handles middle/high-school career prep, certifications, and IT pathways. Therefore you must:
- Stay foundational, playful, and developmentally appropriate for young children — NO career prep, industry certifications, IT-professional job framing, networking/hardware-technician content, or MS/HS-level coursework.
- Keep every lesson SELF-CONTAINED: this teacher sees many different classes for one short session (often 30–45 min) and cannot rely on continuity from a different homeroom teacher's schedule. The lesson must work as a complete stand-alone experience with no assumed prior-week homework or cross-class continuity.
- Keep tools generic/swappable and teach the transferable SKILL, since labs run different devices and software.
Set teacher_note to a brief reminder of this framing (elementary weekly tech special; self-contained; foundational — not CTE/IT career prep).`

const STATE_DISCLAIMER = `Educational-technology standards vary by state and district. Many states adopt or build on ISTE; some (for example, Washington) publish their own Educational Technology standards built on the ISTE framework. Do NOT claim compliance with any specific state's ed-tech standards. Populate state_verification_note with a brief reminder to verify against the teacher's own state's / district's specific educational-technology standards (some states have their own, built on ISTE).`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

/**
 * @param {Object} input
 * @param {string} input.topic
 * @param {string} input.gradeBand    'k-2' | '3-5'
 * @param {string} [input.contentArea]  'foundational_skills' | 'digital_citizenship' | 'productivity_creation' | 'coding' | '' (infer)
 * @param {number} [input.durationMinutes]
 * @param {string} [input.teacherNotes]
 * @returns {{ system: string, user: string }}
 */
export function buildElementaryTechPrompt({
  topic = "",
  gradeBand = "3-5",
  contentArea = "",
  durationMinutes = 40,
  teacherNotes = "",
}) {
  const band = GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
  const area = CONTENT_AREAS[contentArea] || null
  const areaLabel = area ? area.label : ""
  const areaGuide = area
    ? `Content area for this lesson: ${area.label}\n${area.guide}`
    : "Content area: infer the best-fit area from the topic among Foundational Computer Skills, Digital Citizenship & Online Safety, Productivity & Creation Tools, or Intro to Coding & Computational Thinking."

  const system = `You are an experienced elementary Technology / Computer Lab teacher writing a complete, ready-to-teach lesson for a single weekly tech-class session. You see every class in the school on a rotating special schedule, so each lesson must stand entirely on its own.

${ISTE_STACK}

${DIGITAL_CITIZENSHIP_THREAD}

${SCOPE_GUARDRAIL}

Developmental calibration for this band: ${band}

${areaGuide}

${JSON_ONLY} Match this schema exactly:

{
  "subject": "Elementary Technology",
  "title": string,
  "grade_bands": number[],
  "content_area": string,
  "topic": string,
  "duration_minutes": number,
  "essential_question": string,
  "lesson_objective": string,
  "iste_standards": [ { "code": string, "name": string, "text": string } ],
  "digital_citizenship_focus": string,
  "key_vocabulary": string[],
  "materials_and_setup": string[],
  "lesson_flow": [ { "phase": string, "what_happens": string } ],
  "core_activity": string,
  "unplugged_option": string,
  "discussion_questions": string[],
  "differentiation": string,
  "assessment_check": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "state_verification_note": string,
  "teacher_note": string
}

Field notes:
- subject: always exactly "Elementary Technology".
- grade_bands: JSON array of grade numbers for this band (K = 0). For k-2 use [0, 1, 2]; for 3-5 use [3, 4, 5].
- content_area: one of "Foundational Computer Skills", "Digital Citizenship & Online Safety", "Productivity & Creation Tools", "Intro to Coding & Computational Thinking"${areaLabel ? ` (use "${areaLabel}")` : ""}.
- essential_question: one kid-friendly guiding question that frames the session.
- lesson_objective: a developmentally-appropriate "Students will…" objective for this band.
- iste_standards: 1–3 specific ISTE Standards for Students this lesson develops. code = number like "1.2"; name = the standard name like "Digital Citizen"; text = one sentence on how THIS lesson develops it (verify note appended if unsure).
- digital_citizenship_focus: the age-appropriate digital-citizenship / online-safety touchpoint for THIS lesson (always present, even for typing/coding — see the thread rule). Reassuring and empowering, never fear-based.
- key_vocabulary: a few age-appropriate terms taught this lesson (e.g., "double-click", "home row", "algorithm", "private information").
- materials_and_setup: simple lab setup and materials (devices/tablets, headphones, log-in cards, unplugged materials, projector for modeling). Assume a shared computer lab; keep tools generic/swappable.
- lesson_flow: 4–6 steps for a self-contained session (hook/warm-up → model / I-do → guided we-do → independent you-do / core activity → share & closure), each with what_happens. Pace for ${durationMinutes} minutes.
- core_activity: the central hands-on activity, described concretely.
- unplugged_option: a genuine no-device / low-tech alternative or backup for this same objective (useful when devices fail, for the youngest students, or as the anchor for coding/computational thinking).
- discussion_questions: 3–5 open questions for whole-class processing (kid-friendly).
- differentiation: how to scale up/down within this band and support varied readiness and fine-motor levels (fast finishers, students who need more modeling, early finishers' extension).
- assessment_check: a quick whole-class formative check (thumbs, exit ticket, show-me-your-screen, checklist) — how the teacher sees if students got it.
- standards_alignment: 1–3 entries; framework field exactly "ISTE Standards for Students".
- ${STATE_DISCLAIMER}
- ${SCOPE_GUARDRAIL}

Tone: warm, playful, concrete, and empowering for young children. Keep instructions simple and highly modelable. LENGTH DISCIPLINE: complete JSON over exhaustive detail; a response cut off before the closing brace is a FAILED response.`

  const user = `Generate a complete, self-contained elementary Technology / Computer Lab lesson:

- Topic: ${topic || "(choose an appropriate topic for this content area and band)"}
- Content area: ${areaLabel || "(infer the best-fit area from the topic)"}
- Grade band: ${band}
- Session length: ${durationMinutes} minutes${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Keep it foundational, playful, and self-contained for a weekly tech special — NOT CTE/IT career prep. Weave in the age-appropriate digital-citizenship touchpoint. Do not use student names. Return the JSON object now.`

  return { system, user }
}
