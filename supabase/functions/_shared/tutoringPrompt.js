/**
 * Tutoring session prompt builder — SHARED by Reading Specialists and Math
 * Specialists (the two modules where private/paid tutoring demand concentrates).
 *
 * One engine, two axes:
 *   subject:      'reading' | 'math'   (injects the module's standards + approach)
 *   tutoringType: 'private' | 'in_class'
 *
 * Tutoring differs from the whole-class lesson: shorter, 1:1 / small-group pacing.
 *   - private  → professional, parent-paying context. Includes a parent-facing
 *                summary (covered / practice before next) and a light "Session N"
 *                continuity frame. Not a full multi-session tracker.
 *   - in_class → same-day pull-aside during independent work. Fast, grab-and-go,
 *                zero prep. Reinforces/re-teaches what the WHOLE CLASS just
 *                covered (not a separate curriculum). No parent-facing content.
 *
 * Reuses each module's standards stack (IDA / Structured Literacy for reading,
 * NCTM for math) — only the output format/length/tone change.
 */

const GRADE_BANDS = {
  "k-2": "K–2 (early skills; concrete, playful-but-purposeful)",
  "3-5": "3–5 (developing skills; more independence)",
  "6-8": "6–8 (middle grades; age-respectful contexts, never childish even when skills are foundational)",
  "9-12": "9–12 (teens/young adults; age-respectful, adult-relevant materials — for reading, older struggling readers; for math, algebra/functions and beyond)",
}

const SUBJECTS = {
  reading: {
    value: "Reading Specialists",
    label: "reading",
    role: "Reading Specialist / certified Structured Literacy tutor",
    standards:
      "Anchor to the IDA Knowledge and Practice Standards for Teachers of Reading and the Structured Literacy approach: explicit, systematic, cumulative, diagnostic instruction across phonological/phonemic awareness, phonics & word recognition, fluency, vocabulary, and comprehension.",
    approach:
      "Teach the way a structured-literacy tutor does: explicit modeling (I do), guided practice (we do), then independent application (you do); use decodable text where relevant; give immediate, specific corrective feedback.",
    framework: "IDA KPS",
    focus_hint:
      "a specific reading skill (e.g., blending CVC words, r-controlled vowels, prefixes, fluency phrasing, finding the main idea)",
  },
  math: {
    value: "Math Specialists",
    label: "math",
    role: "Math Specialist / interventionist and tutor",
    standards:
      "Anchor to NCTM (Principles to Actions + Principles and Standards): build procedural fluency FROM conceptual understanding, and press for reasoning and representation — not just answers.",
    approach:
      "Use Concrete–Representational–Abstract (CRA) sequencing and a brief Number Talk / mental-math warm-up where it fits; name specific manipulatives and representations.",
    framework: "NCTM",
    focus_hint:
      "a specific math skill/topic (e.g., comparing fractions, multi-digit multiplication, integer operations, solving one-step equations)",
  },
}

function resolveSubject(subject) {
  return SUBJECTS[subject] ?? SUBJECTS.reading
}

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

export function buildTutoringPrompt(input) {
  return input?.tutoringType === "in_class"
    ? buildInClassPrompt(input)
    : buildPrivatePrompt(input)
}

// ─── Private / after-school tutoring ─────────────────────────────────────────
function buildPrivatePrompt({
  subject = "reading",
  gradeBand = "3-5",
  focus = "",
  topicArea = "",
  sessionLabel = "Session 1",
  groupSize = "1:1",
  durationMinutes = 30,
  notes = "",
}) {
  const s = resolveSubject(subject)
  const band = GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]

  const system = `You are an experienced ${s.role} planning a PRIVATE / after-school tutoring session (paid, 1:1 or small group, outside the school day). A parent is paying for this service, so the plan is professional and the session is tightly focused. This is a SHORT session (${durationMinutes} minutes), not a whole-class lesson — pace it for 1:1 / small-group work.

${s.standards}

${s.approach}

${JSON_ONLY} Match this schema exactly:

{
  "mode": "tutoring",
  "tutoring_type": "private",
  "subject": "${s.value}",
  "title": string,
  "session_label": string,
  "grade_bands": number[],
  "focus": string,
  "topic_area": string,
  "duration_minutes": number,
  "group_size_label": string,
  "session_objective": string,
  "warm_up": string,
  "teaching_focus": string,
  "guided_practice": string,
  "independent_application": string,
  "wrap_up": string,
  "materials": string[],
  "parent_summary": { "covered_today": string, "practice_before_next": string, "note_to_family": string },
  "next_session_preview": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "instructional_note": string
}

Field notes:
- subject: always exactly "${s.value}". tutoring_type: always exactly "private".
- session_label: use "${sessionLabel}" (light continuity framing for a recurring weekly arrangement).
- grade_bands: JSON array of grade numbers for this band (K = 0).
- focus / topic_area: echo the specific target and its broader area.
- duration_minutes: ${durationMinutes}. group_size_label: "${groupSize}".
- session_objective: one clear, tutor-sized objective for THIS session.
- warm_up / teaching_focus / guided_practice / independent_application / wrap_up: the session arc, paced for 1:1/small group and this duration. teaching_focus is the explicit core teaching. Keep each to a few concrete sentences.
- materials: specific, minimal, tutor-bag friendly.
- parent_summary: PARENT-FACING and professional — written so the tutor can hand or email it to a paying parent. NO jargon. covered_today = plain-language recap; practice_before_next = 1–3 concrete things to practice before next session; note_to_family = one warm, professional sentence. This block must read cleanly on its own.
- next_session_preview: one sentence on what the next session will build toward.
- standards_alignment: 1–3 entries; framework field exactly "${s.framework}"; text = the practice this session reflects. If uncertain of a specific code, describe it and append "(verify against your standards)".
- instructional_note: one brief professional line — these are instructional plans a tutor adapts to the student.

Keep it professional and parent-ready. LENGTH DISCIPLINE: complete JSON over exhaustive detail; a response cut off before the closing brace is a FAILED response.`

  const user = `Plan a private/after-school tutoring session:

- Subject: ${s.label}
- Focus / target skill: ${focus || `(choose ${s.focus_hint})`}
- Broader area: ${topicArea || "(infer from the focus)"}
- Grade band: ${band}
- Session: ${sessionLabel}, ${durationMinutes} minutes, ${groupSize}${notes ? `\n- Tutor notes: ${notes}` : ""}

Do not use student names. Return the JSON object now.`

  return { system, user }
}

// ─── In-class intervention / pull-aside ──────────────────────────────────────
function buildInClassPrompt({
  subject = "reading",
  gradeBand = "3-5",
  focus = "",
  topicArea = "",
  classContext = "",
  groupSize = "1:1",
  durationMinutes = 15,
  notes = "",
}) {
  const s = resolveSubject(subject)
  const band = GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]

  const system = `You are an experienced ${s.role} pulling one student or a small group aside DURING independent work time, the SAME school day, to reinforce/re-teach what the whole class just covered. You have ZERO prep window — this must be grab-and-go and fast. This is a very short pull-aside (${durationMinutes} minutes).

CRITICAL: This reinforces the SAME content the whole class just covered — it is a re-teach, not a separate curriculum or a different skill path. Tie everything directly to what the class did.

${s.standards}

${s.approach}

${JSON_ONLY} Match this schema exactly:

{
  "mode": "tutoring",
  "tutoring_type": "in_class",
  "subject": "${s.value}",
  "title": string,
  "grade_bands": number[],
  "focus": string,
  "topic_area": string,
  "duration_minutes": number,
  "group_size_label": string,
  "class_just_covered": string,
  "quick_reteach": string,
  "steps": [ { "step": string, "what_you_do": string } ],
  "checks_for_understanding": string[],
  "common_error_and_fix": string,
  "materials": string[],
  "if_they_get_it": string,
  "if_still_stuck": string,
  "standards_alignment": [ { "framework": string, "text": string } ]
}

Field notes:
- subject: always exactly "${s.value}". tutoring_type: always exactly "in_class".
- grade_bands: JSON array of grade numbers (K = 0). duration_minutes: ${durationMinutes}. group_size_label: "${groupSize}".
- class_just_covered: restate the whole-class content this pull-aside reinforces (use the teacher's context if given).
- quick_reteach: the single fastest, clearest re-teach move for this content — the heart of the pull-aside.
- steps: 3 SHORT steps (a compact I do → we do → you do), each with a concrete "what_you_do" the teacher can run with no prep.
- checks_for_understanding: 2–3 quick in-the-moment checks.
- common_error_and_fix: the most likely error on THIS content and the immediate fix.
- materials: whatever is already on hand — minimal, grab-and-go (whiteboard, the class handout, manipulatives already out). No prep.
- if_they_get_it / if_still_stuck: one quick next move each.
- standards_alignment: 1–2 entries; framework field exactly "${s.framework}".
- NO parent-facing content — this stays in the classroom.

Keep it quick-reference and minimal-setup. LENGTH DISCIPLINE: complete JSON over detail; a truncated response is a FAILED response.`

  const user = `Plan an in-class pull-aside intervention (same day, during independent work):

- Subject: ${s.label}
- Skill/content to reinforce: ${focus || `(choose ${s.focus_hint})`}
- Broader area: ${topicArea || "(infer from the focus)"}
- What the whole class just covered: ${classContext || "(assume the class just did a lesson on the focus above; reinforce exactly that)"}
- Grade band: ${band}
- ${durationMinutes} minutes, ${groupSize}${notes ? `\n- Teacher notes: ${notes}` : ""}

Keep it fast and grab-and-go. Do not use student names. Return the JSON object now.`

  return { system, user }
}
