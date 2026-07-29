// Shared "STATIONS MODE" directive — lifts PE's rotating-stations pattern
// (see lessonPrompt.js) into other modules as a cross-module option. A prompt
// builder appends `${stationsMode ? stationsDirective({...}) : ""}` at the END of
// its system string; `field` names the schema section to restructure, `unit`
// labels the station type, and `note` carries per-module framing (e.g. the
// developmental caveat for Early Childhood / ECSE, or the enrichment framing for
// Gifted & Talented).
export function stationsDirective({ stationCount = 3, field = "independent_practice", unit = "skill", note = "" } = {}) {
  const n = Math.max(2, Math.min(6, Number(stationCount) || 3));
  return `

STATIONS MODE: Structure the ${field} section explicitly as ${n} rotating ${unit} stations that students move through in small groups. Label each station as STATION A, STATION B, STATION C, etc. — do NOT use "Round 1", "Round 2", or any other labeling. The rotation structure must be unambiguous. For each station: state the focus in the header (e.g. "STATION A — <focus>"), describe the setup, describe the activity, specify the rotation timing, and note any materials/equipment needed at that station. Use \\n\\n between stations. Keep the rest of the lesson's structure and every other schema field intact.${note ? " " + note : ""}`;
}
