/**
 * Keep teacher-entered student display names out of model prompts.
 *
 * The edge function may receive a display name because it is already part of
 * the teacher's secured PlansK12 record. Before calling the model, replace it
 * with a deterministic alias. After generation, restore the display name in
 * the returned teacher-facing artifact without asking the model to process it.
 */

function replaceAll(value, from, to) {
  if (typeof value !== "string" || !from) return value
  return value.split(from).join(to)
}

export function restorePrivateLabels(value, replacements = []) {
  const ordered = [...replacements]
    .filter(([alias, display]) => alias && display)
    .sort(([a], [b]) => b.length - a.length)

  if (typeof value === "string") {
    return ordered.reduce((text, [alias, display]) => replaceAll(text, alias, display), value)
  }
  if (Array.isArray(value)) {
    return value.map((item) => restorePrivateLabels(item, ordered))
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, restorePrivateLabels(item, ordered)]),
    )
  }
  return value
}

export function anonymizeStudentName(studentName, alias = "Student A") {
  const displayName = typeof studentName === "string" ? studentName.trim() : ""
  return {
    promptName: displayName ? alias : "",
    replacements: displayName ? [[alias, displayName]] : [],
  }
}

export function anonymizeStudentSupports(students = []) {
  const replacements = []
  const promptStudents = (Array.isArray(students) ? students : []).map((student, index) => {
    const alias = `Student ${index + 1}`
    const displayName = typeof student?.name_or_initials === "string"
      ? student.name_or_initials.trim()
      : ""
    if (displayName) replacements.push([alias, displayName])
    return {
      ...student,
      name_or_initials: alias,
    }
  })

  return { promptStudents, replacements }
}

export function redactKnownName(text, displayName, alias = "Student A") {
  if (typeof text !== "string" || !displayName?.trim()) return text
  return replaceAll(text, displayName.trim(), alias)
}
