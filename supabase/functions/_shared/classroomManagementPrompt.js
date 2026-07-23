/**
 * Classroom Management quick-reference card prompt builder.
 *
 * MVP slice: grades 6–8 only, "laminate-and-post" quick-reference card output.
 * Generates concise, scannable content sections for large-group specials classes
 * (25–60+ students, no homeroom rapport time). Uses Claude Haiku + structured
 * outputs (guaranteed valid JSON), matching the CTE approach.
 */

// JSON Schema for structured outputs — forces valid, schema-conforming JSON.
// Every object needs additionalProperties:false and all props in required.
export function buildClassroomCardSchema() {
  const strArr = { type: "array", items: { type: "string" } }
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "heading",
      "attention_signals",
      "entry_routine",
      "exit_routine",
      "equipment_distribution",
      "large_group_strategies",
      "behavior_expectations",
    ],
    properties: {
      heading: { type: "string" },
      attention_signals: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["signal", "meaning"],
          properties: { signal: { type: "string" }, meaning: { type: "string" } },
        },
      },
      entry_routine: strArr,
      exit_routine: strArr,
      equipment_distribution: strArr,
      large_group_strategies: strArr,
      behavior_expectations: strArr,
    },
  }
}

// Per-grade-band calibration. The card structure is the same across bands, but
// the language, tone, complexity, and signal types must genuinely fit the age —
// not the same content with a different grade label.
function getGradeBandGuidance(gradeBand) {
  const map = {
    "K-2": {
      display: "K–2",
      audience: "very young children in kindergarten through 2nd grade, who cannot read much text, have short attention spans, and respond best to rhythm, song, movement, and pictures",
      calibration: `LANGUAGE & TONE for K–2: Keep every line VERY short and simple (3–8 words), warm and playful. Lean on the cues little kids love: clap-back rhythms ("clap-clap … clap-clap-clap" → children echo it), a sing-song call-and-response ("1-2-3, eyes on me!" → "1-2, eyes on you!"), a traffic-light or lights-off visual, a chime or bell, a quiet-coyote/quiet-signal hand. Routines are tiny concrete body actions (walking feet, hands in your lap, bubble in your mouth, line up on the dots). Behavior expectations describe small observable actions in kid words ("Keep your hands and feet to yourself", "Use walking feet inside"). Never use abstract words like respect, responsibility, cooperation — describe the action instead. Assume steps may be paired with a picture, so keep them literal.`,
    },
    "3-5": {
      display: "3–5",
      audience: "upper-elementary students in grades 3–5, who can read, follow 2–3 step routines, and take on small responsibilities",
      calibration: `LANGUAGE & TONE for 3–5: Clear, friendly, and specific. Students can handle short multi-step routines and a brief "why". Signals: a call-and-response, a countdown, a chime, or a raised hand for silence (clap-backs can still work at grade 3, feel young by grade 5). Routines can assign small jobs (line leader, equipment helper, materials monitor). Behavior expectations are concrete and observable, tied to real classroom moments, with at most a light reason — never a slogan.`,
    },
    "6-8": {
      display: "6–8",
      audience: "middle-school students in grades 6–8 in a large specials class (25–60+), often with no homeroom rapport time",
      calibration: `LANGUAGE & TONE for 6–8: Direct, respectful, and efficient — these are pre-teens who dislike being talked down to but need clear structure at scale. Do NOT use sing-song chants or clap-backs (they read as babyish here). Signals that work in a big room: a whistle pattern, a crisp call-and-response, a countdown, a hand-up-for-silence. Routines are built for a large group entering and exiting at once. Behavior expectations are concrete, observable, and framed matter-of-factly.`,
    },
    "9-12": {
      display: "9–12",
      audience: "high-school students in grades 9–12 who expect to be treated as near-adults",
      calibration: `LANGUAGE & TONE for 9–12: Respectful, concise, and autonomy-honoring — NOT babyish. Absolutely no clap-backs, chants, whistle-and-freeze, "friends"/"boys and girls", or traffic-light visuals. Use adult, matter-of-fact phrasing with brief rationale that respects their judgment. Signals: a spoken cue ("Pause and listen"), a hand raised for quiet, a visible countdown timer on the screen, or a task-tied attention-getter. Routines assume independence (students self-start the warm-up, self-manage their own equipment/stations, check the board). Behavior expectations are concrete and observable but framed around shared space, safety, and professionalism (phones, lab/equipment, deadlines, cleanup) — state the exact action, never "be respectful" or "be responsible".`,
    },
  }
  return map[gradeBand] ?? map["6-8"]
}

/**
 * @param {Object} input
 * @param {'K-2'|'3-5'|'6-8'|'9-12'} [input.gradeBand]
 * @param {string} [input.classContext] optional specials subject/context (e.g. "PE / gym", "general music", "art")
 * @returns {{ system: string, user: string, schema: object }}
 */
export function buildClassroomManagementPrompt({ gradeBand = "6-8", classContext = "" } = {}) {
  const band = getGradeBandGuidance(gradeBand)
  const context = (classContext || "").trim()
  const contextLine = context
    ? `The teacher's class/subject context: ${context}. Tailor attention signals, routines, equipment steps, and behavior expectations to this setting.`
    : `The class is a general "specials" class (PE, art, music, library, STEM, etc.). Keep signals and routines broadly applicable across specials settings.`

  const system = `You are an expert teacher and classroom-management coach who specializes in LARGE-GROUP "specials" classes (PE, art, music, library, STEM) — often 25 to 60+ students, seen only once or twice a week with little homeroom rapport time. You are writing for ${band.audience}.

Produce a "laminate-and-post" QUICK-REFERENCE CARD for grades ${band.display}. This is a printed card the teacher posts by the door or keeps on a clipboard — so every item must be SHORT, scannable, and imperative. No paragraphs, no preamble, no fluff.

${band.calibration}
The content, tone, complexity, and even the TYPES of signals MUST genuinely fit this grade band — do NOT write generic content and just swap the grade label.

${contextLine}

Fill these sections (calibrated to the grade band above):
- heading: a short card heading that fits the grade band (e.g., "Grades ${band.display} — Classroom Quick Reference").
- attention_signals: 3–5 age-appropriate ways to get a large group's attention fast, of TYPES that fit this grade band (see the calibration above — e.g. clap-backs/chants for the youngest, whistle/countdown for the middle, spoken cues/timers for high school). Each entry is { signal, meaning } — signal is the exact cue the teacher gives, meaning is the instant expected response.
- entry_routine: 4–6 steps (fewer and simpler for younger grades) for how students enter and start, printed in order, sized for a large group entering at once.
- exit_routine: 3–5 steps for how students pack up and exit cleanly.
- equipment_distribution: 3–5 steps for handing out and collecting equipment/materials efficiently with a big group (minimize crowding and lost time).
- large_group_strategies: 4–6 specific strategies for managing a large class without prior rapport, appropriate to the age (proximity, sightlines, grouping, pacing, quick reset; more student autonomy for older grades).
- behavior_expectations: 3–5 core behavior expectations. CRITICAL: every expectation MUST name a concrete, observable action tied to a real moment that happens in THIS specific class/subject and grade band — something a teacher could literally watch a student do or not do. NO generic motivational or abstract language, and NO growth-mindset / poster-slogan phrasing. Ban words/phrases like "be respectful", "be responsible", "try your best", "be kind", "embrace mistakes", "growth mindset", "give 100%". Anchor each expectation to a specific classroom event (what to do when a cut is crooked, a paint spill happens, an instrument squeaks, a ball rolls away, equipment breaks, you finish early, a partner disagrees), phrased at the right age and tone.
  Good vs. generic — match the GOOD bar (and adapt length/tone to the grade band):
    • GOOD (PE): "When a ball rolls into another group, walk to get it — never sprint across the gym."
    • GOOD (art): "If paint or water spills, tell the teacher and grab paper towels before it spreads."
    • GOOD (music): "When your instrument squeaks or a note cracks, keep playing — don't stop or laugh."
    • GENERIC — never write these: "Be respectful and responsible." / "Mistakes are stepping stones — keep a growth mindset." / "Always try your best."
  If a class/subject context was given, make every expectation obviously specific to it.

Across the WHOLE card, use concrete, observable, subject-specific language — no motivational-poster lines anywhere. Match the length and wording to the grade-band calibration (much shorter and simpler for K–2; more adult and autonomy-respecting for 9–12). Keep it tight enough to fit on a single printed page.`

  const user = `Generate the grades ${band.display} classroom-management quick-reference card now${context ? ` for this class context: ${context}` : ""}, calibrated to that grade band's age, tone, and complexity. Return the JSON object only.`

  const schema = buildClassroomCardSchema()

  return { system, user, schema }
}
