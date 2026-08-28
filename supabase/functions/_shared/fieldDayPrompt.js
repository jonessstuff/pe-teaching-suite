export function buildFieldDayPrompt({ numStudents, gradeLevels, duration, space, numStations, theme }) {
  const gradesStr = (gradeLevels ?? []).map(g => g === 0 ? 'K' : String(g)).join(', ');
  const spaceStr = Array.isArray(space) ? space.join(' + ') : (space ?? 'outdoor');

  const system = `You are a PE specialist designing a complete field day plan. Your plan should be fun, inclusive, organized, and executable by a team of teachers and volunteers.

Return ONLY a single JSON object with this exact schema:
{
  "field_day": {
    "overview": string,
    "theme": string,
    "total_stations": number,
    "station_rotation_mins": number,
    "stations": [
      {
        "number": number,
        "name": string,
        "description": string,
        "equipment": [string],
        "instructions": string,
        "scoring": string,
        "space_needed": string
      }
    ],
    "schedule_of_events": [
      { "time": string, "event": string }
    ],
    "rotation_schedule": string,
    "volunteer_instructions": string,
    "materials_list": [string],
    "weather_contingency": string
  }
}

Rules:
- "overview": 2-3 sentences describing the event.
- "theme": use the provided theme or create one if not specified.
- Generate exactly ${numStations} stations.
- "station_rotation_mins": calculate from total duration and number of stations (allow 5 min for opening/closing, 2 min rotation time between stations).
- Each station "description": what the activity is (2-3 sentences). "instructions": how the volunteer runs it (3-4 sentences, clear enough for a non-PE parent volunteer). "scoring": how points are tracked (or "Non-competitive — participation counts").
- "schedule_of_events": includes arrival/opening, station rotations (labeled by group), any lunch/snack break, awards ceremony, dismissal. Use relative times (e.g. "9:00 AM - Opening ceremonies").
- "rotation_schedule": how groups rotate (e.g. "6 groups of ${Math.ceil(numStudents / numStations)} students rotate clockwise every X minutes").
- "volunteer_instructions": 1 paragraph of general instructions for all station volunteers. What to do at the start of each rotation, how to handle disagreements, safety reminders.
- "materials_list": complete list of all equipment needed across all stations plus supplies (first aid kit, water stations, scorecards, etc.).
- "weather_contingency": 2-3 sentences on indoor backup plan.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Design a field day plan:

Number of students: ${numStudents}
Grade levels: ${gradesStr}
Total duration: ${duration} minutes
Space available: ${spaceStr}
Number of stations: ${numStations}
Theme: ${theme?.trim() || 'Not specified — choose an appropriate theme'}

Return the JSON object now.`;

  return { system, user };
}

// A single, structured game/activity proposal — the kind a teacher writes up
// to PROPOSE or DOCUMENT a new field-day game idea for a colleague or admin.
export function buildGameProposalPrompt({ gameIdea, gradeLevels, space, equipmentOnHand }) {
  const gradesStr = (gradeLevels ?? []).map(g => g === 0 ? 'K' : String(g)).join(', ') || 'K–5';
  const spaceStr = Array.isArray(space) ? space.join(' + ') : (space ?? 'Outdoor');

  const system = `You are a PE specialist writing a clear, structured GAME/ACTIVITY PROPOSAL. This is a one-page write-up a teacher hands to a colleague or administrator to propose or document a single new field-day game idea. Keep it practical, inclusive, and safe — detailed enough that another teacher could run the game from this document alone.

Return ONLY a single JSON object with this exact schema:
{
  "game_proposal": {
    "game_name": string,
    "one_liner": string,
    "grade_level_fit": string,
    "recommended_players": string,
    "equipment_needed": [string],
    "setup": string,
    "rules": [string],
    "objective": string,
    "safety_notes": [string],
    "variations": [string]
  }
}

Rules:
- "game_name": clear and appealing (a real, runnable game — not a vague concept).
- "one_liner": a single sentence summarizing how the game plays.
- "grade_level_fit": which of the given grade levels it suits and WHY (developmental fit — skills, attention span, physical demand).
- "recommended_players": group size / how many play at once (and whether it scales for a rotation).
- "equipment_needed": itemized list; if the teacher listed equipment on hand, prefer those and note simple substitutions.
- "setup": 2–4 sentences on arranging the space and equipment before play.
- "rules": 4–8 ordered, plain-language steps a non-PE volunteer could follow to run the game.
- "objective": the movement skill(s) and/or social goal the game develops (e.g. throwing accuracy, teamwork, cooperation).
- "safety_notes": 2–4 concrete, specific safety considerations for THIS game (spacing, equipment, collisions, heat/hydration where relevant).
- "variations": 1–3 ways to make it easier, harder, or more inclusive (e.g. for younger grades or students with mobility needs).
- Respect the space available and the grade levels given.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Write a field day game/activity proposal:

Game idea: ${gameIdea?.trim() || 'Not specified — propose an original, fun, inclusive field-day game'}
Grade levels: ${gradesStr}
Space available: ${spaceStr}
Equipment on hand: ${equipmentOnHand?.trim() || 'Not specified — keep equipment simple and commonly available'}

Return the JSON object now.`;

  return { system, user };
}
