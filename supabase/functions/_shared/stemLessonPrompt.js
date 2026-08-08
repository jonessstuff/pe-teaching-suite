import { resolveStateName } from "./stateNames.js"
import { stationsDirective } from "./stationsDirective.js"
import { udlEfDirective } from "./udlEfDirective.js"

function getStemStandardsGuidance(focusArea, stateName) {
  const isVirginia = stateName === "Virginia"

  const ngss = `Use Next Generation Science Standards (NGSS) as the primary reference. Code format examples: "K-PS2-1" (Kindergarten Physical Science standard 1), "3-LS3-1" (Grade 3 Life Science), "3-5-ETS1-1" (Grades 3–5 Engineering Design standard 1). Engineering design NGSS codes: K-2-ETS1-1, K-2-ETS1-2, K-2-ETS1-3 cover grades K–2; 3-5-ETS1-1, 3-5-ETS1-2, 3-5-ETS1-3 cover grades 3–5. Set the framework field to "NGSS" for each entry.`

  const csta = `Use CSTA K-12 CS Standards as the primary reference. Grade bands: Level 1A = grades K–2, Level 1B = grades 3–5. Domains: CS (Computing Systems), NI (Networks & Internet), DA (Data & Analysis), AP (Algorithms & Programming), IC (Impacts of Computing). Code format: "1A-AP-10", "1B-CS-01", "1A-DA-06". Set the framework field to "CSTA" for each entry.`

  const iste = `Include ISTE Standards for Students as additional standards. Most relevant: ISTE 1 (Empowered Learner), ISTE 4 (Innovative Designer), ISTE 5 (Computational Thinker), ISTE 6 (Creative Communicator). Code format: "ISTE 4.4a", "ISTE 5.5b". Set the framework field to "ISTE" for each entry.`

  const vaScience = isVirginia
    ? `As a secondary reference, include Virginia Science Standards of Learning where you are confident of the exact code. Format: grade-level codes (e.g., "K.1", "2.1", "4.2"). Set the framework field to "VA Science SOL". If unsure of the exact VA SOL code, omit it rather than guessing.`
    : `If ${stateName} has adopted NGSS or has its own science standards that you know with confidence, include those as additional standard entries with the framework name in the framework field. If unsure, use NGSS codes only.`

  const vaCS = isVirginia
    ? `As a secondary reference, include Virginia Computer Science Standards of Learning where you are confident of the exact code. Set the framework field to "VA CS". If unsure, omit rather than guess.`
    : `If ${stateName} has CS-specific state standards that you know with confidence, include those with the framework name in the framework field. If unsure, use CSTA codes only.`

  const disclaimer = `Only use a standard code if you are confident it matches the official framework. If you are not certain, append "(verify against official standards)" to that standard's text field — do not present an uncertain code as definitively correct.`

  if (focusArea === "science") return `${ngss}\n\n${vaScience}\n\n${disclaimer}`
  if (focusArea === "engineering") return `${ngss} Prefer ETS1 engineering design codes for this lesson type.\n\n${vaScience}\n\n${disclaimer}`
  if (focusArea === "coding") return `${csta}\n\n${iste}\n\n${vaCS}\n\n${disclaimer}`
  if (focusArea === "maker") return `${iste} Focus especially on ISTE 4 (Innovative Designer) and ISTE 6 (Creative Communicator).\n\n${csta} Include CSTA codes only if the maker activity involves explicit computational thinking.\n\n${vaCS}\n\n${disclaimer}`
  return `${ngss}\n\n${disclaimer}`
}

function getPhaseDescriptions(focusArea) {
  const map = {
    engineering: {
      warm_up: {
        name: "Challenge Introduction",
        desc: "Present the design challenge or problem to solve. Share the engineering criteria (what it must do) and constraints (limits: materials, size, cost, time). Connect to a real-world context — name a real engineer or product. Students discuss: what would success look like? Do NOT let students start designing yet. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Research & Brainstorm",
        desc: "Students research or observe existing solutions to the same problem. Then brainstorm at least 3 different design approaches (not just the first idea that comes to mind) using sketches or sticky notes. Teacher facilitates without steering — ask 'What else could work?' and 'What's a completely different approach?' 8–12 minutes.",
      },
      fitness_activities: {
        name: "Design",
        desc: "Groups choose their best idea and create a detailed design plan: labeled sketch, list of materials they will use (from what is available), and a written prediction of how it will meet the criteria. Teacher reviews plans before groups collect materials. Describe the planning template used. 5–8 minutes.",
      },
      independent_practice: {
        name: "Build & Test",
        desc: "Groups build their design, then test it against the engineering criteria. Describe what testing looks like: what is measured or observed, what data students record, how many test trials. After testing, groups identify specifically what worked, what failed, and one concrete change they would make if given more time or materials. 15–20 minutes.",
      },
      closure: {
        name: "Share & Reflect",
        desc: "Groups share their design, test results, and one thing they would change. Use a structured protocol: each group gets 60 seconds to present. End with a whole-class reflection on the engineering design process: 'What do engineers do when their first design does not work?' Connect iteration to real-world engineering. 5–8 minutes.",
      },
    },
    coding: {
      warm_up: {
        name: "Concept Introduction",
        desc: "Introduce the CS concept with a concrete hook — a short engaging question, a brief video clip, or a real-world example of the concept at work. Name the concept explicitly and simply (e.g., 'Today we are learning about loops — a way to make a computer repeat steps without rewriting them every time'). Connect to something students already understand. 3–5 minutes.",
      },
      whole_group_instruction: {
        name: "Unplugged Activity",
        desc: "Teach the CS concept without computers using a kinesthetic or physical activity that makes the concept visible. Examples: students physically act out an algorithm step by step (sequencing), play a sorting game (debugging), or loop a movement pattern (loops). The unplugged activity should create a memorable mental model before screens. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Guided Coding",
        desc: "Teacher-led coding on the target platform with students following along on their own devices. Teacher shares screen, thinks aloud, and codes step by step — name specific blocks, commands, or syntax. Deliberately make and fix an error on screen to model debugging. Describe exactly what students should have working by the end of this phase. 8–12 minutes.",
      },
      independent_practice: {
        name: "Independent Practice",
        desc: "Students work independently or in pairs on a specific coding challenge or project. Write the challenge prompt clearly — be explicit about what students should make or what behavior their code must produce. Include a specific extension challenge for early finishers. Teacher circulates asking 'What are you trying to make happen? What have you tried so far?' — not giving answers. 12–15 minutes.",
      },
      closure: {
        name: "Debug & Share",
        desc: "Students share one thing they made, one bug they found (fixed or not), or one coding question they still have. Normalize bugs as a normal part of coding, not a failure. End with a brief exit ticket or turn-and-talk: students explain the CS concept in their own words. 3–5 minutes.",
      },
    },
    science: {
      warm_up: {
        name: "Question & Hypothesis",
        desc: "Open with an anchor phenomenon — something observable, puzzling, and concrete (a short video clip, a live demonstration, an image, or a physical object). Students observe and generate questions. Teacher guides students toward one testable question. All students write a hypothesis using an 'If…then…because…' structure. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Materials & Procedure",
        desc: "Introduce the investigation materials: show each item, explain its purpose, and address safety before students touch anything. Walk through the procedure step by step while students follow along on their recording sheet. Check understanding: ask students to explain back a step in their own words. 5–8 minutes.",
      },
      fitness_activities: {
        name: "Investigation",
        desc: "Students conduct the investigation in small groups. Describe in detail what students are physically doing: what they are observing, measuring, manipulating, and recording. Describe what the teacher does during this time: which steps to monitor closely, what prompting questions to ask, what to do if a group finishes early. Include any active safety considerations during the investigation. 15–20 minutes.",
      },
      independent_practice: {
        name: "Data & Observations",
        desc: "Students organize their data individually: create a data table, labeled diagram, or simple graph. Students identify patterns in their data and compare results with their group members. Teacher asks guiding questions without giving conclusions: 'What do you notice? Is there a pattern? What surprised you?' Describe what the data recording sheet or display looks like. 8–10 minutes.",
      },
      closure: {
        name: "Conclusions",
        desc: "Students write or discuss conclusions: revisit the original hypothesis, state whether data supported or refuted it, and cite specific evidence from their data. Use a sentence frame: 'My data shows… This supports/refutes my hypothesis because…' End by connecting findings to the real world or previewing the next investigation in the unit. 5–8 minutes.",
      },
    },
    maker: {
      warm_up: {
        name: "Inspiration",
        desc: "Share examples of what has been made with similar materials — photos, short video of a maker/inventor, or a physical sample. Ask open-ended questions: 'What do you notice? What do you wonder? What would you make if you could make anything?' Introduce the available materials without prescribing a project — this session is open-ended. 3–5 minutes.",
      },
      whole_group_instruction: {
        name: "Materials Exploration",
        desc: "Students handle and explore the available materials before committing to a creation. Structured free-explore: teacher asks discovery questions ('What happens when you fold this? Can you make it balance? What do these two materials do when you connect them?'). This phase prevents 'I do not know what to make' paralysis by giving students direct experience with the materials before making decisions. 5–8 minutes.",
      },
      fitness_activities: {
        name: "Free Create",
        desc: "Students make whatever they choose with the available materials — no prescribed output, no right answer. Teacher circulates and asks curious questions ('Tell me what you are making. How are you connecting those pieces? What is your plan for the next part?'). Offer specific technique help when asked. Do NOT redirect students toward a correct or expected creation. 15–20 minutes.",
      },
      independent_practice: {
        name: "Refine",
        desc: "Students revisit their creation with fresh eyes and improve it: strengthen a joint that keeps falling apart, add a missing detail, solve a problem they noticed during making, or extend the original idea further. Teacher asks: 'What would make it even better? Is there anything that is not working the way you wanted? What is one thing you would change?' 8–10 minutes.",
      },
      closure: {
        name: "Gallery Share",
        desc: "Gallery walk: all creations are displayed and students circulate to see each other's work, leaving one sticky-note observation or question for at least two peers. End with 3–4 volunteers sharing their creation and explaining one decision they made. Celebrate process, problem-solving, and unique ideas — not only neatly finished items. 5–8 minutes.",
      },
    },
  }
  return map[focusArea] ?? map.engineering
}

/**
 * @param {Object} input
 * @param {'engineering'|'coding'|'science'|'maker'} input.focusArea
 * @param {number[]} input.gradeBands       e.g. [2, 3] — K=0 through 5
 * @param {string}  input.topic             lesson focus / topic
 * @param {string[]} input.materials        materials / tech available
 * @param {number}  input.classSize
 * @param {number}  input.durationMinutes
 * @param {string}  [input.targetStandard]
 * @param {string}  [input.state]           two-letter abbreviation
 * @param {number}  [input.sessionNumber]   1-based stage index; 0 = standalone
 * @param {number}  [input.totalSessions]   total stage count
 * @param {string}  [input.priorSessionsSummary]
 * @returns {{ system: string, user: string }}
 */
// Elementary hands-on/kinesthetic lens (K-2/3-5 toggle) — favors manipulatives,
// movement, and tactile work over worksheet/seatwork.
const HANDS_ON_DIRECTIVE = `\n\nHANDS-ON / KINESTHETIC EMPHASIS (elementary): Make the PRIMARY mode of learning hands-on, kinesthetic, and movement-based — NOT worksheets or seatwork. Favor manipulatives and physical objects (counters, tiles, cards, blocks, real materials), whole-body movement and gesture, tactile exploration, sorting / building / acting-out, learning stations, and partner or group activities where students are up and doing. The MAIN activity must be concrete and physical (e.g., physical objects for counting / sorting / fraction work in math, movement- or gesture-based vocabulary and word work in reading and language, hands-on building and exploration in science, manipulating real materials otherwise). Actively STEER AWAY from paper-based independent worksheets as the core task — keep any written recording brief and secondary to the physical doing. Keep it developmentally appropriate for young learners' attention spans and motor skills.`

export function buildStemLessonPrompt({
  focusArea = "engineering",
  gradeBands = [],
  topic = "",
  materials = [],
  classSize = 25,
  durationMinutes = 45,
  targetStandard = "",
  state = "",
  sessionNumber = 0,
  totalSessions = 0,
  priorSessionsSummary = "",
  includeELL = false,
  includeUdlEf = false,
  handsOn = false,
  stationsMode = false,
  stationCount = 3,
}) {
  const stateName = resolveStateName(state)
  const gradeStr = gradeBands.map((g) => (g === 0 ? "Kindergarten" : `Grade ${g}`)).join(", ")
  const standardsGuidance = getStemStandardsGuidance(focusArea, stateName)
  const phases = getPhaseDescriptions(focusArea)

  const isMultiStage = sessionNumber > 0
  const stageLabel = isMultiStage ? `Stage ${sessionNumber} of ${totalSessions}` : ""

  const focusAreaLabel = {
    engineering: "Engineering Design Challenge",
    coding: "Coding & Computational Thinking",
    science: "Science Investigation",
    maker: "Maker & Tinkering",
  }[focusArea] ?? "STEM"

  const system = `You are an experienced K–5 STEM educator writing a ${focusAreaLabel} lesson plan for a STEM specialist or classroom teacher in ${stateName}. You understand how elementary STEM lessons actually work: making abstract concepts concrete, managing materials and groups efficiently, scaffolding for different grade levels, and connecting STEM to real-world contexts.

Lesson type: ${focusAreaLabel}
Grade level(s): ${gradeStr || "Grade 3"}
Class size: ${classSize}
Duration: ${durationMinutes} minutes

Lesson structure — 5 required phases:

1. ${phases.warm_up.name} (warm_up field): ${phases.warm_up.desc}

2. ${phases.whole_group_instruction.name} (whole_group_instruction field): ${phases.whole_group_instruction.desc}

3. ${phases.fitness_activities.name} (fitness_activities field): ${phases.fitness_activities.desc}

4. ${phases.independent_practice.name} (independent_practice field): ${phases.independent_practice.desc}

5. ${phases.closure.name} (closure field): ${phases.closure.desc}

Teacher Prep (teacher_prep field): Everything the teacher must do BEFORE students arrive. Write specific, actionable steps: what materials to pre-sort into group containers or stations, what technology to set up and test (log in, open links, test projector), what examples to print or display, what recording sheets to copy, how to arrange tables and materials for this lesson. Write as a practical pre-class checklist.

Standards: ${standardsGuidance}

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — matching this exact schema:

{
  "title": string,
  "grade_bands": number[],
  "unit": string,
  "subject": "STEM",
  "focus_area": "${focusArea}",
  "duration_minutes": number,
  "class_size": number,
  "stage_label": string,
  "standards": [{ "grade": number, "code": string, "framework": string, "text": string }],
  "learning_targets": { "<grade>": string },
  "success_criteria": { "<grade>": string[] },
  "skill_focus": string[],
  "assessment_type": "formative" | "summative" | "self-assessment",
  "teacher_prep": string,
  "equipment_needed": string[],
  "equipment_alternatives": string[],
  "tools_and_platforms": string[],
  "location": string,
  "setup_diagram": string,
  "warm_up": string,
  "whole_group_instruction": string,
  "fitness_activities": string,
  "independent_practice": string,
  "closure": string,
  "modifications": { "<grade>": string },
  "known_vocabulary": string[],
  "new_vocabulary": string[],
  "safety_notes": string[],
  "sub_friendly_instructions": "",
  "sub_script": "",
  "sub_management_script": "",
  "sub_diagram": "",
  "suggested_video_searches": string[]
}

Field notes:
- title: specific and engaging — name the challenge/investigation/project clearly (e.g., "Bridge the Gap: Engineering a Paper Bridge for Maximum Load", "Scratch Loops Lab: Animating a Dance Sequence", "Sink or Float? Testing Material Density", "Cardboard Automata: Making Things Move Without Electricity")
- subject: always exactly "STEM"
- focus_area: always exactly "${focusArea}"
- unit: the broader STEM unit this lesson belongs to (e.g., "Structures & Forces", "Introduction to Algorithms", "Properties of Matter", "Invention & Making")
- stage_label: ${isMultiStage ? `"${stageLabel}" — required exactly as shown` : `"" (empty string — standalone lesson)`}
- standards: one entry per grade band; use 0 for K in the grade field; the framework field must match the standards framework name exactly (e.g., "NGSS", "CSTA", "ISTE", "VA Science SOL", "VA CS")
- equipment_needed: specific and detailed with quantities per student or group (e.g., "Popsicle sticks — 20 per group of 3", "Masking tape — 1 roll per group", "Chromebook — 1 per student, Scratch account pre-created by teacher"). NOT vague entries like "tape" or "computers".
- equipment_alternatives: lower-cost or lower-tech alternatives that achieve the same learning objective
- tools_and_platforms: 2–4 specific named digital tools, apps, or platforms with a brief note on their role in this lesson (e.g., "Scratch (scratch.mit.edu) — free, browser-based, no download; students animate their character using loop blocks", "Tinkercad (tinkercad.com) — free 3D design tool for documenting design sketches", "Seesaw — students photograph their build for digital portfolio"). For science/engineering lessons include documentation tools if relevant (Google Slides, Seesaw). For coding lessons name the specific platform and course/activity.
- location: how the classroom or STEM lab should be arranged for this lesson (e.g., "STEM lab — tables in groups of 3–4 with shared material bins centered on each table, clear workspace for building")
- setup_diagram: brief text description of the station or material layout
- learning_targets: "Today I will…" statements, one per grade band, keyed by grade number (0 for K)
- success_criteria: exactly 3 "I can…" statements per grade band, keyed by grade number (0 for K)
- modifications: differentiation for each grade band — both scaffolds for students who need support and extensions for early finishers. Keyed by grade number (0 for K).
- skill_focus: 2–4 specific STEM skills this lesson develops (e.g., "Engineering Design Process — Define and Constrain", "Debugging and iteration", "Fair testing / controlled variables", "Sequencing and loop structures")
- safety_notes: specific safety considerations for this lesson. Science: chemical or material safety, heat, sharp objects. Engineering/Maker: hot glue gun supervision, cutting tools, structural testing safety. Coding: appropriate platform use, account privacy. Leave as [] only if there are genuinely no considerations.
- suggested_video_searches: exactly 2–3 specific search queries a teacher can paste directly into YouTube or Google — named and specific (e.g., "engineering design process elementary school kids", "Scratch loops tutorial Grade 3", "sink or float science experiment elementary")
- known_vocabulary: STEM terms students should already know coming in
- new_vocabulary: STEM terms students will learn in this lesson${isMultiStage ? `

MULTI-STAGE PROJECT CONTEXT — ${stageLabel} in the project "${topic || "(see topic below)"}":
${sessionNumber === 1
  ? `This is Stage 1. Introduce the foundational concept or challenge. Establish key vocabulary. The ${phases.independent_practice.name} work must produce something students will build on in Stage 2. End closure with a specific preview of what happens next session.`
  : priorSessionsSummary
    ? `Prior stages in this project:\n\n${priorSessionsSummary}`
    : `This is Stage ${sessionNumber}.`
}

CRITICAL requirements for this stage:
- The "title" field MUST follow this format: "${topic || "Project Name"} — ${stageLabel}"
- The "unit" field MUST be exactly: "${topic || "Project Name"}"
- The "subject" field MUST be: "STEM"
- The "focus_area" field MUST be: "${focusArea}"
- The "stage_label" field MUST be: "${stageLabel}"${sessionNumber > 1 ? `
- Do NOT re-introduce concepts or skills already covered in prior stages listed above
- teacher_prep must include retrieving students' in-progress work from storage
- The ${phases.warm_up.name} phase MUST explicitly reference what students made or learned in the prior stage` : ""}${sessionNumber === totalSessions && totalSessions > 1 ? `
- This is the FINAL stage: closure must bring the project to a satisfying conclusion (presentation, gallery walk, reflection protocol — not a preview of another session)
- teacher_prep must include preparation for displaying or collecting finished work` : sessionNumber > 0 && sessionNumber < totalSessions ? `
- Closure must preview specifically what students will do in Stage ${sessionNumber + 1}
- teacher_prep must include how to store in-progress work between sessions` : ""}` : ""}${includeELL ? `\n\nELL ACCOMMODATIONS: This lesson will be taught to a class that includes English Language Learners. In addition to all fields in the schema above, add an "ell_accommodations" object to the JSON with these subfields:\n- language_objectives: 2–3 strings in format "Students will [language skill] in order to [content purpose]"\n- tiered_vocabulary: { tier_1: [everyday words students likely know], tier_2: [academic cross-subject vocabulary], tier_3: [content-specific STEM vocabulary unique to this lesson] } — each value is an array of strings\n- sentence_frames: 4–6 strings, each labeled with the specific STEM lesson context (e.g. "During the design phase: 'My plan is to ___ because ___'", "During share-out: 'Our design worked / did not work because ___'")\n- visual_supports: 4–6 specific, concrete suggestions for visual supports, step-by-step picture cards, or gesture cues tied to this lesson's actual activities and materials\n- simplified_instructions: single string — 2–3 short sentences describing the core challenge or task at a 2nd-grade reading level, no idioms, no figurative language` : ""}${handsOn ? HANDS_ON_DIRECTIVE : ""}${stationsMode ? stationsDirective({ stationCount, field: "independent_practice", unit: "investigation / build", note: "Each station is an investigation or build station (e.g., a testing station, a materials/prototyping station, a data-collection station, a design-challenge station)." }) : ""}${includeUdlEf ? udlEfDirective() : ""}`

  const user = `Generate a complete K–5 ${focusAreaLabel} lesson${isMultiStage ? ` project stage (${stageLabel})` : ""} with these parameters:

- Grade band(s): ${gradeStr || "Grade 3"}
- ${isMultiStage ? `Project name: ${topic || `(choose an appropriate ${focusAreaLabel} project for this grade level)`}` : `Lesson topic / focus: ${topic || `(choose an appropriate ${focusAreaLabel} lesson for this grade level)`}`}
- Materials / technology available: ${materials.filter(Boolean).join(", ") || "standard STEM supplies: popsicle sticks, tape, index cards, rubber bands, scissors, paper clips, straws, cardboard scraps, and class set of devices with internet access"}
- Class size: ${classSize}
- Duration: ${durationMinutes} minutes${targetStandard ? `\n- Target standard / objective: ${targetStandard} — build the lesson specifically around this; ensure it appears in the standards array` : ""}

Return the JSON object now.`

  return { system, user }
}
