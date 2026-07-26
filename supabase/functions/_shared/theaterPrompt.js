/**
 * Theater / Drama lesson prompt builder.
 *
 * Standards-based theatre lessons grounded in the National Core Arts Standards
 * (NCAS, Theatre discipline), structured around the FOUR ARTISTIC PROCESSES:
 * Creating, Performing/Presenting/Producing, Responding, Connecting. Grade bands
 * K-2 / 3-5 / 6-8 / 9-12, with the HS band calibrated to a Proficient /
 * Accomplished / Advanced tier. Professional bodies: EdTA and AATE.
 *
 * COPYRIGHT: never reproduces copyrighted play scripts/scenes. Original
 * scene-starters, improvisation exercises, and analysis frameworks only;
 * existing works are unnamed or public-domain.
 */

const BANDS = {
  "k-2": { label: "K–2", grades: [0, 1, 2], context: "early elementary — dramatic play, imagination, simple story drama, and cooperative theater games; short, playful, movement-rich, and concrete with lots of modeling." },
  "3-5": { label: "3–5", grades: [3, 4, 5], context: "upper elementary — structured creative drama, character and voice basics, short scenes and improvisation, and ensemble/cooperation skills; growing independence." },
  "6-8": { label: "6–8", grades: [6, 7, 8], context: "middle school — devising, scene work, vocal and physical technique, basic production/design roles, and analysis vocabulary; AGE-RESPECTFUL, real theater conventions, never childish." },
  "9-12": { label: "9–12", grades: [9, 10, 11, 12], context: "high school — advanced ensemble and production work, script analysis, refined performance technique, and reflective critique; calibrate rigor to the chosen HS tier." },
}

const HS_TIERS = {
  proficient: "Proficient (entry HS level — foundational technique and vocabulary)",
  accomplished: "Accomplished (developing independence, nuance, and craft)",
  advanced: "Advanced (sophisticated, self-directed, pre-professional depth)",
}

const PROCESSES = {
  creating: { label: "Creating", anchors: "TH:Cr1–Cr3 (Envision/Conceptualize, Develop, Refine/Complete)", guide: "devising and generating original theatrical ideas — improvisation, character development, dramatic play and imagination, and script-writing basics. All scene/script material is ORIGINAL (original scene-starters), never copyrighted scripts." },
  performing: { label: "Performing, Presenting & Producing", anchors: "TH:Pr4–Pr6 (Select/Analyze, Prepare, Share/Present)", guide: "rehearsing and presenting theatrical work — staging, blocking, vocal and physical performance technique, ensemble, and age-appropriate production/design basics (set, props, costumes, lights, sound at a level fitting the band)." },
  responding: { label: "Responding", anchors: "TH:Re7–Re9 (Perceive/Reflect, Interpret, Evaluate)", guide: "analyzing and critiquing theatrical work — audience skills, interpreting meaning and artistic choices, and giving constructive peer feedback using theater vocabulary. Discuss existing works only in the abstract, or use UNNAMED / PUBLIC-DOMAIN works — never reproduce copyrighted scripts." },
  connecting: { label: "Connecting", anchors: "TH:Cn10–Cn11 (Empathize/Interrelate, Research/Relate)", guide: "relating theater to personal experience, history, and culture — empathy and perspective-taking, social and historical context, and cross-disciplinary and cultural connections." },
}

const COPYRIGHT = `COPYRIGHT — HARD RULE: do NOT generate or reproduce actual copyrighted play scripts, scenes, monologues, or substantial dialogue from published or produced plays. Provide ORIGINAL scene-starter prompts, improvisation exercises, character/devising frameworks, and analysis structures instead. When referencing existing plays, keep them UNNAMED (describe the type/genre) or use PUBLIC-DOMAIN works (e.g., Shakespeare, Greek tragedy, folk/fairy tales) — and never reproduce more than a brief public-domain excerpt. Populate copyright_note with a reminder that all scene/script material here is original or public-domain, and the teacher must properly license any copyrighted script before use.`

const STANDARDS = `Ground the lesson in the National Core Arts Standards (NCAS), Theatre discipline. Structure the content around the FOUR ARTISTIC PROCESSES (Creating; Performing, Presenting & Producing; Responding; Connecting) with THIS lesson centered on the chosen process while naturally touching others. Cite specific Theatre anchor/performance standards with real code stems (e.g., TH:Cr1.1, TH:Pr4.1, TH:Re7.1, TH:Cn10.1) appropriate to the grade band; for HS, calibrate to the chosen tier (Proficient / Accomplished / Advanced). The field's professional bodies are the Educational Theatre Association (EdTA) and the American Alliance for Theatre and Education (AATE). Framework field: "NCAS Theatre".`

const STATE_DISCLAIMER = `Arts standards adoption varies by state (many use NCAS or a state adaptation). Do NOT claim compliance with any specific state. Populate state_verification_note with a brief reminder to verify the teacher's own state's theatre/arts standards.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "Theater",
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
  "standards_alignment": [ { "framework": string, "code": string, "text": string } ],
  "copyright_note": string,
  "state_verification_note": string
}`
}

function fieldNotes(dur) {
  return `Field notes:
- subject: always exactly "Theater".
- artistic_process: the chosen process label. grade_bands: JSON array of grade numbers (K = 0) for the band. hs_tier: the HS tier label, or "" for non-HS bands.
- duration_minutes: ${dur}.
- enduring_understanding + essential_question: an NCAS-style big idea and a driving question for the lesson.
- learning_objectives: 2–4 student "I can…" Can-Do statements aligned to the process and band.
- warm_up: a concrete theater warm-up / drama game that primes the day's work.
- main_activities: 2–3 activities, each name / how_to_run (step by step, what the teacher and students actually do) / why_it_works (the theatrical-skill rationale). ORIGINAL scene-starters and exercises only.
- process_focus_note: one short paragraph naming how the lesson develops the chosen Artistic Process (and which anchor standards).
- differentiation: how to scaffold and extend for varied readiness, confidence, and needs (stage fright, language, physical access).
- materials: simple, realistic materials (open space, props from a classroom, chart paper) — nothing requiring a real stage unless age-appropriate.
- assessment: performance-based and/or reflective evidence (rubric focus, self/peer reflection) — not a paper test.
- vocabulary: 4–8 age-appropriate theater terms with plain-language meanings.
- standards_alignment: 2–4 entries; framework exactly "NCAS Theatre"; code = a real TH: stem (e.g., "TH:Cr1.1"); text = what students do toward it.
- ${STATE_DISCLAIMER}

AGE & DIGNITY: match tone and material to the AGE — playful and imaginative for K-2; age-respectful, real theater conventions for middle/high school (never childish for teens).`
}

export function buildTheaterPrompt({ gradeBand = "3-5", artisticProcess = "creating", hsTier = "proficient", focus = "", durationMinutes = 45, teacherNotes = "" }) {
  const band = BANDS[gradeBand] ?? BANDS["3-5"]
  const process = PROCESSES[artisticProcess] ?? PROCESSES.creating
  const isHs = gradeBand === "9-12"
  const tierLine = isHs ? `HS tier — ${HS_TIERS[hsTier] ?? HS_TIERS.proficient}` : ""

  const system = `You are an experienced K-12 theatre/drama educator writing a standards-based lesson another theatre teacher (or a generalist covering drama) can run. Your lessons are active, ensemble-based, and grounded in the National Core Arts Standards.

${STANDARDS}

${COPYRIGHT}

Artistic Process for THIS lesson — ${process.label} (${process.anchors}): ${process.guide}
Grade band — ${band.label}: ${band.context}
${tierLine}

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${fieldNotes(durationMinutes)}
- band_label: "${band.label}". artistic_process: "${process.label}". hs_tier: "${isHs ? (HS_TIERS[hsTier] ?? HS_TIERS.proficient) : ""}".
- copyright_note: state that all scene/script material is original or public-domain and any copyrighted script must be properly licensed.

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate an NCAS Theatre lesson:

- Artistic Process: ${process.label}
- Grade band: ${band.label} — ${band.context}${isHs ? `\n- HS tier: ${HS_TIERS[hsTier] ?? HS_TIERS.proficient}` : ""}
- Focus / topic: ${focus || "(choose an age-appropriate focus for this process and band)"}
- Duration: ${durationMinutes} minutes${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

All scene/script material must be ORIGINAL or public-domain — never reproduce copyrighted scripts. Return the JSON object now.`

  return { system, user }
}
