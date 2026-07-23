/**
 * Makerspace / Maker Projects prompt builder.
 *
 * A SHARED content category surfaced from both the STEM module and the Library
 * & Media module (many makerspaces are run by STEM teachers, many by librarians
 * / media specialists). One generator, one prompt, two entry points — the
 * host module only changes the back-navigation, never the content.
 *
 * There is no single national standards body for makerspace education the way
 * NAGC/NCTM/IDA anchor other modules, so this anchors LOOSELY to the ISTE
 * Standards for Students and general engineering-design-process language, and
 * every response carries a note that makerspace programming varies widely by
 * school/district with no single required framework.
 */

const GRADE_BANDS = {
  "k-2": { label: "K–2", context: "early makers — keep builds simple, highly guided, and safety-forward; favor tactile materials and heavily supervised or teacher-run tool steps." },
  "3-5": { label: "3–5", context: "upper-elementary makers — students can run more of the design cycle with structured supervision; introduce beginner robotics/coding and simple tool use." },
  "6-8": { label: "6–8", context: "middle-grade makers — students can handle more independent design, iteration, and (with training and supervision) more capable equipment." },
  "9-12": { label: "9–12", context: "high-school makers — students can take on complex, multi-session builds and advanced equipment with proper certification/training; expect real engineering constraints and documentation." },
}

function resolveBand(gradeBand) {
  return GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
}

// Tool-specific grounding so equipment safety and project ideas are concrete.
const TOOL_NOTES = {
  "3d_printer": "3D printer (FDM). Cover slicing basics, bed adhesion, hot-end/bed burn risk, ventilation, and never reaching into the build area while printing.",
  "laser_cutter": "Laser cutter / engraver. Cover material safety (never cut PVC/vinyl/unknown plastics — toxic fumes), fume extraction/ventilation, fire watch (never leave unattended), eye safety, and material bed setup.",
  "vinyl_cutter": "Vinyl cutter / craft cutter. Cover blade depth/handling, weeding, transfer tape, mat care, and safe blade storage.",
  "robotics": "Robotics kit (Dash/Sphero/LEGO-style or similar). Cover block/visual coding, motor/sensor use, battery/charging care, and clear driving space.",
  "hand_tools": "Basic hand tools (hand drills, saws, hot-glue guns, hammers, safety knives). Cover PPE (eye protection), tool-specific handling, burn/cut risk, and a clear workspace.",
  "electronics": "Coding / electronics kit (micro:bit, Arduino, littleBits, Makey Makey, snap circuits). Cover polarity, short circuits, ESD basics, careful wiring, and battery/USB power safety.",
  "classic_build": "No powered equipment — classic hands-on build (cardboard structures, marble runs, simple machines, paper circuits, K'nex). Cover safe use of scissors/glue/craft knives and stable construction.",
}

const STANDARDS_STACK = `Anchor the project LOOSELY to widely recognized competencies (there is no single required makerspace framework):
- ISTE Standards for Students — especially Innovative Designer (Standard 4: use a design process to solve problems, manage risk, and iterate), Computational Thinker (Standard 5), Empowered Learner (Standard 1), and Creative Communicator (Standard 6). Framework field: "ISTE".
- The Engineering Design Process — a cyclical Ask → Imagine → Plan → Create → Test → Improve progression. Framework field: "Engineering Design Process".

Center the work on hands-on making and iteration: students design, build, test, and improve — productive struggle and redesign are the point, not a single "correct" product.`

const FRAMEWORK_NOTE_GUIDANCE = `Makerspace programming varies widely by school and district — equipment, budgets, age ranges, and goals all differ — and there is no single national standards body or required framework for it. Populate framework_note with a brief, non-prescriptive reminder of this (the ISTE/engineering-design anchors are a helpful lens, not a mandate), and to check the school/district's own makerspace scope, budget, and safety policies.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

/**
 * @param {Object} input
 * @param {string}  input.tool         one of the TOOL_NOTES keys
 * @param {string}  input.gradeBand    'k-2' | '3-5' | '6-8' | '9-12'
 * @param {string}  [input.projectType]  'equipment' | 'cross_curricular' | 'classic'
 * @param {string}  [input.crossCurricular]  a subject/topic to tie the build to
 * @param {string}  [input.groupContext]     station/group logistics context (no names)
 * @param {string}  [input.focus]      specific project idea/target
 * @param {string}  [input.teacherNotes]
 * @returns {{ system: string, user: string }}
 */
export function buildMakerProjectPrompt({
  tool = "3d_printer",
  gradeBand = "3-5",
  projectType = "equipment",
  crossCurricular = "",
  groupContext = "",
  focus = "",
  teacherNotes = "",
}) {
  const band = resolveBand(gradeBand)
  const toolNote = TOOL_NOTES[tool] ?? TOOL_NOTES["3d_printer"]
  const typeEmphasis =
    projectType === "cross_curricular"
      ? `PROJECT TYPE — CROSS-CURRICULAR: tie the build to another subject's content so the making deepens academic understanding (like the classic example of programming a robot to trace the path of blood flow through the circulatory system). ${crossCurricular ? `Tie it specifically to: ${crossCurricular}.` : "Choose a strong, age-appropriate cross-curricular tie and name the subject."} Make the cross_curricular_connection the heart of the project.`
      : projectType === "classic"
        ? `PROJECT TYPE — CLASSIC HANDS-ON BUILD: center a low/no-tech build (structures, marble runs, simple machines, paper circuits). Tech is optional; the engineering thinking is the point.`
        : `PROJECT TYPE — EQUIPMENT-BASED: center the project on the chosen tool, teaching its safe, purposeful use through a real build.`

  const system = `You are an experienced makerspace facilitator who has run a real lab used by BOTH STEM teachers and library/media specialists. You write project plans that are hands-on, safety-forward, and realistic for a shared lab with large groups — concrete about equipment, stations, and iteration, not vague "let students create" prompts.

${STANDARDS_STACK}

Tool in focus: ${toolNote}

${typeEmphasis}

${JSON_ONLY} Match this schema exactly:

{
  "subject": "Makerspace",
  "title": string,
  "grade_bands": number[],
  "tool": string,
  "project_type": string,
  "sessions": string,
  "driving_question": string,
  "project_overview": string,
  "materials_equipment": string[],
  "tool_safety": { "procedures": string[], "supervision_note": string },
  "design_process": [ { "phase": string, "what_students_do": string } ],
  "cross_curricular_connection": { "subject": string, "connection": string, "example": string },
  "station_management": { "setup": string, "rotation": string, "shared_equipment_safety": string, "large_group_tips": string[] },
  "differentiation": string,
  "low_tech_variant": string,
  "assessment_reflection": string,
  "standards_alignment": [ { "framework": string, "text": string } ],
  "framework_note": string
}

Field notes:
- subject: always exactly "Makerspace".
- title: specific and build-flavored (e.g., "Design & Print a Working Marble-Run Bracket" or "Code a Robot to Map the Water Cycle").
- grade_bands: a JSON array of grade numbers for this band (K = 0).
- tool: echo the tool in focus in plain language.
- project_type: "Equipment-based", "Cross-curricular", or "Classic hands-on build".
- sessions: realistic time span (e.g., "2–3 sessions, ~45 min each").
- driving_question: the open question that frames the build.
- project_overview: 1–2 paragraphs — what students make and why it matters.
- materials_equipment: specific consumables + equipment with rough quantities per group/station.
- tool_safety: procedures = 4–6 SPECIFIC safety steps for THIS tool (not generic); supervision_note = the adult-supervision / training / certification expectation for this tool and band.
- design_process: 5–6 steps following Ask → Imagine → Plan → Create → Test → Improve, each with what_students_do for THIS build. Iteration/redesign must appear.
- cross_curricular_connection: subject = the other content area; connection = how the build reinforces that content; example = one concrete instance. ${projectType === "cross_curricular" ? "This is the core of the project — be substantive." : "Even for an equipment-based or classic build, offer a genuine, usable cross-curricular tie here."}
- station_management: for a shared lab with LARGE groups — setup = station layout; rotation = how groups cycle through limited equipment; shared_equipment_safety = managing safety when many students share one tool; large_group_tips = 3–4 concrete crowd/behavior/queue-management tips.
- differentiation: how to scale the build across the ${band.label} band and for varied readiness.
- low_tech_variant: a classic, no-/low-tech version of the same core idea for labs without the equipment (or as a warm-up) — this keeps the project usable everywhere.
- assessment_reflection: how to assess the making/iteration (process + product) and a short student reflection prompt.
- standards_alignment: 2–4 entries; framework exactly "ISTE" or "Engineering Design Process"; text = the competency this build exercises.
- framework_note: ${FRAMEWORK_NOTE_GUIDANCE}

LENGTH DISCIPLINE: A COMPLETE plan (every field present, JSON closed) matters more than exhaustive detail. Keep text fields focused and lists to the counts requested. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate a makerspace project plan with these parameters:

- Tool / equipment: ${toolNote}
- Project type: ${projectType === "cross_curricular" ? "Cross-curricular" : projectType === "classic" ? "Classic hands-on build" : "Equipment-based"}
- Specific project idea / focus: ${focus || "(choose a strong, age-appropriate build for this tool and band)"}
- Grade band: ${band.label} — ${band.context}${crossCurricular ? `\n- Cross-curricular tie: ${crossCurricular}` : ""}${groupContext ? `\n- Group / station context: ${groupContext}` : ""}${teacherNotes ? `\n- Facilitator notes: ${teacherNotes}` : ""}

Do not use student names or personally identifying information. Return the JSON object now.`

  return { system, user }
}
