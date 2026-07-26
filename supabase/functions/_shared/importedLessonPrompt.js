// Import & Enhance — reformat a teacher's pasted lesson into a structured,
// standards-aligned lesson object.
//
// The original six modules (PE, Adaptive PE, Art, Music, Library, STEM) reformat
// into the PE-style PlanBook schema (buildPlanBookImportPrompt below). The newer
// content-lesson modules each have their OWN output shape (World Languages' 5 Cs,
// Theater/Dance's Artistic Processes, JROTC's LET structure, …). Rather than
// re-author and maintain those schemas here (which would drift from each
// generator), we REUSE each module's own generator system prompt — it already
// defines that module's exact schema, standards, and rules — and simply swap the
// user turn from "generate a new lesson" to "reformat and enhance THIS pasted
// lesson". So an imported lesson lands in its own module's correct structure and
// renders with that module's renderer.
//
// Non-evaluative / clinical modules (OT, PT, SLP, TVI, D/HH, School Counselors,
// Intervention Planning, SST) are intentionally NOT offered: they produce activity
// ideas / session plans / single tiered plans tied to individual goals, not
// reusable "lessons" a teacher would paste to reformat.
import { buildTheaterPrompt } from "./theaterPrompt.js";
import { buildDancePrompt } from "./dancePrompt.js";
import { buildWorldLanguagesPrompt, buildWorldLanguagesSchema } from "./worldLanguagesPrompt.js";
import { buildJrotcPrompt } from "./jrotcPrompt.js";
import { buildElementaryTechPrompt } from "./elementaryTechPrompt.js";
import { buildEslSpecialistPrompt } from "./eslSpecialistPrompt.js";
import { buildGiftedTalentedPrompt } from "./giftedTalentedPrompt.js";
import { buildSpecialEducationPrompt } from "./specialEducationPrompt.js";

// Numeric K-12 grade → the band string the newer builders expect.
function numToBand(n) {
  if (n == null) return "9-12";
  if (n <= 2) return "k-2";
  if (n <= 5) return "3-5";
  if (n <= 8) return "6-8";
  return "9-12";
}

// The import task's USER turn. Each per-module SYSTEM prompt (reused from that
// module's generator) already defines the exact output schema + rules; here we
// only redirect the model from "invent a new lesson" to "reformat and enhance
// THIS pasted lesson," preserving the teacher's content and detecting
// module-specific specifics (theme, level, artistic process, …) from it.
function importUser(subject, rawText) {
  return `You are reformatting an EXISTING ${subject} lesson that a teacher pasted below — you are NOT inventing a new one.

Follow the output schema and all rules in your system instructions EXACTLY. Reorganize the teacher's pasted content into that schema and ENHANCE it: add the standards, vocabulary, learning targets/objectives, and any required structural fields that are missing, inferring them from the pasted content and the grade level. Detect the lesson's real focus, level, and any module-specific specifics (topic/theme, artistic process, content area, etc.) FROM the pasted content and reflect them accurately in the output.

Preserve the teacher's original activities, sequence, and intent — enhance and organize, do not replace their ideas. If something doesn't map cleanly to a field, keep it in the closest field or a teacher-notes field. Output ONLY the JSON object described in your instructions.

Pasted ${subject} lesson to reformat:
---
${rawText}
---`;
}

// subject → { system, schema? } for that module, built with import-safe defaults.
// gradeBand arrives numeric; convert to a band string. Specifics that can't be
// defaulted (World Languages' target language) are threaded through; the rest the
// model detects from the pasted content. `schema` is returned only for modules
// whose generator relies on structured outputs to guarantee valid JSON — World
// Languages, whose example vocabulary carries accented / apostrophe text that
// trips the tolerant prose-JSON parser.
const MODULE_SYSTEM = {
  "Theater": ({ band }) => ({ system: buildTheaterPrompt({ gradeBand: band }).system }),
  "Dance": ({ band }) => ({ system: buildDancePrompt({ gradeBand: band }).system }),
  "World Languages": ({ band, targetLanguage }) => ({
    system: buildWorldLanguagesPrompt({ gradeBand: band, targetLanguage: targetLanguage || "Spanish" }).system,
    schema: buildWorldLanguagesSchema(),
  }),
  "JROTC": () => ({ system: buildJrotcPrompt({}).system }),
  // Elementary Technology is K-5 only; clamp any higher band into range.
  "Elementary Technology": ({ band }) => ({
    system: buildElementaryTechPrompt({ gradeBand: band === "k-2" ? "k-2" : "3-5" }).system,
  }),
  "ESL/ELL Specialist": ({ band }) => ({ system: buildEslSpecialistPrompt({ gradeBand: band }).system }),
  "Gifted & Talented": ({ band }) => ({
    system: buildGiftedTalentedPrompt({ mode: "differentiate", gradeBand: band, topic: "", contentArea: "" }).system,
  }),
  "Special Education": ({ band }) => ({
    system: buildSpecialEducationPrompt({ mode: "multitier", gradeBand: band, topic: "", contentArea: "" }).system,
  }),
};

export function buildImportedLessonPrompt({ rawText, subject, gradeBand, targetLanguage }) {
  const moduleSystem = MODULE_SYSTEM[subject];
  if (moduleSystem) {
    const band = numToBand(gradeBand);
    const { system, schema } = moduleSystem({ band, targetLanguage });
    return { system, user: importUser(subject, rawText), schema };
  }
  // Original six (PE, Adaptive PE, Art, Music, Library, STEM) + any unmapped
  // subject fall back to the PE-style PlanBook import.
  return buildPlanBookImportPrompt({ rawText, subject, gradeBand });
}

// ── Original PlanBook import (PE / Adaptive PE / Art / Music / Library / STEM) ──
function buildPlanBookImportPrompt({ rawText, subject, gradeBand }) {
  const gradeLabel = gradeBand === 0 ? 'K' : String(gradeBand);

  const system = `You are an expert curriculum specialist reformatting a teacher's existing lesson plan into a structured, standards-aligned format. Preserve the teacher's original content and intent — enhance and organize, do not replace. Add missing elements (standards, learning targets, vocabulary) based on the subject and grade level.

Return a complete lesson object as a single JSON object with this exact schema:
{
  "title": string,
  "subject": string,
  "grade_bands": [number],
  "duration_minutes": number,
  "class_size": number,
  "warm_up": string,
  "fitness_activities": string,
  "whole_group_instruction": string,
  "independent_practice": string,
  "closure": string,
  "equipment_needed": [string],
  "known_vocabulary": [string],
  "new_vocabulary": [string],
  "learning_targets": { "${gradeLabel === 'K' ? '0' : gradeBand}": string },
  "success_criteria": { "${gradeLabel === 'K' ? '0' : gradeBand}": [string, string, string] },
  "standards": [
    { "grade": number, "code": string, "text": string }
  ],
  "unit": string,
  "teacher_notes": string
}

Rules:
- Preserve the teacher's original activity descriptions — enhance the language, don't replace their ideas.
- "fitness_activities" is the main activity field for PE, Art, Library, STEM. Use "whole_group_instruction" for Music and classroom subjects. Fill whichever is appropriate.
- "standards": add 1-3 real, appropriate standards for this subject and grade. Use SHAPE America for PE, NCAS for Art, ISTE/AASL for Library, Next Gen Science for STEM, CCSS for ELA/Math.
- "duration_minutes": estimate from the lesson content if not stated.
- "unit": infer from lesson content if not stated.
- "teacher_notes": note anything preserved from the original that might need the teacher's review.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Reformat and enhance this existing ${subject} lesson for Grade ${gradeLabel}:

---
${rawText}
---

Return the JSON object now.`;

  return { system, user };
}
