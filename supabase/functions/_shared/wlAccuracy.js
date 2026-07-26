/**
 * Single source of truth for the World Languages target-language accuracy
 * guardrail. Imported by BOTH the World Languages lesson prompt
 * (worldLanguagesPrompt.js) AND the per-lesson tools that generate
 * target-language content for a WL lesson (quiz, rubric, exit ticket) — so the
 * standard cannot drift between them. Do not weaken this for a tool.
 */
export const WL_ACCURACY = `CRITICAL — TARGET-LANGUAGE ACCURACY GUARDRAIL:
- Do NOT generate long, native-speaker-quality passages, essays, or extended texts in the target language — you cannot verify their accuracy.
- Frame ALL instructions, activity descriptions, and teacher notes in ENGLISH. Supply only SHORT, high-frequency example vocabulary and phrases in the target language (a handful), each with an English gloss.
- Keep example language simple and checkable; avoid idioms, complex grammar, or invented forms. If unsure of a form, describe the FUNCTION in English (e.g., "a greeting appropriate to time of day") rather than guessing.
- ALL target-language content must be verified by the teacher (or a native-speaker/heritage resource) for spelling, grammar, register, and cultural appropriateness before use — especially for less commonly taught languages. For American Sign Language, give items as English glosses, not written words.`
