// Shared "TIER 1 UDL / EXECUTIVE-FUNCTION SUPPORTS" directive — an optional,
// cross-module lesson enhancer. A prompt builder appends
// `${includeUdlEf ? udlEfDirective() : ""}` at the END of its system string.
//
// TIER 1 ONLY: universal, whole-class supports available to ALL students. This
// is deliberately DISTINCT from the standalone Intervention Planning module,
// which handles Tier 2 targeted intervention + the taxonomy/decision-rule stack.
// Reuses the UDL (CAST) + executive-function framing from interventionPrompt.js,
// applied to regular content lessons (PE, Art, Music, CTE, etc.).
export function udlEfDirective() {
  return `

TIER 1 UDL & EXECUTIVE-FUNCTION SUPPORTS (universal — for ALL students): Weave genuine Tier 1 Universal Design for Learning and executive-function supports NATURALLY into this lesson wherever they authentically strengthen it for the whole class — especially within the instruction, practice, and differentiation/modifications sections. Do NOT force them onto every section, do NOT add a separate remediation track, and do NOT change the learning goal, standards, or grade-level rigor. These are universal supports available to everyone, NOT a Tier 2 targeted intervention (that lives in a separate tool).
- UNIVERSAL DESIGN FOR LEARNING (CAST): where relevant, build in multiple means of ENGAGEMENT (recruit interest, sustain effort and persistence, support self-regulation), REPRESENTATION (present content in more than one format — visual, verbal, demonstration, hands-on), and ACTION & EXPRESSION (offer varied ways to practice and show learning while keeping the same goal).
- EXECUTIVE-FUNCTION SUPPORTS: where the lesson's tasks genuinely tax them, embed supports for working memory, task initiation, planning/organization, self-monitoring, cognitive flexibility, and emotional/attention regulation (e.g., posted steps, checklists, models/exemplars, chunked directions, timers, sentence frames, self-check routines).
ALSO add ONE top-level JSON field named "tier1_udl_ef" summarizing ONLY what you genuinely wove in:
{ "udl": { "engagement": string, "representation": string, "action_expression": string }, "executive_function": [ { "skill": string, "support": string } ] }
Leave a UDL principle's value an EMPTY STRING, and executive_function an EMPTY ARRAY, where you did not authentically incorporate it — a partial, honest set is better than forced coverage. Keep each note to the specific support you embedded and where; do not restate the whole lesson.`;
}
