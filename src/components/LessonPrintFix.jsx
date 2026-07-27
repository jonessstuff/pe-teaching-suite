import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// One shared print-fix component + helpers, mounted ONCE in LessonDetail (the
// single shared wrapper for /lessons/:id across all ~30 modules). No per-renderer
// code. See src/styles/print.css for the global print rules.

const TEACHER_INFO_KEY = 'printTeacherInfo'

// ─── hedge stripping (display-time cleanup of ALREADY-SAVED lessons) ───────────
// Removes a TRAILING generator hedge parenthetical like "(verify against official
// standards)" or "(if applicable)". Deliberately conservative — it only strips a
// trailing ( … ) whose contents match a known hedge phrase, so real parentheticals
// such as "Cones (12)" or "(K–2)" are left untouched. New lessons are fixed at the
// prompt level; this only sanitizes old saved lessons at display time (never
// persisted). NOTE: a standalone `state_verification_note` field is a whole note,
// not a parenthetical, so this does not touch it.
const HEDGE_PAREN = /\s*\((?:[^()]*\b(?:verif\w*|if applicable|as applicable|where applicable|check (?:with|your|the|against)|consult|confirm (?:with|your|against)|subject to change|adjust (?:to|for) your|align(?:ed)? to your)\b[^()]*)\)\s*$/i

export function stripHedges(text) {
  if (typeof text !== 'string') return text
  let out = text
  let prev
  do { prev = out; out = out.replace(HEDGE_PAREN, '') } while (out !== prev)
  return out.trimEnd()
}

// ─── "include my name on printed lessons" preference ───────────────────────────
export function getPrintTeacherInfo() {
  try { return localStorage.getItem(TEACHER_INFO_KEY) === 'true' } catch { return false }
}

export function PrintTeacherInfoToggle() {
  const [on, setOn] = useState(getPrintTeacherInfo)
  function toggle(next) {
    setOn(next)
    try { localStorage.setItem(TEACHER_INFO_KEY, next ? 'true' : 'false') } catch { /* private browsing */ }
  }
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => toggle(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
      />
      <div>
        <span className="text-sm font-medium text-ink-200">Include my name on printed lessons</span>
        <p className="mt-0.5 text-xs text-ink-400">
          Adds a &ldquo;Prepared by&rdquo; line to the printed header. Off by default.
        </p>
      </div>
    </label>
  )
}

// ─── client field resolver ─────────────────────────────────────────────────────
// serializeLessonForTools is a Deno edge-function module (server-only) and returns
// a prompt blob, not structured fields — so it can't be reused here. This resolves
// the header fields across every module's shape: row columns first, then
// lesson_object fallbacks (band_label, session_length_minutes, age_group, unit).
function fmtGrades(gb) {
  if (!Array.isArray(gb)) return null
  const list = gb.filter((g) => g !== null && g !== undefined && g !== '').map((g) => (g === 0 ? 'K' : String(g)))
  if (!list.length) return null
  return list.length === 1 ? `Grade ${list[0]}` : `Grades ${list.join(', ')}`
}

// CTE has no grade_bands/band_label — it uses tier (ms/hs) + level. JROTC uses
// let_level. Map those to a readable "grade" equivalent so those modules still
// get a meaningful header line.
function fmtTier(tier, level) {
  if (!tier) return null
  const t = tier === 'hs' ? 'High School' : tier === 'ms' ? 'Middle School' : String(tier).trim()
  const lvl = level ? String(level).trim() : ''
  return lvl ? `${t} · ${lvl.charAt(0).toUpperCase()}${lvl.slice(1)}` : t
}

function resolveFields(lesson) {
  const lo = (lesson && lesson.lesson_object) || lesson || {}
  const str = (v) => (v == null ? '' : String(v).trim())
  const title = str(lesson?.title) || str(lo.title) || null
  const subject = str(lesson?.subject) || str(lo.subject) || null
  const grade =
    str(lo.band_label) ||
    fmtGrades(lesson?.grade_bands ?? lo.grade_bands) ||
    str(lo.age_group) ||
    fmtTier(lo.tier, lo.level) ||   // CTE
    str(lo.let_level) ||            // JROTC
    null
  const durMin = lesson?.duration_minutes ?? lo.duration_minutes ?? lo.session_length_minutes ?? null
  const duration = durMin ? `${durMin} min` : null
  const period = str(lesson?.period_label) || null
  const unit = str(lo.unit) || null
  return { title, subject, grade, duration, period, unit }
}

// ─── the one print-header component ────────────────────────────────────────────
export default function LessonPrintFix({ lesson }) {
  const { title, subject, grade, duration, period, unit } = resolveFields(lesson)

  // The browser's own print header/footer prints document.title. Swap it to the
  // lesson name while this view is mounted; restore the app title on unmount.
  useEffect(() => {
    if (!title) return
    const prev = document.title
    document.title = title
    return () => { document.title = prev }
  }, [title])

  // Optional "Prepared by" line — only fetched/shown when the teacher opted in.
  const [teacher, setTeacher] = useState('')
  const wantTeacher = getPrintTeacherInfo()
  useEffect(() => {
    if (!wantTeacher) return
    let cancelled = false
    ;(async () => {
      try {
        const { data: u } = await supabase.auth.getUser()
        if (!u?.user || cancelled) return
        const { data: p } = await supabase.from('profiles').select('full_name').eq('id', u.user.id).single()
        if (!cancelled) setTeacher((p?.full_name ?? '').trim())
      } catch { /* offline / signed out — just skip the line */ }
    })()
    return () => { cancelled = true }
  }, [wantTeacher])

  // Bullet-joined meta line; every missing field is skipped silently.
  const meta = [subject, grade, duration, period, unit].filter(Boolean).join('  •  ')

  return (
    <div className="lesson-print-header">
      {title && (
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#000', lineHeight: 1.25 }}>{title}</div>
      )}
      {meta && (
        <div style={{ fontSize: '12px', color: '#333', marginTop: '4px' }}>{meta}</div>
      )}
      {wantTeacher && teacher && (
        <div style={{ fontSize: '12px', color: '#333', marginTop: '2px' }}>Prepared by {teacher}</div>
      )}
      <hr style={{ border: 'none', borderTop: '1px solid #999', margin: '10px 0 14px' }} />
    </div>
  )
}
