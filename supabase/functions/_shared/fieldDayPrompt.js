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
