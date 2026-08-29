import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Layers, Sparkles, Loader2, Printer, ArrowLeft, CheckCircle2, FolderOpen } from 'lucide-react'
import {
  CORE_SUBJECTS, NEWER_SUBJECTS,
  gradeModel, numToBand,
  K5_GRADES, K12_GRADES, STEM_FOCUS_AREAS, LET_LEVELS,
  CTE_PATHWAYS, CTE_LEVELS, READING_SKILLS, EC_AGE_GROUPS,
  callCoreDayGenerator, callNewerDayGenerator,
} from '../services/moduleDayGenerators'
import { createUnit, createLesson } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import UnitRenderer from '../components/renderers/UnitRenderer'
import useModuleToolContext from '../hooks/useModuleToolContext'
import ModuleToolContext from '../components/ModuleToolContext'

const DAY_OPTIONS = [1, 2, 3, 4, 5]

// URL slug → subject (home cards deep-link with ?subject=)
const SUBJECT_FROM_SLUG = {
  'pe-health': 'PE & Health', 'adaptive-pe': 'Adaptive PE', 'library': 'Library & Media',
  'art': 'Art', 'music': 'Music', 'stem': 'STEM',
  'theater': 'Theater', 'dance': 'Dance', 'world-languages': 'World Languages', 'jrotc': 'JROTC',
  'elementary-tech': 'Elementary Technology', 'esl-specialist': 'ESL/ELL Specialist',
  'gifted-talented': 'Gifted & Talented', 'special-education': 'Special Education', 'cte': 'CTE',
  'reading-specialists': 'Reading Specialists', 'math-specialists': 'Math Specialists',
  'early-childhood': 'Early Childhood',
}

const SUBJECT_HOME_PATH = {
  'PE & Health': '/pe-health', 'Adaptive PE': '/pe-health', 'Library & Media': '/library',
  'Art': '/art', 'Music': '/music', 'STEM': '/stem', 'Theater': '/theater', 'Dance': '/dance',
  'World Languages': '/world-languages', 'JROTC': '/jrotc', 'Elementary Technology': '/elementary-tech',
  'ESL/ELL Specialist': '/esl-specialist', 'Gifted & Talented': '/gifted-talented',
  'Special Education': '/special-education', 'CTE': '/cte', 'Reading Specialists': '/reading-specialists',
  'Math Specialists': '/math-specialists', 'Early Childhood': '/early-childhood',
}

// Cross-module day summary for the next day's progression context (best effort —
// every module has a title; objectives/EQ vary by shape).
function summarizeDay(lesson, dayNum) {
  const bits = []
  if (Array.isArray(lesson?.learning_objectives)) bits.push(lesson.learning_objectives.slice(0, 3).join('; '))
  else if (lesson?.learning_targets && typeof lesson.learning_targets === 'object') {
    bits.push(Object.values(lesson.learning_targets).flat().filter(Boolean).slice(0, 3).join('; '))
  }
  if (lesson?.essential_question) bits.push(`EQ: ${lesson.essential_question}`)
  const focus = lesson?.focus || lesson?.theme || lesson?.topic || ''
  const tail = [focus, bits.filter(Boolean).join(' | ')].filter(Boolean).join(' — ').slice(0, 240)
  return `Day ${dayNum}: "${lesson?.title || `Day ${dayNum}`}"${tail ? ` — ${tail}` : ''}`
}

function GradeToggle({ options, isSelected, onToggle, accent = 'bg-teal-500' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onToggle(value)}
          className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
            isSelected(value) ? `${accent} text-white` : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function UnitBuilder() {
  const [searchParams] = useSearchParams()
  const supportedSubjects = [...CORE_SUBJECTS, ...Object.keys(NEWER_SUBJECTS)]
  const moduleContext = useModuleToolContext(supportedSubjects)
  const preselected = moduleContext.subject ?? SUBJECT_FROM_SLUG[searchParams.get('subject')] ?? 'PE & Health'

  // Form
  const [subject, setSubject] = useState(preselected)
  const [showSubjects, setShowSubjects] = useState(false)
  const [coreGrades, setCoreGrades] = useState([]) // original 6: multi-band lesson per day
  const [grade, setGrade] = useState(null)          // newer modules: single grade
  const [dayCount, setDayCount] = useState(3)
  const [topic, setTopic] = useState('')
  const [unitName, setUnitName] = useState('')
  const [classSize, setClassSize] = useState(28)
  const [duration, setDuration] = useState(45)
  const [state, setState] = useState('VA')
  const [teacherNotes, setTeacherNotes] = useState('')

  // Per-module params
  const [stemFocusArea, setStemFocusArea] = useState('engineering')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [wlLevel, setWlLevel] = useState('novice')
  const [letLevel, setLetLevel] = useState('LET 1')
  const [ctePathway, setCtePathway] = useState('hospitality')
  const [cteTier, setCteTier] = useState('ms')
  const [cteLevel, setCteLevel] = useState('introductory')
  const [readingSkill, setReadingSkill] = useState(READING_SKILLS[0])
  const [ecAgeGroup, setEcAgeGroup] = useState('prek4')

  // Generation
  const [view, setView] = useState('form') // 'form' | 'result'
  const [loading, setLoading] = useState(false)
  const [progressDay, setProgressDay] = useState(0)
  const [days, setDays] = useState([])
  const [savedUnitId, setSavedUnitId] = useState(null)
  const [error, setError] = useState(null)
  const [resultMeta, setResultMeta] = useState(null)

  const isCore = CORE_SUBJECTS.includes(subject)
  const model = gradeModel(subject)
  const gradeOptions = model === 'k12' ? K12_GRADES : K5_GRADES

  function handleSubjectChange(next) {
    setSubject(next)
    setCoreGrades([])
    setGrade(null)
  }

  function toggleCoreGrade(v) {
    setCoreGrades((prev) => prev.includes(v) ? prev.filter((g) => g !== v) : [...prev, v].sort((a, b) => a - b))
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!topic.trim()) { setError('Enter a unit topic.'); return }
    if (model !== 'none') {
      if (isCore && coreGrades.length === 0) { setError('Select at least one grade.'); return }
      if (!isCore && grade === null) { setError('Select a grade.'); return }
    }
    if (subject === 'World Languages' && !targetLanguage.trim()) {
      setError('Enter the target language (e.g. Spanish).'); return
    }

    const name = unitName.trim() || topic.trim()
    const band = numToBand(grade)
    const extra = {
      targetLanguage: targetLanguage.trim(), wlLevel, letLevel,
      ctePathway, cteTier, cteLevel, readingSkill, ecAgeGroup,
    }
    const unitGradeBands = isCore ? coreGrades : (grade !== null ? [grade] : [])

    setLoading(true)
    setError(null)
    setDays([])
    setSavedUnitId(null)
    setResultMeta({ subject, unitName: name, dayCount })
    setView('result')

    try {
      // Create the unit up front so each day persists as it lands (a mid-run
      // failure still keeps the completed days, linked to the unit).
      const createdUnit = await createUnit({ name, subject, gradeBands: unitGradeBands })
      setSavedUnitId(createdUnit.id)

      const generated = []
      for (let d = 1; d <= dayCount; d++) {
        setProgressDay(d)

        const priorText = generated.map((l, i) => summarizeDay(l, i + 1)).join('\n')
        const focusLines = [
          topic.trim(),
          '',
          `This is Day ${d} of a ${dayCount}-day UNIT titled "${name}" — a coherent skill/knowledge progression across days.`,
          d === 1
            ? 'Day 1 introduces the foundational skills/concepts for this unit.'
            : 'Build DIRECTLY on the earlier days below: reference and extend what was already taught, do NOT reintroduce earlier skills from scratch, and use fresh opening/warm-up and instruction content that moves the progression forward (toward application, then assessment).',
        ]
        if (priorText) focusLines.push('', 'Already taught in earlier days (build on this, do not repeat):', priorText)
        const focus = focusLines.join('\n')
        const notes = teacherNotes.trim()

        let lesson
        if (isCore) {
          lesson = await callCoreDayGenerator(subject, stemFocusArea, {
            gradeBands: coreGrades,
            topic: focus,
            classSize,
            durationMinutes: duration,
            state,
          })
        } else {
          lesson = await callNewerDayGenerator(subject, { band, focus, notes, duration, classSize, state, extra })
        }

        // Tag with the unit name + persist, then reveal.
        const dayLesson = { ...lesson, unit: name }
        await createLesson(dayLesson, { aiModel: 'claude-sonnet-4-6', unitId: createdUnit.id })
        generated.push(dayLesson)
        setDays([...generated])
      }
    } catch (err) {
      setError(err?.message ?? 'Unit generation failed. Please try again.')
    } finally {
      setLoading(false)
      setProgressDay(0)
    }
  }

  function resetForm() {
    setView('form'); setDays([]); setError(null); setSavedUnitId(null); setResultMeta(null)
  }

  // ── Result view ────────────────────────────────────────────────────────────
  if (view === 'result' && resultMeta) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-4">
            <Link to={SUBJECT_HOME_PATH[subject] ?? '/'} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              <ArrowLeft size={16} /> {subject}
            </Link>
            <button type="button" onClick={resetForm} className="text-sm text-ink-400 hover:text-ink-200 transition-colors">
              ← Start over
            </button>
          </div>
          <div className="flex items-center gap-2">
            {savedUnitId && !loading && (
              <Link to={`/lessons?module=${encodeURIComponent(subject)}`} className="btn-secondary gap-1.5">
                <FolderOpen size={16} /> View in archive
              </Link>
            )}
            <button type="button" onClick={() => window.print()} disabled={loading} className="btn-secondary gap-1.5 disabled:opacity-50">
              <Printer size={16} /> Print unit
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100 print:hidden">{error}</div>
        )}

        {loading && (
          <div className="mb-6 flex items-center gap-2 text-sm text-ink-300 print:hidden">
            <Loader2 size={16} className="animate-spin" />
            Generating Day {progressDay} of {resultMeta.dayCount}… (each day builds on the last)
          </div>
        )}
        {!loading && days.length > 0 && (
          <div className="mb-6 flex items-center gap-2 text-sm text-emerald-400 print:hidden">
            <CheckCircle2 size={16} /> Unit complete — {days.length} day{days.length !== 1 ? 's' : ''} generated and saved.
          </div>
        )}

        <UnitRenderer subject={resultMeta.subject} unitName={resultMeta.unitName} days={days} />
      </div>
    )
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link to={moduleContext.homePath} className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} /> All modules
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15">
            <Layers size={18} className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Build a Unit</h1>
            <p className="text-xs text-ink-500">A multi-day unit that builds skill-on-skill · All content subjects</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-400">
          Each day generates on its own and builds directly on the previous day — reliable even for longer units,
          and every day is saved to your archive as it&rsquo;s created.
        </p>
      </div>

      <ModuleToolContext context={moduleContext} expanded={showSubjects} onToggle={() => setShowSubjects((value) => !value)} />

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Subject */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Subject</h2>
          {(!moduleContext.active || showSubjects) && <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="subject">Your subject</label>
            <select id="subject" value={subject} onChange={(e) => handleSubjectChange(e.target.value)} className="input-field">
              <optgroup label="Core specials">
                {CORE_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="More modules">
                {Object.keys(NEWER_SUBJECTS).map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            </select>
          </div>}

          {subject === 'STEM' && (
            <div>
              <label className="mb-2 block text-sm text-ink-300">STEM focus area</label>
              <div className="flex flex-wrap gap-2">
                {STEM_FOCUS_AREAS.map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setStemFocusArea(value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${stemFocusArea === value ? 'bg-cyan-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {subject === 'World Languages' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-language">Target language</label>
                <input id="wl-language" type="text" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}
                  placeholder="e.g. Spanish, French, Mandarin" className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-level">Proficiency level</label>
                <select id="wl-level" value={wlLevel} onChange={(e) => setWlLevel(e.target.value)} className="input-field">
                  <option value="novice">Novice</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          )}

          {subject === 'JROTC' && (
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="let-level">LET level</label>
              <select id="let-level" value={letLevel} onChange={(e) => setLetLevel(e.target.value)} className="input-field">
                {LET_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <p className="mt-1 text-xs text-ink-500">JROTC is high-school only — the LET level sets the grade span.</p>
            </div>
          )}

          {subject === 'CTE' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-pathway">Career pathway</label>
                <select id="cte-pathway" value={ctePathway} onChange={(e) => setCtePathway(e.target.value)} className="input-field">
                  {CTE_PATHWAYS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-ink-300">Level</label>
                <div className="flex flex-wrap gap-2">
                  {[{ value: 'ms', label: 'Middle school (exploratory)' }, { value: 'hs', label: 'High school' }].map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => setCteTier(value)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${cteTier === value ? 'bg-teal-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {cteTier === 'hs' && (
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-level">Course level</label>
                  <select id="cte-level" value={cteLevel} onChange={(e) => setCteLevel(e.target.value)} className="input-field">
                    {CTE_LEVELS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              )}
              <p className="text-xs text-ink-500">CTE uses a pathway + tier instead of a K-12 grade.</p>
            </div>
          )}

          {subject === 'Reading Specialists' && (
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="reading-skill">Primary skill area</label>
              <select id="reading-skill" value={readingSkill} onChange={(e) => setReadingSkill(e.target.value)} className="input-field">
                {READING_SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {subject === 'Early Childhood' && (
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ec-age">Age group</label>
              <select id="ec-age" value={ecAgeGroup} onChange={(e) => setEcAgeGroup(e.target.value)} className="input-field">
                {EC_AGE_GROUPS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <p className="mt-1 text-xs text-ink-500">Early Childhood uses an age group; the topic becomes the study theme.</p>
            </div>
          )}
        </div>

        {/* Unit setup */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Unit</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="topic">Unit topic</label>
            <input id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Nutrition & healthy choices, Invasion games, Greetings & introductions"
              className="input-field" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unitName">
              Unit name <span className="text-ink-500">(optional)</span>
            </label>
            <input id="unitName" type="text" value={unitName} onChange={(e) => setUnitName(e.target.value)}
              placeholder="Defaults to the topic" className="input-field" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-ink-300">How many days?</label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((d) => (
                <button key={d} type="button" onClick={() => setDayCount(d)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${dayCount === d ? 'bg-teal-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}>
                  {d} {d === 1 ? 'day' : 'days'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-500">Each day generates in sequence and builds on the previous one.</p>
          </div>
        </div>

        {/* Class setup */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Class setup</h2>

          {model !== 'none' && (
            <div>
              <label className="mb-2 block text-sm text-ink-300">
                {isCore ? 'Grades (select all this unit is for)' : 'Grade'}
              </label>
              <GradeToggle
                options={gradeOptions}
                isSelected={(v) => isCore ? coreGrades.includes(v) : grade === v}
                onToggle={(v) => isCore ? toggleCoreGrade(v) : setGrade(v)}
              />
              {isCore && coreGrades.length === 0 && <p className="mt-1 text-xs text-red-400">Select at least one grade.</p>}
              {!isCore && grade === null && <p className="mt-1 text-xs text-red-400">Select a grade.</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="classsize">Class size</label>
              <input id="classsize" type="number" min={1} max={60} value={classSize} onChange={(e) => setClassSize(Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="duration">Class length (min)</label>
              <input id="duration" type="number" min={20} max={120} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input-field" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="state">State <span className="text-ink-500">(for standards alignment)</span></label>
            <select id="state" value={state} onChange={(e) => setState(e.target.value)} className="input-field">
              {US_STATES.map(({ abbr, name }) => <option key={abbr} value={abbr}>{name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="notes">
              Notes for the unit <span className="text-ink-500">(optional)</span>
            </label>
            <textarea id="notes" rows={2} className="input-field resize-y" value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="Anything the whole unit should account for — equipment limits, accommodations, prior knowledge." />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50">
          <Sparkles size={18} />
          Build {dayCount}-day unit
        </button>
        <p className="text-center text-xs text-ink-500">Each day takes about 1–2 minutes · Do not close this tab</p>
      </form>
    </div>
  )
}
