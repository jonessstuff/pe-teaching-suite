/**
 * Dance lesson prompt builder.
 *
 * Standards-based dance lessons grounded in the National Core Arts Standards
 * (NCAS, Dance discipline), structured around the FOUR ARTISTIC PROCESSES:
 * Creating, Performing/Presenting/Producing, Responding, Connecting. Grade bands
 * K-2 / 3-5 / 6-8 / 9-12, with the HS band calibrated to a Proficient /
 * Accomplished / Advanced tier. Professional body: NDEO (National Dance
 * Education Organization).
 *
 * Every lesson includes body-safety / injury-prevention awareness appropriate to
 * dance (warm-up, alignment/technique, hydration, safe use of space).
 */

const BANDS = {
  "k-2": { label: "K–2", grades: [0, 1, 2], context: "early elementary — creative movement and exploration; short, playful, imagery-rich activities with lots of modeling; locomotor/non-locomotor basics and the elements of dance through games and pretend." },
  "3-5": { label: "3–5", grades: [3, 4, 5], context: "upper elementary — developing movement vocabulary, short choreographic studies, ensemble/spatial awareness, and beginning technique; growing independence and self-control." },
  "6-8": { label: "6–8", grades: [6, 7, 8], context: "middle school — technique and phrasing, devising and refining choreography, dance styles/genres, and analysis vocabulary; AGE-RESPECTFUL, real dance conventions, never childish." },
  "9-12": { label: "9–12", grades: [9, 10, 11, 12], context: "high school — refined technique and artistry, sustained choreographic work, critique, and dance in cultural/historical context; calibrate rigor to the chosen HS tier." },
}

const HS_TIERS = {
  proficient: "Proficient (entry HS level — foundational technique and vocabulary)",
  accomplished: "Accomplished (developing independence, nuance, and craft)",
  advanced: "Advanced (sophisticated, self-directed, pre-professional depth)",
}

const PROCESSES = {
  creating: { label: "Creating", anchors: "DA:Cr1–Cr3 (Generate/Conceptualize, Organize/Develop, Refine/Complete)", guide: "the choreographic process — generating and developing movement ideas, exploring and manipulating the ELEMENTS OF DANCE (Body, Space, Time, Energy), improvisation, and shaping/refining movement into a study or phrase." },
  performing: { label: "Performing, Presenting & Producing", anchors: "DA:Pr4–Pr6 (Express/Embody, Prepare, Present)", guide: "dance technique and performance skills — expressing through the body, the rehearsal process, spatial / relationship / dynamic execution, musicality, and presenting a dance to an audience (age-appropriate)." },
  responding: { label: "Responding", anchors: "DA:Re7–Re9 (Perceive/Analyze, Interpret, Evaluate)", guide: "observing, analyzing, and critiquing dance works — using DANCE VOCABULARY and the elements of dance to describe and interpret what is observed, and evaluating with criteria and constructive feedback." },
  connecting: { label: "Connecting", anchors: "DA:Cn10–Cn11 (Synthesize/Relate, Contextualize)", guide: "relating dance to personal experience, meaning, and other knowledge, and exploring dance's role across history and diverse cultures and genres/styles — with cultural respect and context, never appropriation or stereotype." },
}

const SAFETY = `BODY SAFETY / INJURY PREVENTION — include in every lesson (populate safety_note): always warm up before vigorous movement and cool down after; use correct alignment and safe technique (no forcing turnout, splits, or extreme flexibility; protect knees/back/ankles); listen to the body and never dance through sharp pain; hydrate; and keep the space safe — clear spacing so dancers do not collide, appropriate footwear/bare-feet and a suitable non-slip surface. Keep it age-appropriate and matter-of-fact, not fear-based.`

const STANDARDS = `Ground the lesson in the National Core Arts Standards (NCAS), Dance discipline. Structure the content around the FOUR ARTISTIC PROCESSES (Creating; Performing, Presenting & Producing; Responding; Connecting) with THIS lesson centered on the chosen process while naturally touching others. Cite specific Dance anchor/performance standards with real code stems (e.g., DA:Cr1.1, DA:Pr5.1, DA:Re7.1, DA:Cn10.1) appropriate to the grade band; for HS, calibrate to the chosen tier (Proficient / Accomplished / Advanced). The field's professional body is the National Dance Education Organization (NDEO). Framework field: "NCAS Dance".`

const STATE_DISCLAIMER = `Arts standards adoption varies by state (many use NCAS or a state adaptation). Do NOT claim compliance with any specific state. Populate state_verification_note with a brief reminder to verify the teacher's own state's dance/arts standards.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "Dance",
  "title": string,
  "artistic_process": string,
  "band_label": string,
  "grade_bands": number[],
  "hs_tier": string,
  "focus": string,
  "duration_minutes": number,
  "enduring_understanding": string,
  "essential_question": string,
  "learning_objectives": string[],
  "warm_up": string,
  "main_activities": [ { "name": string, "how_to_run": string, "why_it_works": string } ],
  "process_focus_note": string,
  "differentiation": string,
  "materials": string[],
  "assessment": string,
  "vocabulary": [ { "term": string, "meaning": string } ],
  "safety_note": string,
  "standards_alignment": [ { "framework": string, "code": string, "text": string } ],
  "state_verification_note": string
}`
}

function fieldNotes(dur) {
  return `Field notes:
- subject: always exactly "Dance".
- artistic_process: the chosen process label. grade_bands: JSON array of grade numbers (K = 0) for the band. hs_tier: the HS tier label, or "" for non-HS bands.
- duration_minutes: ${dur}.
- enduring_understanding + essential_question: an NCAS-style big idea and a driving question for the lesson.
- learning_objectives: 2–4 student "I can…" Can-Do statements aligned to the process and band.
- warm_up: a concrete dance/movement warm-up that safely prepares the body and primes the day's work.
- main_activities: 2–3 activities, each name / how_to_run (step by step, what the teacher and students actually do, using the elements of dance) / why_it_works (the dance-learning rationale).
- process_focus_note: one short paragraph naming how the lesson develops the chosen Artistic Process (and which anchor standards).
- differentiation: how to scaffold and extend for varied readiness, confidence, mobility, and physical access (seated/adapted movement options where relevant).
- materials: simple, realistic materials (open space, music/props, scarves) — nothing requiring a real studio unless age-appropriate; note music or a way to keep a beat.
- assessment: performance-based and/or reflective evidence (rubric focus, self/peer reflection) — not a paper test.
- vocabulary: 4–8 age-appropriate dance terms (often the elements of dance: body, space, time, energy; locomotor/non-locomotor; levels, pathways, tempo, force) with plain-language meanings.
- safety_note: ${SAFETY}
- standards_alignment: 2–4 entries; framework exactly "NCAS Dance"; code = a real DA: stem (e.g., "DA:Cr1.1"); text = what students do toward it.
- ${STATE_DISCLAIMER}

AGE & DIGNITY: match tone and material to the AGE — playful and imaginative for K-2; age-respectful, real dance conventions for middle/high school (never childish for teens).`
}

export function buildDancePrompt({ gradeBand = "3-5", artisticProcess = "creating", hsTier = "proficient", focus = "", durationMinutes = 45, teacherNotes = "" }) {
  const band = BANDS[gradeBand] ?? BANDS["3-5"]
  const process = PROCESSES[artisticProcess] ?? PROCESSES.creating
  const isHs = gradeBand === "9-12"
  const tierLine = isHs ? `HS tier — ${HS_TIERS[hsTier] ?? HS_TIERS.proficient}` : ""

  const system = `You are an experienced K-12 dance educator writing a standards-based lesson another dance teacher (or a generalist covering dance/creative movement) can run. Your lessons are active, safe, and grounded in the National Core Arts Standards.

${STANDARDS}

Artistic Process for THIS lesson — ${process.label} (${process.anchors}): ${process.guide}
Grade band — ${band.label}: ${band.context}
${tierLine}

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${fieldNotes(durationMinutes)}
- band_label: "${band.label}". artistic_process: "${process.label}". hs_tier: "${isHs ? (HS_TIERS[hsTier] ?? HS_TIERS.proficient) : ""}".

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate an NCAS Dance lesson:

- Artistic Process: ${process.label}
- Grade band: ${band.label} — ${band.context}${isHs ? `\n- HS tier: ${HS_TIERS[hsTier] ?? HS_TIERS.proficient}` : ""}
- Focus / topic: ${focus || "(choose an age-appropriate focus for this process and band)"}
- Duration: ${durationMinutes} minutes${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Include an age-appropriate body-safety / injury-prevention note. Return the JSON object now.`

  return { system, user }
}
