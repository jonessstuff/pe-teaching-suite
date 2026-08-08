// Shared "CORE ACTIVITY ONLY" quick-mode directive — an optional, cross-module
// lesson mode. A prompt builder appends `${coreActivityOnly ? coreActivityDirective() : ""}`
// at the END of its system string.
//
// Core Activity Only = FEWER SECTIONS, NOT a shorter lesson. It drops only the two
// structural bookends (warm_up + closure) and keeps the body (main instruction, the
// core activity, and independent practice) at full depth. Standards/competency
// citations and ALL safety notes/boundaries are NON-NEGOTIABLE and stay in full.
export function coreActivityDirective() {
  return `

CORE ACTIVITY ONLY MODE (the teacher opted into a focused, core-only plan): Produce ONLY the core body of this lesson — the main instruction and the central activity/practice. OMIT the opening warm-up and the closing/wrap-up ENTIRELY: set the "warm_up" field and the "closure" field to EMPTY STRINGS (""). Do not put a placeholder or an apology in them — just "".
CRITICAL — this is FEWER SECTIONS, NOT a shorter or condensed lesson: keep every REMAINING section (main/whole-group instruction, the core activity, and independent practice) at FULL depth and detail, exactly as thorough as you would write for a complete lesson. Do NOT trim, summarize, or compress the surviving sections to compensate for the removed ones.
NON-NEGOTIABLE — even in this mode, still include IN FULL: all standards / competency citations and alignment, and every safety note, boundary, and safety-critical instruction that applies to this lesson. NEVER drop safety-critical or standards-alignment content — only the warm_up and closure structural sections are removed, nothing else.`;
}

// Deterministic guarantee for Core Activity Only. The prompt directive above asks the
// model to leave warm_up/closure empty, but models often still fill those "expected"
// fields, so we ALSO strip them server-side after generation. Because the model wrote a
// normal full lesson, the kept sections stay at full depth (this is fewer sections, not a
// condensed lesson). Standards, safety_notes, vocabulary, etc. are untouched.
export function stripNonCoreSections(lesson) {
  if (lesson && typeof lesson === "object") {
    lesson.warm_up = "";
    lesson.closure = "";
  }
  return lesson;
}
