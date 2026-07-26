/**
 * Per-tool, per-subject directives appended to a secondary tool's prompt when a
 * module needs its output shaped or safety-guarded (World Languages target-
 * language accuracy, JROTC non-military boundary, Elementary Tech age-
 * calibration, School Counselors sub-plan safeguard, …).
 *
 * `toolDirective(tool, subject)` returns the directive string (or '' if none).
 * Tools call it with the saved lesson's own subject (lessonObject.subject).
 */
import { WL_ACCURACY } from "./wlAccuracy.js"

const WL = "World Languages"
const JROTC = "JROTC"
const ETECH = "Elementary Technology"
const SC = "School Counselors"

const DIRECTIVES = {
  quiz: {
    [WL]: `WORLD LANGUAGES — ${WL_ACCURACY}
QUIZ-SPECIFIC: Every question stem, instruction, and answer/explanation MUST be in ENGLISH. Any target-language content in an item is limited to SHORT, high-frequency vocabulary or phrases (each with an English gloss), drawn from THIS lesson. Use recognition/matching item types — e.g. "Which word means 'good morning'?" with short options, or true/false about a vocabulary meaning. NEVER ask the student to translate a passage or produce sentences in the target language. Calibrate to the lesson's ACTFL proficiency level (Novice = word/phrase recognition & meaning). Short-answer items must be answerable in English.`,
    [JROTC]: `JROTC — NON-MILITARY BOUNDARY: This is a citizenship & leadership knowledge check. Questions test leadership concepts, character/ethics, civics & government, rights & responsibilities, wellness, and financial-literacy content FROM THIS LESSON. NEVER reference weapons, marksmanship, combat, tactical, or military-operations content ANYWHERE — not in a question stem AND not in a multiple-choice option/distractor. Every option, including wrong answers, must be a plausible citizenship/leadership term. Keep every item inside the citizenship/leadership curriculum.`,
    [ETECH]: `ELEMENTARY TECHNOLOGY — AGE-CALIBRATED: For grades K-2 (grade numbers 0-2), make the quiz an ORAL / show-me check the teacher reads aloud: 3-5 very short, concrete, reading-independent items (mostly true/false or 2-option multiple choice), simple everyday words, no typing/reading demands. For grades 3-5, a standard short quiz on the digital-citizenship, computer-skill, and coding concepts from the lesson. Keep vocabulary age-appropriate throughout.`,
  },
  rubric: {
    [WL]: `WORLD LANGUAGES — ${WL_ACCURACY}
RUBRIC-SPECIFIC: Write ALL criteria and level descriptors in ENGLISH, using ACTFL proficiency / Can-Do language appropriate to the lesson's level and the communication mode being assessed (Interpersonal / Interpretive / Presentational). Assess communicative function and the Can-Do target — NOT native-like accuracy. Any example target-language text is short vocab/phrases with glosses only.`,
    [ETECH]: `ELEMENTARY TECHNOLOGY — Assess a concrete CREATION/CODING product (a slide, digital drawing, typing sample, coding project); if the lesson has no student-made product (e.g. a digital-citizenship discussion), assess observable participation behaviors instead — do not invent a product. Use only 2-3 simple, concrete criteria. AGE LABELS (mandatory): for grades K-2 (grade numbers 0-2) the level_labels MUST be kid-friendly and non-numeric — use exactly ["Got it!", "Almost there", "Keep trying"] (three levels, not four). For grades 3-5 a standard scheme is fine. Keep all wording plain and child-appropriate.`,
  },
  exitTicket: {
    [WL]: `WORLD LANGUAGES — ${WL_ACCURACY}
EXIT-TICKET-SPECIFIC: Frame in ENGLISH — a quick check tied to the lesson's ACTFL Can-Do target. Any target-language content is short, high-frequency vocab/phrases with glosses only, never a translation or production task beyond the proficiency level.`,
  },
  subPlan: {
    [WL]: `WORLD LANGUAGES — SUBSTITUTE CONTEXT: Assume the substitute does NOT speak the target language. Write ALL instructions in ENGLISH so a non-speaker can run the class. Do NOT require the sub to model pronunciation, correct target-language output, or teach new language. Favor low-prep, self-explanatory activities (a provided video, worksheet review, a game with an answer key). Where pronunciation/audio matters, point the sub to the teacher's provided recording rather than modeling it.`,
    [SC]: `SCHOOL COUNSELORS — SAFEGUARD: Keep this sub plan STRICTLY basic and universal — schedule/timing, materials, and classroom routine ONLY. The substitute is NOT a counselor. Do NOT provide counseling scripts, techniques, or ways to respond to student disclosures or emotional content. If the lesson topic is sensitive (feelings, conflict, loss, etc.), tell the sub to keep the activity light and structured and to route ANYTHING a student shares that seems sensitive or concerning to the counselor (or a trusted adult/admin) — never to counsel it themselves.`,
  },
  crossCurricular: {
    [SC]: `SCHOOL COUNSELORS — Limit connections to the ACADEMIC and CAREER development domains only (e.g. study skills, organization, goal-setting, college/career awareness). Do NOT frame connections around clinical, therapeutic, or personal disclosure content.`,
  },
  warmup: {
    [WL]: `WORLD LANGUAGES — Provide LANGUAGE-CLASS bell-ringers / openers (NOT PE warm-ups): e.g. a greetings circle, a quick vocabulary-recall game, a "word of the day", or a describe-the-picture prompt. Frame in ENGLISH; any target-language content is short vocab/phrases with glosses. No equipment or fitness framing.`,
  },
  activityBank: {
    [JROTC]: `JROTC — NON-MILITARY BOUNDARY: Activities stay in citizenship, leadership, character, wellness, and life-skills territory. NEVER involve weapons, marksmanship, combat, or tactical content, and do NOT use military rank/drill framing. Drill & ceremony, if referenced at all, is precision teamwork & tradition ONLY (like a marching band or color guard).`,
    [WL]: `WORLD LANGUAGES — ${WL_ACCURACY}
Frame every activity in ENGLISH; any target-language content is short vocab/phrases with English glosses only — never a translation or extended-production task.`,
  },
}

/** Returns the directive for a tool+subject, or '' if there is none. */
export function toolDirective(tool, subject) {
  const d = DIRECTIVES[tool]
  return (d && subject && d[subject]) ? `\n\n${d[subject]}` : ""
}
