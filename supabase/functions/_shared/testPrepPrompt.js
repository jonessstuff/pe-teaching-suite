/**
 * Test Prep prompt builder.
 *
 * Two paths:
 *   - sat_act: nationally standardized SAT / ACT prep (no state variance).
 *   - state:   input-driven state-assessment prep (teacher supplies the state
 *              test name, grade, subject; the tool does NOT pre-load official
 *              blueprints and says so on every output).
 *
 * COPYRIGHT — HARD CONSTRAINT: real SAT questions (College Board) and ACT
 * questions (ACT Inc.) are copyrighted and must NEVER be reproduced. Every
 * practice item is ORIGINAL content that mirrors the same skills, format, and
 * difficulty as the real test. Standard, legitimate practice — original only.
 *
 * Framed as a tutoring-style session (1:1 or small group), since test prep is
 * frequently done privately or in small groups.
 */

// Current-as-of-2026 format references. Formats change — the prompt tells the
// model to say "re-verify against current College Board / ACT.org guidance."
const SAT_FORMAT = `Digital SAT (current format, 2026):
- Two sections: Reading & Writing, and Math.
- MODULE-ADAPTIVE: each section has 2 modules (4 modules total); the second module's difficulty adapts to first-module performance.
- ~98 questions total; about 2 hours 14 minutes.
- Scored 400–1600 (two 200–800 section scores).
- Taken in the College Board "Bluebook" app; a Desmos graphing calculator is built in and allowed throughout Math.`

const ACT_FORMAT = `Enhanced ACT (2025 redesign, current for 2026):
- Core sections: English, Math, Reading (about 2 hours total for the core).
- Science is now OPTIONAL and is EXCLUDED from the composite score (composite = average of the core sections).
- Available in both digital and paper formats.
- NOT adaptive — fixed, linear forms (every student sees the same questions in order).`

const REVERIFY = `IMPORTANT: testing formats change. Include a brief reminder (in format_snapshot or overview) to re-verify the current format against official College Board (SAT) and ACT.org guidance.`

const ORIGINALITY = `COPYRIGHT — ABSOLUTE RULE: Do NOT reproduce, paraphrase, or approximate any actual/real SAT or ACT test question, passage, or answer choice (these are owned by College Board and ACT Inc.). EVERY practice_questions item must be 100% ORIGINAL content you write from scratch, engineered to mirror the same SKILL, ITEM FORMAT, and DIFFICULTY as the real test — legitimate practice, never a real item. Set originality_note to a clear statement that all questions are original practice content modeled on the test's skills and format, not reproduced official items.`

const STATE_DISCLAIMER = `MANDATORY DISCLAIMER — this path does NOT have memorized official state test blueprints or released items. Generate ORIGINAL practice content and review using strong general test-prep pedagogy and item-format familiarity, responsive to what the teacher described. You MUST set state_verification_note to a clear disclaimer that this tool does not have the official state blueprint memorized, and that the teacher must verify all content against their state's official released test blueprint / sample items before use, because state tests have their own specific formatting and content requirements that can change year to year. Never claim alignment to, or knowledge of, the actual official test's specific content.`

// State path still forbids reproducing any real released items and keeps content original.
const ORIGINALITY_STATE = `ORIGINALITY: Do NOT reproduce or approximate any actual released state-test item. Every practice item must be 100% ORIGINAL content modeled on general item formats for this grade/subject.`

const QUALITY = `QUALITY BAR: concrete and specific — never generic filler. Real skills, real worked reasoning, real numbers/text in the practice items. Every question must have a correct, defensible answer and a clear explanation of WHY it's right (and, where useful, why tempting wrong choices are wrong).
- MATHEMATICAL CORRECTNESS IS NON-NEGOTIABLE, especially on hard items. For any quantitative item, DESIGN IT BACKWARD: pick the clean final answer first (a tidy integer or simple fraction), then construct the equation/scenario so it produces exactly that answer. Then solve it yourself start-to-finish to confirm. Only after it checks out do you write it.
- Favor difficulties you can verify with CERTAINTY: mostly easy/medium, with at most ONE hard item, and only when it has a clean, directly-computable answer. If you are not 100% certain an item is correct, DISCARD it and write a simpler one you can fully verify. A correct medium item beats a shaky hard item every time.
- For multiple-choice items, the correct answer MUST appear VERBATIM as exactly one of the options, and the "answer" field must match that option's text. Distractors are plausible-but-wrong. If your solving produces a value that isn't among your options, or isn't clean, REWRITE the item before finalizing — never ship a mismatch.
- The "answer" field MUST equal the final answer your explanation derives — they can NEVER disagree.
- AVOID fragile "reverse-engineer a coefficient" items — especially "find the value of k that makes this system/equation have NO solution or INFINITELY many solutions." These are error-prone to construct and you keep getting them wrong. Cover the no-solution / infinite-solution CONCEPT in content_review instead, or test it with a DIRECT, verifiable item using FIXED numbers (e.g., "How many solutions does this system have?" with a specific system you can fully check). Prefer items with a single definite answer you can compute directly.
- Write each item CLEANLY and FINALLY. The explanation is the polished final solution ONLY. NEVER include hesitation or self-correction text of any kind — no "wait", "recheck", "let's verify", "re-examine", "let's restate", "this signals", "item needs a clean rebuild", "CLEAN FINAL VERSION", trailing ellipses, or any sign the item was fixed in place. If an item doesn't come out clean, DISCARD it and write a different one from scratch — only finished, verified items appear in the output.
- The "options" array holds ONLY the choice text — NO letter/number label prefix (no "A)", "A.", "1)"). The app adds the A/B/C/D labels.`

const SESSION_FORMATS = {
  one_on_one: "one-on-one tutoring session — tightly focused, responsive, lots of think-aloud and immediate feedback",
  small_group: "small-group session (about 3–5 students) — shared instruction with individual practice and discussion",
}

const EMPHASES = {
  practice_set: { label: "Original practice set", guide: "center the session on a set of original practice questions by skill area, with brief targeted review and strategy tie-ins." },
  strategies: { label: "Test-taking strategies & pacing", guide: "center on test-taking strategy and pacing; include a few original practice items to apply the strategies." },
  content_review: { label: "Content review mini-lesson", guide: "center on a targeted content-review mini-lesson for the focus skill; include original practice items to check it." },
  logistics: { label: "Test-day logistics & anxiety", guide: "center on test-day logistics and anxiety reduction; keep practice light (1–2 quick confidence-builder items)." },
}

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "Test Prep",
  "path": string,
  "assessment_label": string,
  "title": string,
  "focus": string,
  "emphasis": string,
  "session_format": string,
  "session_length_minutes": number,
  "format_snapshot": string[],
  "overview": string,
  "content_review": [ { "concept": string, "mini_lesson": string } ],
  "strategies": [ { "strategy": string, "how_to_use_it": string } ],
  "practice_questions": [ { "skill": string, "difficulty": string, "question": string, "options": string[], "answer": string, "explanation": string } ],
  "test_day_logistics": string[],
  "session_flow": string,
  "next_steps": string,
  "originality_note": string,
  "state_verification_note": string
}`
}

function fieldNotes(emphasisGuide, sessionLength) {
  return `Field notes:
- subject: always exactly "Test Prep".
- assessment_label: a concise label for what this preps (e.g., "Digital SAT — Math" or "Virginia SOL Grade 5 Reading").
- focus: the specific skill/topic this session targets.
- emphasis: ${emphasisGuide}
- session_format / session_length_minutes: echo the chosen tutoring format and ${sessionLength} minutes; pace the session for that format.
- format_snapshot: 3–6 short bullets of the CURRENT test format that actually matter for this session (structure, timing, adaptivity/linearity, tools, scoring). ${REVERIFY}
- overview: 2–3 sentences framing the session and how it's tuned to this test/skill and format.
- content_review: 1–3 targeted concept explanations (concept + a concrete mini_lesson the tutor can teach) for the focus skill.
- strategies: 2–4 concrete, test-appropriate strategies (strategy + how_to_use_it). For SAT reflect module-adaptive pacing; for ACT reflect fixed-linear pacing and time-per-question.
- practice_questions: original items (typically 4–5; fewer if emphasis is logistics). Each: skill, difficulty (easy/medium/hard), question (the full original stem/prompt), options (array — 4 choices for multiple choice with NO letter prefixes, or [] for grid-in/free-response), answer, and explanation (CONCISE — 2–4 sentences: why it's right; note a trap where useful). Vary difficulty.
- test_day_logistics: practical day-of logistics AND anxiety-reduction tips (what to bring, timing, sleep, managing nerves, pacing mindset).
- session_flow: a BRIEF how-to-run for the chosen format and time — a few phases with time ranges (opening, teach/practice, review, close). Keep it tight, not a transcript.
- next_steps: concrete follow-up practice before the next session.
${QUALITY}`
}

// Structured-outputs JSON Schema — forces the model to emit valid, schema-conforming
// JSON. This matters especially for the Math state path, where free-text explanations
// contain notation (fractions, symbols, backslashes) that otherwise broke the tolerant
// text parser. Rules: every object needs additionalProperties:false and lists all
// properties in required.
export function buildTestPrepSchema() {
  const strArr = { type: "array", items: { type: "string" } }
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "subject", "path", "assessment_label", "title", "focus", "emphasis",
      "session_format", "session_length_minutes", "format_snapshot", "overview",
      "content_review", "strategies", "practice_questions", "test_day_logistics",
      "session_flow", "next_steps", "originality_note", "state_verification_note",
    ],
    properties: {
      subject: { const: "Test Prep" },
      path: { type: "string", enum: ["sat_act", "state"] },
      assessment_label: { type: "string" },
      title: { type: "string" },
      focus: { type: "string" },
      emphasis: { type: "string" },
      session_format: { type: "string" },
      session_length_minutes: { type: "number" },
      format_snapshot: strArr,
      overview: { type: "string" },
      content_review: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["concept", "mini_lesson"],
          properties: { concept: { type: "string" }, mini_lesson: { type: "string" } },
        },
      },
      strategies: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["strategy", "how_to_use_it"],
          properties: { strategy: { type: "string" }, how_to_use_it: { type: "string" } },
        },
      },
      practice_questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["skill", "difficulty", "question", "options", "answer", "explanation"],
          properties: {
            skill: { type: "string" },
            difficulty: { type: "string" },
            question: { type: "string" },
            options: strArr,
            answer: { type: "string" },
            explanation: { type: "string" },
          },
        },
      },
      test_day_logistics: strArr,
      session_flow: { type: "string" },
      next_steps: { type: "string" },
      originality_note: { type: "string" },
      state_verification_note: { type: "string" },
    },
  }
}

export function buildTestPrepPrompt(input) {
  return input?.path === "state" ? buildStatePrompt(input) : buildSatActPrompt(input)
}

// ─── Path 1: SAT / ACT (nationally standardized) ──────────────────────────────
function buildSatActPrompt({ test = "sat", section = "", emphasis = "practice_set", focus = "", sessionFormat = "one_on_one", sessionLengthMinutes = 45, teacherNotes = "" }) {
  const isSat = test !== "act"
  const testName = isSat ? "Digital SAT" : "Enhanced ACT"
  const formatRef = isSat ? SAT_FORMAT : ACT_FORMAT
  const fmt = SESSION_FORMATS[sessionFormat] ?? SESSION_FORMATS.one_on_one
  const emph = EMPHASES[emphasis] ?? EMPHASES.practice_set
  const sectionLine = section ? `${testName} — ${section}` : testName

  const system = `You are an expert ${testName} tutor building a ${fmt}. You know the current test cold and you write outstanding ORIGINAL practice.

${ORIGINALITY}

CURRENT FORMAT REFERENCE (summarize the parts that matter into format_snapshot; adapt to the chosen section):
${formatRef}
${REVERIFY}

Session emphasis — ${emph.label}: ${emph.guide}
Section / focus area: ${sectionLine}${focus ? ` — ${focus}` : ""}
Session format: ${fmt}.

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${fieldNotes(emph.guide, sessionLengthMinutes)}
- path: "sat_act". assessment_label: "${sectionLine}".
- originality_note: REQUIRED — state that all practice questions are original, modeled on ${testName} skills/format/difficulty, and are not reproduced official items.
- state_verification_note: "" (empty for this path).

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Build a ${testName} prep session:

- Test / section: ${sectionLine}
- Focus skill: ${focus || "(choose a high-value skill for this section and write original practice for it)"}
- Emphasis: ${emph.label}
- Format: ${fmt}
- Length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- Tutor notes: ${teacherNotes}` : ""}

All practice questions must be 100% ORIGINAL (never real SAT/ACT items). Return the JSON object now.`

  return { system, user }
}

// ─── Path 2: State Assessments (input-driven, NOT pre-built) ───────────────────
function buildStatePrompt({ stateTest = "", gradeLevel = "", subjectArea = "", emphasis = "practice_set", focus = "", sessionFormat = "one_on_one", sessionLengthMinutes = 45, teacherNotes = "" }) {
  const fmt = SESSION_FORMATS[sessionFormat] ?? SESSION_FORMATS.one_on_one
  const emph = EMPHASES[emphasis] ?? EMPHASES.practice_set
  const labelBits = [stateTest, gradeLevel, subjectArea].filter(Boolean).join(" ")
  const label = labelBits || "State assessment prep"

  const system = `You are an expert test-prep tutor building a ${fmt} for a state standardized assessment.

${STATE_DISCLAIMER}

${ORIGINALITY_STATE}

Session emphasis — ${emph.label}: ${emph.guide}
Assessment described by the teacher: ${label}${focus ? ` — focus: ${focus}` : ""}
Session format: ${fmt}.

Use strong general test-prep pedagogy and item-format familiarity for this grade/subject (e.g., typical multiple-choice, evidence-based, technology-enhanced, and constructed-response item types common on state tests), and be responsive to what the teacher described — but do NOT claim to know the official blueprint.

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${fieldNotes(emph.guide, sessionLengthMinutes)}
- path: "state". assessment_label: "${label}".
- format_snapshot: describe GENERAL item-format familiarity for this kind of state test/grade/subject (common item types, tools, pacing) — NOT specific official blueprint claims.
- state_verification_note: REQUIRED — the mandatory disclaimer (no memorized official blueprint; verify against the state's official released blueprint/sample items before use; state tests have specific formatting/content requirements that change year to year).
- originality_note: briefly note the practice content is original and modeled on general item formats, not reproduced official items.

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Build a state-assessment prep session:

- State test / grade / subject: ${label}
- Focus skill: ${focus || "(choose a high-value skill for this grade/subject and write original practice for it)"}
- Emphasis: ${emph.label}
- Format: ${fmt}
- Length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

All practice content must be ORIGINAL, and you MUST include the state-verification disclaimer. Return the JSON object now.`

  return { system, user }
}
