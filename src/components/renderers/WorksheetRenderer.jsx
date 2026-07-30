import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Scissors } from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const FORMAT_LABELS = {
  fill_blank: 'Fill in the Blank',
  word_search: 'Word Search',
  matching: 'Matching',
  research: 'Research Sheet',
  cut_paste: 'Cut & Paste',
  multiple_choice: 'Multiple Choice Practice',
  labeling: 'Labeling',
}

// Stable shuffle (Fisher–Yates) — memoized by callers so order holds across renders.
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build a word-search grid from a vocabulary list (client-side — far more
// reliable than asking the model for valid coordinates). Forward directions
// only (E, S, SE, NE) to stay kid-friendly.
function buildWordSearch(words) {
  const cleaned = [...new Set((words ?? [])
    .map((w) => String(w).toUpperCase().replace(/[^A-Z]/g, ''))
    .filter((w) => w.length >= 3 && w.length <= 14))]
  if (cleaned.length === 0) return { grid: [], placed: [] }
  const longest = Math.max(10, ...cleaned.map((w) => w.length))
  const totalLen = cleaned.reduce((n, w) => n + w.length, 0)
  const size = Math.min(18, Math.max(longest + 1, Math.ceil(Math.sqrt(totalLen) * 1.7)))
  const grid = Array.from({ length: size }, () => Array(size).fill(null))
  const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1]]
  const placed = []
  for (const word of cleaned) {
    let ok = false
    for (let tries = 0; tries < 250 && !ok; tries++) {
      const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)]
      const len = word.length
      const rMin = dr < 0 ? len - 1 : 0
      const rMax = dr > 0 ? size - len : size - 1
      const cMax = dc > 0 ? size - len : size - 1
      if (rMax < rMin || cMax < 0) continue
      const r0 = rMin + Math.floor(Math.random() * (rMax - rMin + 1))
      const c0 = Math.floor(Math.random() * (cMax + 1))
      let fits = true
      for (let i = 0; i < len; i++) {
        const cur = grid[r0 + dr * i][c0 + dc * i]
        if (cur && cur !== word[i]) { fits = false; break }
      }
      if (!fits) continue
      for (let i = 0; i < len; i++) grid[r0 + dr * i][c0 + dc * i] = word[i]
      placed.push(word); ok = true
    }
  }
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!grid[r][c]) grid[r][c] = A[Math.floor(Math.random() * 26)]
  return { grid, placed }
}

function WriteLines({ n = 3 }) {
  return (
    <div className="mt-2 space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="border-b border-ink-800/70" />
      ))}
    </div>
  )
}

function SectionCard({ title, format, instructions, children, first }) {
  return (
    <section className="card p-6 space-y-4" style={first ? undefined : { breakBefore: 'page' }}>
      <div className="border-b border-ink-900 pb-3">
        <span className="label-eyebrow text-ink-500">{FORMAT_LABELS[format] ?? format}</span>
        <h3 className="text-lg font-semibold text-ink-50">{title}</h3>
        {instructions && <p className="mt-1 text-sm text-ink-400">{instructions}</p>}
      </div>
      {children}
    </section>
  )
}

function FillBlank({ f }) {
  return (
    <ol className="space-y-4">
      {(f.items ?? []).map((it, i) => (
        <li key={i} className="text-sm text-ink-100 leading-relaxed">
          <span className="font-medium text-ink-400">{i + 1}.</span>{' '}
          {String(it.text ?? '').split('____').map((part, pi, arr) => (
            <span key={pi}>
              {part}
              {pi < arr.length - 1 && <span className="inline-block w-28 border-b border-ink-500 align-baseline mx-1" />}
            </span>
          ))}
        </li>
      ))}
    </ol>
  )
}

function WordSearch({ f }) {
  const { grid, placed } = useMemo(() => buildWordSearch(f.words), [f.words])
  if (!grid.length) return <p className="text-sm text-ink-500">Not enough vocabulary for a word search.</p>
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))` }}>
          {grid.flatMap((row, r) => row.map((ch, c) => (
            <span key={`${r}-${c}`} className="flex h-6 w-6 items-center justify-center font-mono text-sm text-ink-200 select-none">
              {ch}
            </span>
          )))}
        </div>
      </div>
      <div>
        <p className="label-eyebrow text-ink-500 mb-1">Find these words:</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {placed.map((w) => (
            <span key={w} className="text-sm text-ink-300 uppercase tracking-wide">{w}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Matching({ f }) {
  const pairs = f.pairs ?? []
  const shuffledDefs = useMemo(() => shuffle(pairs.map((p, i) => ({ ...p, _orig: i }))), [pairs])
  return (
    <div className="grid grid-cols-2 gap-6">
      <ol className="space-y-3">
        {pairs.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-ink-100">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-ink-700 text-xs text-ink-400" />
            <span className="font-medium">{i + 1}. {p.term}</span>
          </li>
        ))}
      </ol>
      <ol className="space-y-3">
        {shuffledDefs.map((p, i) => (
          <li key={i} className="text-sm text-ink-300">
            <span className="font-medium text-ink-400">{LETTERS[i]}.</span> {p.definition}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Research({ f }) {
  return (
    <div className="space-y-4">
      {f.overview && <p className="text-sm text-ink-300 italic">{f.overview}</p>}
      <ol className="space-y-5">
        {(f.questions ?? []).map((q, i) => (
          <li key={i}>
            <p className="text-sm font-medium text-ink-100">{i + 1}. {q}</p>
            <WriteLines n={2} />
          </li>
        ))}
      </ol>
      {Array.isArray(f.sources) && f.sources.length > 0 && (
        <p className="text-xs text-ink-500">Where to look: {f.sources.join(' · ')}</p>
      )}
    </div>
  )
}

function CutPaste({ f }) {
  const isSort = f.mode === 'sort'
  const pieces = useMemo(() => {
    const items = isSort
      ? (f.categories ?? []).flatMap((c) => c.items ?? [])
      : (f.items ?? [])
    return shuffle(items)
  }, [f, isSort])
  // Glue-box height scales to the fullest category so the physical cut-out cards
  // actually fit: ~0.62in per card (cards can be full sentences → wrap to 2 lines)
  // plus padding, floored at 2.5in and capped at 5in.
  const cats = f.categories ?? []
  const maxPerCat = cats.reduce((m, c) => Math.max(m, c.items?.length ?? 0), 0)
  const boxMinIn = Math.min(5, Math.max(2.5, maxPerCat * 0.62 + 0.4))
  return (
    <div className="space-y-5">
      {isSort ? (
        <div className="grid grid-cols-2 gap-4 break-inside-avoid">
          {cats.map((c, i) => (
            <div key={i} className="break-inside-avoid rounded-lg border-2 border-dashed border-ink-400 p-3">
              <p className="text-center text-sm font-semibold text-ink-100">{c.name}</p>
              <div className="mt-2" style={{ minHeight: `${boxMinIn}in` }} />
            </div>
          ))}
        </div>
      ) : (
        <ol className="space-y-3">
          {(f.items ?? []).map((_, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-sm font-semibold text-ink-400">{i + 1}.</span>
              <div className="h-11 flex-1 rounded-lg border-2 border-dashed border-ink-400" />
            </li>
          ))}
        </ol>
      )}
      <div>
        <p className="mb-2 flex items-center gap-1.5 label-eyebrow text-ink-500"><Scissors size={12} /> Cut these out</p>
        <div className="grid grid-cols-2 gap-3">
          {pieces.map((p, i) => (
            <span key={i} className="break-inside-avoid rounded-md border-2 border-ink-400 px-3 py-2 text-sm text-ink-100">{p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function MultipleChoice({ f }) {
  return (
    <ol className="space-y-5">
      {(f.questions ?? []).map((q, qi) => (
        <li key={qi}>
          <p className="text-sm font-medium text-ink-100">{qi + 1}. {q.question}</p>
          <ul className="mt-2 space-y-1.5 pl-5">
            {(q.options ?? []).map((opt, oi) => (
              <li key={oi} className="text-sm text-ink-300">
                <span className="font-medium text-ink-400">{LETTERS[oi]}.</span> {opt}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

function Labeling({ f }) {
  const labels = f.labels ?? []
  const bank = useMemo(() => (f.word_bank ? shuffle(labels) : null), [f.word_bank, labels])
  return (
    <div className="space-y-4">
      {/* Compact teacher note (what to draw/project) — not the student's writing area. */}
      {f.diagram && (
        <p className="text-xs leading-snug text-ink-500">
          <span className="font-semibold text-ink-400">Teacher:</span> draw, project, or paste the diagram in the box below — {f.diagram}
        </p>
      )}
      {/* Diagram area — real room for the picture students label. */}
      <div className="flex items-center justify-center rounded-lg border-2 border-ink-400 min-h-[2in] text-xs uppercase tracking-wide text-ink-500">
        Diagram area
      </div>
      {/* Write-lines — full width, tall, dark: room for a K–2 student to actually write. */}
      <ol className="space-y-4">
        {labels.map((_, i) => (
          <li key={i} className="flex items-end gap-3">
            <span className="w-7 shrink-0 text-base font-semibold text-ink-300">{i + 1}.</span>
            <span className="h-9 flex-1 border-b-2 border-ink-400" />
          </li>
        ))}
      </ol>
      {bank && (
        <div>
          <p className="label-eyebrow text-ink-500 mb-1.5">Word Bank</p>
          <div className="flex flex-wrap gap-2">
            {bank.map((w, i) => (
              <span key={i} className="rounded-md border-2 border-ink-400 px-3 py-1.5 text-sm font-medium text-ink-100">{w}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const RENDERERS = {
  fill_blank: FillBlank,
  word_search: WordSearch,
  matching: Matching,
  research: Research,
  cut_paste: CutPaste,
  multiple_choice: MultipleChoice,
  labeling: Labeling,
}

// Answer key lines per format (returns [] when a format has no meaningful key).
function answerLines(f) {
  switch (f.type) {
    case 'fill_blank':
      return (f.items ?? []).map((it, i) => `${i + 1}. ${it.answer}`)
    case 'matching': {
      const defs = f.pairs ?? []
      return (f.pairs ?? []).map((p, i) => `${i + 1}. ${p.term} → ${p.definition}`)
    }
    case 'multiple_choice':
      return (f.questions ?? []).map((q, i) => `${i + 1}. ${q.answer}${q.options?.[LETTERS.indexOf(q.answer)] ? ` — ${q.options[LETTERS.indexOf(q.answer)]}` : ''}`)
    case 'labeling':
      return (f.labels ?? []).map((l, i) => `${i + 1}. ${l}`)
    case 'cut_paste':
      return f.mode === 'sort'
        ? (f.categories ?? []).map((c) => `${c.name}: ${(c.items ?? []).join(', ')}`)
        : (f.items ?? []).map((it, i) => `${i + 1}. ${it}`)
    case 'word_search':
      return (f.words ?? []).map((w) => String(w).toUpperCase())
    default:
      return []
  }
}

export default function WorksheetRenderer({ worksheet }) {
  const [showAnswers, setShowAnswers] = useState(false)
  const formats = (worksheet?.formats ?? [])
  const applicable = formats.filter((f) => f.applicable !== false && RENDERERS[f.type])
  const skipped = formats.filter((f) => f.applicable === false)
  if (formats.length === 0) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {applicable.map((f, idx) => {
        const Body = RENDERERS[f.type]
        return (
          <SectionCard key={f.type + idx} title={f.title ?? FORMAT_LABELS[f.type]} format={f.type} instructions={f.instructions} first={idx === 0}>
            <Body f={f} />
          </SectionCard>
        )
      })}

      {skipped.length > 0 && (
        <div className="rounded-lg border border-ink-800 bg-ink-900/40 px-4 py-3 no-print">
          <p className="label-eyebrow text-ink-500 mb-1">Not generated for this lesson</p>
          {skipped.map((f, i) => (
            <p key={i} className="text-xs text-ink-500">
              <span className="text-ink-400">{FORMAT_LABELS[f.type] ?? f.type}:</span> {f.reason || 'not a fit for this lesson’s content.'}
            </p>
          ))}
        </div>
      )}

      {/* Answer key — collapsible, hidden on print */}
      {applicable.some((f) => answerLines(f).length > 0) && (
        <div className="card p-6 space-y-4 no-print">
          <button onClick={() => setShowAnswers((v) => !v)} className="flex w-full items-center justify-between text-left">
            <h2 className="label-eyebrow text-ink-400">Answer Key</h2>
            {showAnswers ? <ChevronUp size={16} className="text-ink-500" /> : <ChevronDown size={16} className="text-ink-500" />}
          </button>
          {showAnswers && (
            <div className="space-y-5 border-t border-ink-900 pt-4">
              {applicable.map((f, i) => {
                const lines = answerLines(f)
                if (!lines.length) return null
                return (
                  <div key={i} className="space-y-1">
                    <p className="text-sm font-semibold text-ink-200">{f.title ?? FORMAT_LABELS[f.type]}{f.type === 'word_search' ? ' (words hidden in the grid)' : ''}</p>
                    <ul className="space-y-0.5">
                      {lines.map((l, li) => <li key={li} className="text-sm text-ink-300">{l}</li>)}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
