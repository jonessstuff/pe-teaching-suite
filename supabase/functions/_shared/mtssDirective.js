// Optional MTSS (Multi-Tiered System of Supports) directive for PE lessons.
// Appended to the lesson prompt's system string only when the teacher enables the
// "Add MTSS Tier 1 & Tier 2 supports" toggle (`${includeMtss ? mtssDirective() : ""}`).
//
// Distinct from the Tier 1 UDL/EF toggle (universal-design supports): this adds the
// MTSS-framed layer — universal supports WITH whole-class look-fors (monitoring),
// plus a Tier 2 TARGETED layer with progress monitoring. Off by default; not every
// school requires an MTSS section yet.

export function mtssDirective() {
  return `

MTSS TIER 1 & TIER 2 SUPPORTS: This teacher's planbook requires an MTSS section. Add ONE top-level JSON field named "mtss_supports" describing genuine multi-tiered supports for THIS lesson, in this exact shape:
{ "tier_1": [ { "support": string, "look_for": string } ], "tier_2": [ { "focus": string, "support": string, "monitoring": string } ] }

- TIER 1 (universal — for ALL students): supports built into core instruction so most students succeed on the first pass — e.g. clear teacher demonstration, visual cues, choice of practice distance/pace, checks for understanding. For EACH, give the "support" AND a "look_for": the concrete, observable, WHOLE-CLASS sign that Tier 1 is working (the universal-screening/monitoring cue, e.g. "≥80% of students making 3+ successful contacts by the second rotation"). Do NOT change the learning goal, standards, or grade-level rigor.
- TIER 2 (targeted — for SOME students who need more): small-group or brief individual TARGETED support for students not yet responding to Tier 1 — never a lowered-expectations track and never a different learning goal. For EACH: "focus" = which students / which specific skill gap; "support" = the targeted intervention (e.g. a short teacher-led station, a peer model, a scaffolded rep scheme); "monitoring" = how to PROGRESS-MONITOR those students (a specific, countable check, e.g. "consistent tosses out of 5, start vs. end of class").

RULES:
- Ground every entry in THIS lesson's actual skills and activities — no generic MTSS boilerplate.
- Leave "tier_1" or "tier_2" an EMPTY ARRAY if nothing authentic applies for that tier. A partial, honest set is better than forced coverage.
- If Tier 1 UDL/executive-function supports are also present in this lesson, do NOT restate them here — add the MTSS monitoring/look-fors and the Tier 2 targeted layer that those do not cover.
- Keep each note specific and brief; do not restate the whole lesson.`;
}
