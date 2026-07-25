// Minor words that stay lowercase unless they're the first word of the title.
const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'of', 'to', 'in', 'on', 'at',
  'for', 'vs', 'v', 'with', 'by', 'from', 'as', 'per',
])

/**
 * Title-cases a lesson title while respecting how teachers actually type.
 *
 * - Leaves any token that already contains an uppercase letter untouched, so
 *   acronyms (PE, CTE, SOL, IEP, ELL, STEM, TK) and intentional casing survive.
 * - Only fixes all-lowercase words, capitalizing the first letter.
 * - Keeps common minor words lowercase unless they lead the title.
 *
 * e.g. "soccer Day 1" -> "Soccer Day 1", "the science of PE" -> "The Science of PE".
 */
export function smartTitleCase(input) {
  if (!input || typeof input !== 'string') return input
  const words = input.trim().split(/\s+/)
  return words
    .map((w, i) => {
      if (/[A-Z]/.test(w)) return w // preserve acronyms / intentional casing
      const lower = w.toLowerCase()
      if (i !== 0 && MINOR_WORDS.has(lower)) return lower
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}
