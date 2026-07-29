import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { BookMarked, Sparkles, Loader2, Printer, ArrowLeft, Save, FolderOpen } from 'lucide-react'
import {
  generateLesson,
  generateLibraryLesson,
  generateArtLesson,
  generateMusicLesson,
  generateStemLesson,
  generateTheater,
  generateDance,
  generateWorldLanguages,
  generateJrotc,
  generateElementaryTech,
  generateEslSpecialist,
  generateGiftedTalented,
  generateSpecialEducation,
  generateCteLesson,
  generateReadingSpecialist,
  generateMathSpecialist,
  generateEarlyChildhood,
} from '../services/generationService'
import { createBinder } from '../services/subBinderService'
import { US_STATES } from '../constants/usStates'
import SubBinderRenderer from '../components/renderers/SubBinderRenderer'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'

// ── Constants ──────────────────────────────────────────────────────────────

// Original six modules use the PE-shaped generator path (numeric grade + a single
// `topic` prompt). Grouped separately in the dropdown from the newer modules,
// which each call their OWN generator with that generator's real required params
// (see NEWER_SUBJECTS + callNewerDayGenerator). Non-evaluative / clinical modules
// (OT, PT, SLP, TVI, D/HH, School Counselors, Intervention, SST) are intentionally
// NOT offered: they serve an IEP caseload or produce single plans, not a day-by-day
// class sequence a substitute runs — the Sub Binder concept doesn't fit them.
const CORE_SUBJECTS = ['PE & Health', 'Library & Media', 'Art', 'Music', 'STEM', 'Adaptive PE']

// Newer content-lesson modules → how to collect the grade and which extra
// required params to gather. grade: 'k12' | 'k5' numeric toggle, or 'none' for
// modules that use their OWN level model instead of a K-12 grade (JROTC LET
// level, CTE tier, Early Childhood age group). Each subject key is the canonical
// lesson_object.subject string (must match LESSON_RENDERERS for correct display).
const NEWER_SUBJECTS = {
  'Theater':               { grade: 'k12', extras: [] },
  'Dance':                 { grade: 'k12', extras: [] },
  'World Languages':       { grade: 'k12', extras: ['targetLanguage', 'wlLevel'] },
  'JROTC':                 { grade: 'none', extras: ['letLevel'] },
  'Elementary Technology': { grade: 'k5',  extras: [] },
  'ESL/ELL Specialist':    { grade: 'k12', extras: [] },
  'Gifted & Talented':     { grade: 'k12', extras: [] },
  'Special Education':     { grade: 'k12', extras: [] },
  'CTE':                   { grade: 'none', extras: ['cte'] },
  'Reading Specialists':   { grade: 'k12', extras: ['readingSkill'] },
  'Math Specialists':      { grade: 'k12', extras: [] },
  'Early Childhood':       { grade: 'none', extras: ['ecAge'] },
}

// Per-module option lists (mirrors each module's own generator form).
const CTE_PATHWAYS = [
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'human_services', label: 'Human Services / FCS' },
  { value: 'health_science', label: 'Health Science' },
  { value: 'education', label: 'Education & Training' },
  { value: 'career_readiness', label: 'Career Readiness' },
  { value: 'information_technology', label: 'Information Technology' },
  { value: 'transportation', label: 'Transportation, Distribution & Logistics' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'engineering_tech', label: 'STEM / Engineering & Technology' },
  { value: 'business_mgmt', label: 'Business Management & Administration' },
  { value: 'agriculture', label: 'Agriculture, Food & Natural Resources' },
  { value: 'construction', label: 'Architecture & Construction' },
  { value: 'arts_av', label: 'Arts, A/V Technology & Communications' },
  { value: 'government', label: 'Government & Public Administration' },
  { value: 'law_safety', label: 'Law, Public Safety, Corrections & Security' },
]
const CTE_LEVELS = [
  { value: 'introductory', label: 'Introductory' },
  { value: 'concentrator', label: 'Concentrator' },
  { value: 'completer', label: 'Completer' },
]
const READING_SKILLS = [
  'Phonological & Phonemic Awareness',
  'Phonics & Word Recognition (Decoding)',
  'Reading Fluency',
  'Vocabulary',
  'Reading Comprehension',
  'Written Expression',
]
const EC_AGE_GROUPS = [
  { value: 'toddler', label: 'Toddlers (about 2s)' },
  { value: 'preschool3', label: 'Preschool (3s)' },
  { value: 'prek4', label: 'Pre-K (4s)' },
  { value: 'tk5', label: 'Transitional K (older 5s)' },
]

const SUBJECTS = [...CORE_SUBJECTS, ...Object.keys(NEWER_SUBJECTS)]

// Numeric K-12 grade → the band string the newer generators expect.
function numToBand(n) {
  if (n == null) return '9-12'
  if (n <= 2) return 'k-2'
  if (n <= 5) return '3-5'
  if (n <= 8) return '6-8'
  return '9-12'
}

// 'k12' | 'k5' | 'none' — which grade input a subject uses.
function gradeModel(subject) {
  if (NEWER_SUBJECTS[subject]) return NEWER_SUBJECTS[subject].grade
  return isK12Subject(subject) ? 'k12' : 'k5'
}

const WEEK_OPTIONS = [1, 2, 3, 4, 6, 8]

const STEM_FOCUS_AREAS = [
  { value: 'engineering', label: 'Engineering Design' },
  { value: 'coding', label: 'Coding & CS' },
  { value: 'science', label: 'Science Investigation' },
  { value: 'maker', label: 'Maker / Tinkering' },
]

const K5_GRADES = [
  { value: 0, label: 'K' }, { value: 1, label: '1' }, { value: 2, label: '2' },
  { value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' },
]

const K12_GRADES = [
  { value: 0, label: 'K' }, { value: 1, label: '1' }, { value: 2, label: '2' },
  { value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' },
  { value: 6, label: '6' }, { value: 7, label: '7' }, { value: 8, label: '8' },
  { value: 9, label: '9' }, { value: 10, label: '10' }, { value: 11, label: '11' },
  { value: 12, label: '12' },
]

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// URL slug → subject name (used when home page cards link with ?subject=)
const SUBJECT_FROM_SLUG = {
  'pe-health': 'PE & Health',
  'library': 'Library & Media',
  'art': 'Art',
  'music': 'Music',
  'stem': 'STEM',
  'adaptive-pe': 'Adaptive PE',
  'theater': 'Theater',
  'dance': 'Dance',
  'world-languages': 'World Languages',
  'jrotc': 'JROTC',
  'elementary-tech': 'Elementary Technology',
  'esl-specialist': 'ESL/ELL Specialist',
  'gifted-talented': 'Gifted & Talented',
  'special-education': 'Special Education',
  'cte': 'CTE',
  'reading-specialists': 'Reading Specialists',
  'math-specialists': 'Math Specialists',
  'early-childhood': 'Early Childhood',
}

// Subject → back-home path for the result toolbar
const SUBJECT_HOME_PATH = {
  'PE & Health': '/pe-health',
  'Library & Media': '/library',
  'Art': '/art',
  'Music': '/music',
  'STEM': '/stem',
  'Adaptive PE': '/pe-health',
  'Theater': '/theater',
  'Dance': '/dance',
  'World Languages': '/world-languages',
  'JROTC': '/jrotc',
  'Elementary Technology': '/elementary-tech',
  'ESL/ELL Specialist': '/esl-specialist',
  'Gifted & Talented': '/gifted-talented',
  'Special Education': '/special-education',
  'CTE': '/cte',
  'Reading Specialists': '/reading-specialists',
  'Math Specialists': '/math-specialists',
  'Early Childhood': '/early-childhood',
}

const LET_LEVELS = ['LET 1', 'LET 2', 'LET 3', 'LET 4']

function isK12Subject(subj) {
  return subj === 'PE & Health' || subj === 'Adaptive PE'
}

// ── Grade toggle ───────────────────────────────────────────────────────────

function GradeToggle({ options, selected, onChange, accent }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
            selected === value
              ? `${accent} text-white`
              : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Prior-context builder ──────────────────────────────────────────────────

function buildPriorContext(allDays) {
  // Limit to last 10 days to avoid bloating the prompt for long absences
  const recent = allDays.slice(-10)
  const offset = allDays.length - recent.length
  return recent.map((lesson, i) => {
    const absIdx = offset + i
    const dayName = DAY_NAMES[absIdx % 5]
    const weekNum = Math.floor(absIdx / 5) + 1
    const snippet = (
      (lesson.warm_up ?? '') + ' ' + (lesson.fitness_activities ?? '')
    ).trim().slice(0, 120)
    return `Wk${weekNum} ${dayName}: "${lesson.title || `Lesson ${absIdx + 1}`}" — ${snippet}`
  }).join('\n')
}

// ── Generator dispatch ─────────────────────────────────────────────────────

async function callDayGenerator(subject, stemFocusArea, payload) {
  switch (subject) {
    case 'Library & Media':
      return generateLibraryLesson(payload)
    case 'Art':
      return generateArtLesson(payload)
    case 'Music':
      return generateMusicLesson(payload)
    case 'STEM':
      return generateStemLesson({ focusArea: stemFocusArea, ...payload })
    default:
      // PE & Health and Adaptive PE both use the general lesson generator
      return generateLesson({ subject, ...payload })
  }
}

// Per-module orchestration for the newer modules. Each calls its OWN generator
// with that generator's real required params (band string, target language, LET
// level, mode, …) rather than forcing the PE-shaped payload through. `focus` is
// the day's instructional topic + sequence position; `notes` carries the
// substitute framing + class routines. `band` is unused for JROTC (HS/letLevel).
async function callNewerDayGenerator(subject, { band, focus, notes, duration, classSize, state, extra }) {
  switch (subject) {
    case 'Theater':
      return generateTheater({ gradeBand: band, artisticProcess: 'creating', hsTier: 'proficient', focus, durationMinutes: duration, teacherNotes: notes })
    case 'Dance':
      return generateDance({ gradeBand: band, artisticProcess: 'creating', hsTier: 'proficient', focus, durationMinutes: duration, teacherNotes: notes })
    case 'World Languages':
      return generateWorldLanguages({ targetLanguage: extra.targetLanguage, gradeBand: band, proficiencyLevel: extra.wlLevel, theme: focus, sessionLengthMinutes: duration, teacherNotes: notes })
    case 'JROTC':
      return generateJrotc({ topic: focus, letLevel: extra.letLevel, contentArea: 'leadership_fundamentals', durationMinutes: duration, notes })
    case 'Elementary Technology':
      return generateElementaryTech({ topic: focus, gradeBand: band, contentArea: '', durationMinutes: duration, teacherNotes: notes })
    case 'ESL/ELL Specialist':
      return generateEslSpecialist({ topic: focus, gradeBand: band, proficiencyLevel: 'developing', contentArea: '', durationMinutes: duration, homeLanguages: '', teacherNotes: notes })
    case 'Gifted & Talented':
      return generateGiftedTalented({ mode: 'differentiate', gradeBand: band, topic: focus, contentArea: '', teacherNotes: notes })
    case 'Special Education':
      return generateSpecialEducation({ mode: 'multitier', gradeBand: band, topic: focus, contentArea: '', teacherNotes: notes })
    case 'CTE':
      // Uses tier/level + a pathway instead of a K-12 grade.
      return generateCteLesson({
        pathway: extra.ctePathway, tier: extra.cteTier, level: extra.cteTier === 'hs' ? extra.cteLevel : '',
        topic: focus, materials: [], classSize, durationMinutes: duration, targetCompetency: '', state,
        sessionNumber: 0, totalSessions: 0, includeELL: false,
      })
    case 'Reading Specialists':
      // Whole-class mode (a substitute covers scheduled group lessons, not 1:1 tutoring).
      return generateReadingSpecialist({ skillArea: extra.readingSkill, gradeBand: band, focus, durationMinutes: duration, groupSize: 'Whole class', studentPattern: '', teacherNotes: notes, handsOn: false })
    case 'Math Specialists':
      // Whole-class differentiation; domain auto-detected from the day's topic.
      return generateMathSpecialist({ topic: focus, gradeBand: band, domain: '', setting: 'differentiation', focus: '', durationMinutes: duration, studentContext: '', teacherNotes: notes, handsOn: false })
    case 'Early Childhood':
      // Age-group based (no K-12 grade); the day's topic becomes the study theme.
      return generateEarlyChildhood({ studyTheme: focus, ageGroup: extra.ecAgeGroup, programType: 'general', teacherNotes: notes })
    default:
      throw new Error(`Sub Binder does not support module: ${subject}`)
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SubBinderGenerator() {
  const { isTrial, isExpired, openPaywall } = useTrial()
  // Trial/expired users: generate only the first day as a preview, then paywall.
  // (Independent of the 5-export cap; replaces the old 4-week generation window.)
  const gated = isTrial || isExpired
  const weekOptions = WEEK_OPTIONS

  const [searchParams] = useSearchParams()
  const urlSlug = searchParams.get('subject')
  const preselected = SUBJECT_FROM_SLUG[urlSlug] ?? 'PE & Health'

  // Form state
  const [subject, setSubject] = useState(preselected)
  const [stemFocusArea, setStemFocusArea] = useState('engineering')
  const [gradeBands, setGradeBands] = useState(null)
  const [weekCount, setWeekCount] = useState(2)
  const [topics, setTopics] = useState('')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(45)
  const [state, setState] = useState('VA')
  const [routines, setRoutines] = useState('')
  const [emergencyNotes, setEmergencyNotes] = useState('')

  // Per-module required params (only some modules use these — see NEWER_SUBJECTS).
  const [targetLanguage, setTargetLanguage] = useState('') // World Languages
  const [wlLevel, setWlLevel] = useState('novice')         // World Languages proficiency
  const [letLevel, setLetLevel] = useState('LET 1')        // JROTC LET level
  const [ctePathway, setCtePathway] = useState('hospitality') // CTE
  const [cteTier, setCteTier] = useState('ms')                // CTE (ms | hs)
  const [cteLevel, setCteLevel] = useState('introductory')    // CTE HS course level
  const [readingSkill, setReadingSkill] = useState(READING_SKILLS[0]) // Reading Specialists
  const [ecAgeGroup, setEcAgeGroup] = useState('prek4')       // Early Childhood age group

  // Generation state
  const [view, setView] = useState('form') // 'form' | 'result'
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ week: 0, day: 0, totalWeeks: 0 })
  const [error, setError] = useState(null)
  const [binder, setBinder] = useState([])

  // Snapshot of form values captured at generation time (for renderer header)
  const [binderMeta, setBinderMeta] = useState(null)
  const [binderName, setBinderName] = useState('')
  const [savedBinderId, setSavedBinderId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error

  function handleSubjectChange(newSubject) {
    // Reset the grade selection whenever the grade INPUT model changes (K-12 ↔
    // K-5 ↔ none), so a stale grade from the previous subject can't leak through.
    if (gradeModel(subject) !== gradeModel(newSubject)) setGradeBands(null)
    setSubject(newSubject)
  }

  async function handleGenerate(e) {
    e.preventDefault()
    const model = gradeModel(subject)
    if (model !== 'none' && gradeBands === null) {
      setError('Select a grade.')
      return
    }
    if (subject === 'World Languages' && !targetLanguage.trim()) {
      setError('Enter the target language (e.g. Spanish).')
      return
    }

    const isNewer = !!NEWER_SUBJECTS[subject]
    const band = numToBand(gradeBands)
    const extra = {
      targetLanguage: targetLanguage.trim(), wlLevel, letLevel,
      ctePathway, cteTier, cteLevel, readingSkill, ecAgeGroup,
    }

    setLoading(true)
    setError(null)

    const allDays = []
    const weeks = []
    // Free trial / expired: cap generation to a single day (Week 1, Monday),
    // then the upgrade paywall covers the rest.
    const dayCap = gated ? 1 : weekCount * 5

    try {
      for (let week = 0; week < weekCount; week++) {
        const weekDays = []
        for (let day = 0; day < 5; day++) {
          if (allDays.length >= dayCap) break
          const weekNum = week + 1
          const dayName = DAY_NAMES[day]
          setProgress({ week: weekNum, day: day + 1, totalWeeks: weekCount })

          const priorContext = buildPriorContext(allDays)

          // Build topic text: inject the teacher's content plan + positional context +
          // prior lessons so the AI understands where in the sequence this day falls.
          const topicLines = [
            `Long-term substitute coverage — ${weekCount} week${weekCount !== 1 ? 's' : ''} total.`,
            '',
            'Topics and sequence for this absence:',
            topics.trim() || '(Teacher will provide topics — generate age-appropriate content for this subject.)',
            '',
            `Current position: Week ${weekNum} of ${weekCount}, ${dayName} (day ${week * 5 + day + 1} of ${weekCount * 5} total).`,
          ]

          if (priorContext) {
            topicLines.push('', 'Lessons already taught — do not repeat content already covered; build on it instead:', priorContext)
          }
          if (routines.trim()) {
            topicLines.push('', 'Key class routines and expectations for the substitute:', routines.trim())
          }
          if (emergencyNotes.trim()) {
            topicLines.push('', 'Important notes:', emergencyNotes.trim())
          }

          let lesson
          if (isNewer) {
            // Newer modules: their generators take a topic/focus + separate notes,
            // so split the instructional content from the substitute framing rather
            // than cramming everything into one PE-style `topic` blob.
            const focusLines = [
              topics.trim() || '(No specific topics given — generate an age-appropriate lesson for this subject.)',
              '',
              `This is day ${week * 5 + day + 1} of ${weekCount * 5} in a planned sequence (Week ${weekNum}, ${dayName}). Build progressively; do not repeat content already covered.`,
            ]
            if (priorContext) {
              focusLines.push('', 'Already taught (do not repeat — build on it):', priorContext)
            }
            const notesLines = [
              `This lesson is for a LONG-TERM SUBSTITUTE covering the class for ${weekCount} week${weekCount !== 1 ? 's' : ''}. Keep it self-contained and easy for a non-specialist substitute to run.`,
            ]
            if (routines.trim()) notesLines.push('', 'Class routines & expectations:', routines.trim())
            if (emergencyNotes.trim()) notesLines.push('', 'Important notes:', emergencyNotes.trim())
            lesson = await callNewerDayGenerator(subject, {
              band,
              focus: focusLines.join('\n'),
              notes: notesLines.join('\n'),
              duration,
              classSize,
              state,
              extra,
            })
          } else {
            lesson = await callDayGenerator(subject, stemFocusArea, {
              gradeBands: [gradeBands],
              topic: topicLines.join('\n'),
              classSize,
              durationMinutes: duration,
              state,
            })
          }

          allDays.push(lesson)
          weekDays.push(lesson)
        }
        if (weekDays.length > 0) weeks.push(weekDays)
        if (allDays.length >= dayCap) break
      }

      // weekCount reflects what was actually generated (1 for the gated 1-day preview).
      const totalDays = allDays.length
      const meta = { subject, weekCount: weeks.length, days: totalDays, classSize, duration, state, routines, emergencyNotes }
      setBinderMeta(meta)
      setBinder(weeks)
      setView('result')

      // Autosave on generate. A sub plan is usually made by someone sick or
      // rushed; "you have unsaved work" is a worse experience than just saving
      // it. This also fixes the data-loss bug where a gated single-day plan
      // vanished on navigate-away (it was never persisted without a manual Save).
      try {
        const isSinglePlan = totalDays === 1
        const defaultName = isSinglePlan
          ? `${subject} Sub Plan — ${new Date().toLocaleDateString()}`
          : `${subject} Sub Binder — ${weeks.length} week${weeks.length !== 1 ? 's' : ''}`
        const saved = await createBinder({
          name: defaultName,
          subject,
          binderData: { binder: weeks, meta },
        })
        setSavedBinderId(saved.id)
        setBinderName(defaultName)
        setSaveStatus('saved')
      } catch { /* non-fatal: the manual Save button stays available as a fallback */ }
    } catch (err) {
      setError(err?.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
      setProgress({ week: 0, day: 0, totalWeeks: 0 })
    }
  }

  function resetForm() {
    setView('form')
    setBinder([])
    setBinderMeta(null)
    setError(null)
    setSavedBinderId(null)
    setSaveStatus('idle')
    setBinderName('')
  }

  async function handleSaveBinder() {
    setSaveStatus('saving')
    try {
      const saved = await createBinder({
        name: binderName || `${binderMeta.subject} Sub Binder — ${binderMeta.weekCount} week${binderMeta.weekCount !== 1 ? 's' : ''}`,
        subject: binderMeta.subject,
        binderData: { binder, meta: binderMeta },
      })
      setSavedBinderId(saved.id)
      setSaveStatus('saved')
    } catch (err) {
      setError(err.message)
      setSaveStatus('idle')
    }
  }

  // ── Result view ──────────────────────────────────────────────────────────

  if (view === 'result' && binder.length > 0 && binderMeta) {
    return (
      <div>
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-4">
            <Link
              to={SUBJECT_HOME_PATH[subject] ?? '/'}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              {binderMeta.subject}
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              ← Start over
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!savedBinderId ? (
              <>
                <input value={binderName} onChange={e => setBinderName(e.target.value)}
                  placeholder="Binder name (optional)"
                  className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-amber-500 w-48" />
                <button type="button" onClick={handleSaveBinder} disabled={saveStatus === 'saving'} className="btn-secondary gap-1.5">
                  {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saveStatus === 'saving' ? 'Saving…' : 'Save binder'}
                </button>
              </>
            ) : (
              <Link to="/my-binders" className="btn-secondary gap-1.5">
                <FolderOpen size={16} /> View in My Binders
              </Link>
            )}
            <button
              type="button"
              onClick={() => (gated ? openPaywall('gated-feature') : window.print())}
              className="btn-secondary gap-1.5"
            >
              <Printer size={16} />
              Print binder
            </button>
          </div>
        </div>

        <SubBinderRenderer
          binder={binder}
          {...binderMeta}
          onUpdateDay={gated ? undefined : (wi, di, updated) =>
            setBinder((prev) =>
              prev.map((wk, w) => w !== wi ? wk : wk.map((d, dd) => dd !== di ? d : updated))
            )
          }
        />

        {gated && (
          <div className="print:hidden mt-8">
            <UpgradeBanner label="the full substitute binder" />
          </div>
        )}
      </div>
    )
  }

  // ── Form view ────────────────────────────────────────────────────────────

  const currentGradeModel = gradeModel(subject)
  const gradeOptions = currentGradeModel === 'k12' ? K12_GRADES : K5_GRADES
  const totalDays = weekCount * 5

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          All modules
        </Link>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
              <BookMarked size={18} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink-50">Long-Term Sub Binder</h1>
              <p className="text-xs text-ink-500">
                Week-by-week lesson plans for extended absences · All subjects
              </p>
            </div>
          </div>
          <Link to="/my-binders" className="btn-secondary gap-1.5 text-sm">
            <FolderOpen size={14} /> My Binders
          </Link>
        </div>
        <p className="mt-3 text-sm text-ink-400">
          Fill in your class details and topics to cover. PlansK12 generates a complete daily
          plan for every week, ready to hand to your substitute.
        </p>
        <p className="mt-3 rounded-lg border border-ink-800 bg-ink-900/40 px-3 py-2 text-xs text-ink-400">
          Out for just a day? This builds a full week or more. For a single-day absence,
          generate one lesson instead and use its <span className="font-medium text-ink-300">Generate sub plan</span> button.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">

        {/* ── Subject & focus area ─────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Subject</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="subject">
              Your subject
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="input-field"
            >
              <optgroup label="Core specials">
                {CORE_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
              <optgroup label="More modules">
                {Object.keys(NEWER_SUBJECTS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {subject === 'STEM' && (
            <div>
              <label className="mb-2 block text-sm text-ink-300">STEM focus area</label>
              <div className="flex flex-wrap gap-2">
                {STEM_FOCUS_AREAS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStemFocusArea(value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      stemFocusArea === value
                        ? 'bg-cyan-500 text-white'
                        : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {subject === 'World Languages' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-language">
                  Target language
                </label>
                <input
                  id="wl-language"
                  type="text"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  placeholder="e.g. Spanish, French, Mandarin"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-level">
                  Proficiency level
                </label>
                <select
                  id="wl-level"
                  value={wlLevel}
                  onChange={(e) => setWlLevel(e.target.value)}
                  className="input-field"
                >
                  <option value="novice">Novice</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          )}

          {subject === 'JROTC' && (
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="let-level">
                LET level
              </label>
              <select
                id="let-level"
                value={letLevel}
                onChange={(e) => setLetLevel(e.target.value)}
                className="input-field"
              >
                {LET_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-500">
                JROTC is high-school only — the LET level sets the grade span.
              </p>
            </div>
          )}

          {subject === 'CTE' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-pathway">
                  Career pathway
                </label>
                <select
                  id="cte-pathway"
                  value={ctePathway}
                  onChange={(e) => setCtePathway(e.target.value)}
                  className="input-field"
                >
                  {CTE_PATHWAYS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-ink-300">Level</label>
                <div className="flex flex-wrap gap-2">
                  {[{ value: 'ms', label: 'Middle school (exploratory)' }, { value: 'hs', label: 'High school' }].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCteTier(value)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        cteTier === value ? 'bg-amber-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {cteTier === 'hs' && (
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-level">
                    Course level
                  </label>
                  <select
                    id="cte-level"
                    value={cteLevel}
                    onChange={(e) => setCteLevel(e.target.value)}
                    className="input-field"
                  >
                    {CTE_LEVELS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-xs text-ink-500">
                CTE uses a pathway + tier instead of a K-12 grade.
              </p>
            </div>
          )}

          {subject === 'Reading Specialists' && (
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="reading-skill">
                Primary skill area
              </label>
              <select
                id="reading-skill"
                value={readingSkill}
                onChange={(e) => setReadingSkill(e.target.value)}
                className="input-field"
              >
                {READING_SKILLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-500">
                Whole-class structured-literacy lessons a substitute can run.
              </p>
            </div>
          )}

          {subject === 'Early Childhood' && (
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ec-age">
                Age group
              </label>
              <select
                id="ec-age"
                value={ecAgeGroup}
                onChange={(e) => setEcAgeGroup(e.target.value)}
                className="input-field"
              >
                {EC_AGE_GROUPS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-500">
                Early Childhood uses an age group (not a K-12 grade); the topic becomes the study theme.
              </p>
            </div>
          )}
        </div>

        {/* ── Absence duration ─────────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Absence duration</h2>

          <div>
            <label className="mb-2 block text-sm text-ink-300">How many weeks will you be out?</label>
            <div className="flex flex-wrap gap-2">
              {weekOptions.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeekCount(w)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    weekCount === w
                      ? 'bg-amber-500 text-white'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {w} {w === 1 ? 'week' : 'weeks'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-500">
              Generates {totalDays} daily lesson plans ({weekCount} weeks × 5 days).
            </p>
            {gated && (
              <p className="mt-1.5 text-xs text-amber-500">
                Free trial generates the first day only. Upgrade to generate all {totalDays} lessons for your absence.
              </p>
            )}
          </div>
        </div>

        {/* ── What to teach ────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">What to teach</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="topics">
              Topics and sequence
            </label>
            <textarea
              id="topics"
              rows={5}
              className="input-field resize-y"
              placeholder={
                'List what the sub should cover, in order. Be as specific or general as you like.\n\n' +
                'Example:\nWeek 1–2: Soccer — passing, trapping, dribbling\nWeek 3–4: Flag football — flag pulls, routes\nWeek 5: Review and fun stations'
              }
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-500">
              The AI will sequence lessons progressively across your absence.
            </p>
          </div>
        </div>

        {/* ── Class setup ──────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Class setup</h2>

          {currentGradeModel !== 'none' && (
            <div>
              <label className="mb-2 block text-sm text-ink-300">Grade</label>
              <GradeToggle
                options={gradeOptions}
                selected={gradeBands}
                onChange={setGradeBands}
                accent="bg-amber-500"
              />
              {gradeBands === null && (
                <p className="mt-1 text-xs text-red-400">Select a grade.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="classsize">
                Class size
              </label>
              <input
                id="classsize"
                type="number"
                min={1}
                max={60}
                value={classSize}
                onChange={(e) => setClassSize(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="duration">
                Class length (min)
              </label>
              <input
                id="duration"
                type="number"
                min={20}
                max={120}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="state">
              State <span className="text-ink-500">(for standards alignment)</span>
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="input-field"
            >
              {US_STATES.map(({ abbr, name }) => (
                <option key={abbr} value={abbr}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Sub instructions ─────────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Sub instructions</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="routines">
              Key routines &amp; expectations
            </label>
            <textarea
              id="routines"
              rows={4}
              className="input-field resize-y"
              placeholder={
                'What does the sub need to know about how your class runs?\n\n' +
                'Example: Students line up by class list order. Bathroom breaks are taken as a class at the 20-min mark. Noise level is always indoor voice. No running until we reach the gym.'
              }
              value={routines}
              onChange={(e) => setRoutines(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="emergency">
              Emergency / important notes{' '}
              <span className="text-ink-500">(optional)</span>
            </label>
            <textarea
              id="emergency"
              rows={3}
              className="input-field resize-y"
              placeholder="Allergies, IEP accommodations, behavior plans, attendance quirks, or anything urgent."
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (currentGradeModel !== 'none' && gradeBands === null)}
          className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {progress.week > 0
                ? `Generating Week ${progress.week} of ${progress.totalWeeks} — ${DAY_NAMES[progress.day - 1]}…`
                : 'Preparing…'}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {gated
                ? 'Generate 1-day preview'
                : `Generate ${weekCount}-week sub binder (${totalDays} lessons)`}
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            Each week takes 1–3 minutes · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
