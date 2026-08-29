import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Sparkles, Loader2, Printer, Save, Check, ArrowLeft, FolderOpen, ShieldCheck } from 'lucide-react'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'
import { generateClassroomCard, createCard } from '../services/classroomManagementService'
import ClassroomCardRenderer from '../components/renderers/ClassroomCardRenderer'
import BehaviorChartRenderer from '../components/renderers/BehaviorChartRenderer'
import ReflectionFormRenderer from '../components/renderers/ReflectionFormRenderer'
import TroubleshootRenderer from '../components/renderers/TroubleshootRenderer'
import ABCSheetRenderer from '../components/renderers/ABCSheetRenderer'
import CICOTrackerRenderer from '../components/renderers/CICOTrackerRenderer'
import ParentCommunicationRenderer from '../components/renderers/ParentCommunicationRenderer'

// Card accent themes — deliberately distinct from the module's own indigo UI accent.
const THEMES = [
  { id: 'navy', name: 'Navy', hex: '#1e3a8a' },
  { id: 'teal', name: 'Teal', hex: '#0f766e' },
  { id: 'crimson', name: 'Crimson', hex: '#b91c1c' },
  { id: 'forest', name: 'Forest', hex: '#166534' },
  { id: 'plum', name: 'Plum', hex: '#6b21a8' },
  { id: 'slate', name: 'Slate', hex: '#334155' },
]

const GRADE_BANDS = [
  { id: 'K-2', label: 'K–2' },
  { id: '3-5', label: '3–5' },
  { id: '6-8', label: '6–8' },
  { id: '9-12', label: '9–12' },
]

const OUTPUT_TYPES = [
  { id: 'card', label: 'Quick-Reference Card' },
  { id: 'behavior-chart', label: 'Behavior Chart' },
  { id: 'reflection-form', label: 'Reflection Form' },
  { id: 'troubleshoot', label: 'Troubleshoot a Behavior' },
  { id: 'abc-sheet', label: 'ABC Sheet' },
  { id: 'cico-tracker', label: 'CICO Tracker' },
  { id: 'parent-note', label: 'Parent Note' },
]

const OUTPUT_LABEL = {
  card: 'Quick-Reference Card',
  'behavior-chart': 'Behavior Chart',
  'reflection-form': 'Reflection Form',
  troubleshoot: 'Behavior Troubleshooter',
  'abc-sheet': 'ABC Data Sheet',
  'cico-tracker': 'CICO Tracker',
  'parent-note': 'Parent Note',
}

const PARENT_TONES = [
  { id: 'warm-casual', label: 'Warm & casual' },
  { id: 'balanced', label: 'Warm & professional' },
  { id: 'formal-professional', label: 'Formal' },
]

// ABC Sheet and CICO Tracker are static teacher-filled templates — no AI call.
const STATIC_TYPES = new Set(['abc-sheet', 'cico-tracker'])

export default function ClassroomManagementGenerator() {
  const { isTrial, isExpired } = useTrial()
  const gated = isTrial || isExpired

  const [outputType, setOutputType] = useState('card')
  const [teacherName, setTeacherName] = useState('')
  const [gradeBand, setGradeBand] = useState('6-8')
  const [classContext, setClassContext] = useState('')
  const [challenge, setChallenge] = useState('')
  const [classSize, setClassSize] = useState('')
  // ABC Sheet / CICO Tracker inputs
  const [studentName, setStudentName] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [cicoDate, setCicoDate] = useState('')
  const [goals, setGoals] = useState(['', '', ''])
  const [intervals, setIntervals] = useState('Check-In, Block 1, Block 2, Block 3, Check-Out')
  // Parent Note inputs
  const [noteType, setNoteType] = useState('incident')
  const [noteDate, setNoteDate] = useState('')
  const [noteDetails, setNoteDetails] = useState('')
  const [noteResponse, setNoteResponse] = useState('')
  const [noteTone, setNoteTone] = useState('balanced')
  const [signatureName, setSignatureName] = useState('')
  const [themeId, setThemeId] = useState('navy')
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]

  const setGoal = (i, val) => setGoals((prev) => prev.map((g, idx) => (idx === i ? val : g)))
  const addGoal = () => setGoals((prev) => (prev.length >= 4 ? prev : [...prev, '']))
  const removeGoal = (i) => setGoals((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)))

  async function handleGenerate(e) {
    e.preventDefault()
    setError(null)
    setSaveStatus('idle')

    // Static templates (ABC Sheet, CICO Tracker) — assemble locally, no edge function.
    if (outputType === 'abc-sheet') {
      setCard({ studentName: studentName.trim(), dateRange: dateRange.trim() })
      return
    }
    if (outputType === 'cico-tracker') {
      const goalList = goals.map((g) => g.trim()).filter(Boolean)
      if (goalList.length === 0) { setError('Add at least one goal or behavior to track.'); return }
      const intervalList = intervals.split(',').map((s) => s.trim()).filter(Boolean)
      if (intervalList.length === 0) { setError('Add at least one time block (comma-separated).'); return }
      setCard({
        studentName: studentName.trim(),
        date: cicoDate.trim(),
        goals: goalList,
        intervals: intervalList,
        scale: gradeBand === 'K-2' ? 'faces' : 'points',
      })
      return
    }

    if (outputType === 'troubleshoot' && !challenge.trim()) {
      setError('Describe the behavior challenge in your own words first.')
      return
    }
    if (outputType === 'parent-note' && !noteDetails.trim()) {
      setError(noteType === 'positive'
        ? 'Add the specific positive thing you noticed.'
        : 'Add a brief factual description of what happened.')
      return
    }
    setLoading(true)
    setCard(null)
    try {
      const result = await generateClassroomCard({
        outputType,
        gradeBand,
        classContext: classContext.trim(),
        challenge: challenge.trim(),
        classSize: classSize.trim(),
        noteType,
        studentName: studentName.trim(),
        noteDate: noteDate.trim(),
        details: noteDetails.trim(),
        response: noteResponse.trim(),
        tone: noteTone,
      })
      setCard(result)
    } catch (err) {
      setError(err.message ?? 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      const savedName = outputType === 'parent-note'
        ? `${studentName.trim() || 'Student'} — ${noteType === 'positive' ? 'Positive Note' : 'Incident Note'}`
        : `${teacherName.trim() || 'My Classroom'} — Grades ${gradeBand} ${OUTPUT_LABEL[outputType]}`
      await createCard({
        name: savedName,
        cardData: { outputType, card, noteType, signatureName: signatureName.trim(), teacherName: teacherName.trim(), gradeBand, classContext: classContext.trim(), challenge: challenge.trim(), classSize: classSize.trim(), theme },
      })
      setSaveStatus('saved')
    } catch (err) {
      setError(err.message)
      setSaveStatus('idle')
    }
  }

  return (
    <div className="space-y-8">
      {/* Back to modules */}
      <Link to="/" className="no-print inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
        <ArrowLeft size={14} />
        All modules
      </Link>

      {/* Header */}
      <div className="no-print flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15">
            <ClipboardCheck size={22} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">Classroom Management</h1>
            <p className="text-sm text-ink-400">Printable quick-reference cards for large-group specials classes</p>
          </div>
        </div>
        <Link
          to="/my-classroom-cards"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-ink-800 px-3 py-1.5 text-sm font-medium text-ink-300 hover:border-ink-600"
        >
          <FolderOpen size={15} /> My cards
        </Link>
      </div>

      {gated ? (
        // Trial users: Classroom Management is a paid-only module — no preview.
        <div className="no-print">
          <div className="card p-6">
            <p className="text-sm text-ink-300">
              Classroom Management is included with a PlansK12 subscription. It isn't part of the free trial.
            </p>
          </div>
          <UpgradeBanner label="the Classroom Management module" />
        </div>
      ) : (
        <>
          {/* Form */}
          <form onSubmit={handleGenerate} className="no-print card space-y-5 p-6">
            {/* Output type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-200">Output type</label>
              <div className="flex flex-wrap gap-2">
                {OUTPUT_TYPES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { setOutputType(o.id); setCard(null); setSaveStatus('idle') }}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      outputType === o.id ? 'border-indigo-400 bg-indigo-500/15 text-ink-300' : 'border-ink-800 text-ink-400 hover:border-ink-600'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Troubleshoot: free-text behavior challenge */}
            {outputType === 'troubleshoot' && (
              <div>
                <label htmlFor="cm-challenge" className="mb-1.5 block text-sm font-medium text-ink-200">
                  Describe the behavior challenge <span className="text-ink-500">(in your own words)</span>
                </label>
                <textarea
                  id="cm-challenge"
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  rows={3}
                  placeholder="e.g. 8th-grade transitions are chaotic and take forever, or one student keeps grabbing equipment from others during stations"
                  className="input-field"
                />
              </div>
            )}

            {/* ABC Sheet / CICO Tracker: student name (or blank for privacy) */}
            {STATIC_TYPES.has(outputType) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cm-student" className="mb-1.5 block text-sm font-medium text-ink-200">
                    Student name <span className="text-ink-500">(optional — leave blank for privacy)</span>
                  </label>
                  <input
                    id="cm-student"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Leave blank to print “Student”"
                    className="input-field"
                  />
                </div>
                {outputType === 'abc-sheet' ? (
                  <div>
                    <label htmlFor="cm-daterange" className="mb-1.5 block text-sm font-medium text-ink-200">
                      Date range <span className="text-ink-500">(optional)</span>
                    </label>
                    <input
                      id="cm-daterange"
                      type="text"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      placeholder="e.g. Week of Sept 8"
                      className="input-field"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="cm-cicodate" className="mb-1.5 block text-sm font-medium text-ink-200">
                      Date <span className="text-ink-500">(optional)</span>
                    </label>
                    <input
                      id="cm-cicodate"
                      type="text"
                      value={cicoDate}
                      onChange={(e) => setCicoDate(e.target.value)}
                      placeholder="e.g. Mon, Sept 8"
                      className="input-field"
                    />
                  </div>
                )}
              </div>
            )}

            {/* CICO Tracker: customizable goals + time blocks */}
            {outputType === 'cico-tracker' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-200">
                    Goals / behaviors to track <span className="text-ink-500">(1–4, positively phrased)</span>
                  </label>
                  <p className="mb-2 text-xs text-ink-500">
                    Phrase goals as what to <span className="italic">do</span> — e.g. “Used a quiet voice in line” rather than “Didn’t talk in line.” Giving students something to aim for works better than something to avoid.
                  </p>
                  <div className="space-y-2">
                    {goals.map((g, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={g}
                          onChange={(e) => setGoal(i, e.target.value)}
                          placeholder={['e.g. Stayed in my space', 'e.g. Used kind words', 'e.g. Followed directions', 'e.g. Kept a safe body'][i] ?? 'Goal'}
                          className="input-field flex-1"
                        />
                        {goals.length > 1 && (
                          <button type="button" onClick={() => removeGoal(i)} className="rounded-lg border border-ink-800 px-2.5 py-1.5 text-sm text-ink-400 hover:border-ink-600" aria-label="Remove goal">
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {goals.length < 4 && (
                    <button type="button" onClick={addGoal} className="mt-2 text-sm font-medium text-ink-300 hover:text-ink-100">
                      + Add goal
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor="cm-intervals" className="mb-1.5 block text-sm font-medium text-ink-200">
                    Check-in points <span className="text-ink-500">(comma-separated columns)</span>
                  </label>
                  <input
                    id="cm-intervals"
                    type="text"
                    value={intervals}
                    onChange={(e) => setIntervals(e.target.value)}
                    placeholder="Check-In, Block 1, Block 2, Block 3, Check-Out"
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-ink-500">
                    {gradeBand === 'K-2' ? 'K–2 prints emoji faces 🙁 😐 🙂 for rating.' : 'Rating scale 0 · 1 · 2 per check-in.'}
                  </p>
                </div>
              </>
            )}

            {/* Parent Note: incident vs positive + specifics + tone */}
            {outputType === 'parent-note' && (
              <>
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs leading-relaxed text-emerald-300">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                  <span>The student display name is anonymized before AI generation. Do not include other student names, diagnoses, medical details, or copied records in your description.</span>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-200">Note type</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'incident', label: 'Incident note', hint: 'Something happened — going home' },
                      { id: 'positive', label: 'Positive note', hint: '“Caught being good”' },
                    ].map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => { setNoteType(n.id); setCard(null); setSaveStatus('idle') }}
                        className={`flex flex-col items-start rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          noteType === n.id ? 'border-indigo-400 bg-indigo-500/15 text-ink-300' : 'border-ink-800 text-ink-400 hover:border-ink-600'
                        }`}
                      >
                        <span>{n.label}</span>
                        <span className="text-[11px] font-normal text-ink-500">{n.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cm-pn-student" className="mb-1.5 block text-sm font-medium text-ink-200">
                      Student display name or code <span className="text-ink-500">(optional — blank uses “your child”)</span>
                    </label>
                    <input
                      id="cm-pn-student"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Avery M. or 4X-03"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="cm-pn-date" className="mb-1.5 block text-sm font-medium text-ink-200">
                      Date <span className="text-ink-500">(optional)</span>
                    </label>
                    <input
                      id="cm-pn-date"
                      type="text"
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      placeholder="e.g. today, Tuesday, Sept 9"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cm-pn-details" className="mb-1.5 block text-sm font-medium text-ink-200">
                    {noteType === 'positive'
                      ? 'What did you notice?'
                      : 'What happened?'}{' '}
                    <span className="text-ink-500">(your specifics — the note is built from these)</span>
                  </label>
                  <textarea
                    id="cm-pn-details"
                    value={noteDetails}
                    onChange={(e) => setNoteDetails(e.target.value)}
                    rows={3}
                    placeholder={noteType === 'positive'
                      ? 'e.g. waited patiently for her turn during the relay and cheered on the other team while she waited'
                      : 'e.g. got frustrated during a group game, said some unkind words to a teammate, and left the activity'}
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-ink-500">Just the facts — I’ll shape them into a note. I won’t invent details you didn’t give.</p>
                </div>

                {noteType === 'incident' && (
                  <div>
                    <label htmlFor="cm-pn-response" className="mb-1.5 block text-sm font-medium text-ink-200">
                      What was done in response at school? <span className="text-ink-500">(optional)</span>
                    </label>
                    <textarea
                      id="cm-pn-response"
                      value={noteResponse}
                      onChange={(e) => setNoteResponse(e.target.value)}
                      rows={2}
                      placeholder="e.g. we took a short break, talked it through, and she rejoined the group and apologized"
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="cm-pn-signature" className="mb-1.5 block text-sm font-medium text-ink-200">
                    Sign the note as <span className="text-ink-500">(your name as it should appear at the bottom)</span>
                  </label>
                  <input
                    id="cm-pn-signature"
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="e.g. Ms. Garcia"
                    className="input-field sm:max-w-[320px]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-200">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {PARENT_TONES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNoteTone(t.id)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          noteTone === t.id ? 'border-indigo-400 bg-indigo-500/15 text-ink-300' : 'border-ink-800 text-ink-400 hover:border-ink-600'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cm-name" className="mb-1.5 block text-sm font-medium text-ink-200">
                  Teacher name <span className="text-ink-500">(printed on the output)</span>
                </label>
                <input
                  id="cm-name"
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Ms. Garcia's Gym"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-200">Grade band</label>
                <div className="flex flex-wrap gap-2">
                  {GRADE_BANDS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGradeBand(g.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        gradeBand === g.id ? 'border-indigo-400 bg-indigo-500/15 text-ink-300' : 'border-ink-800 text-ink-400 hover:border-ink-600'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="cm-context" className="mb-1.5 block text-sm font-medium text-ink-200">
                Class / subject <span className="text-ink-500">(optional — tailors the output)</span>
              </label>
              <input
                id="cm-context"
                type="text"
                value={classContext}
                onChange={(e) => setClassContext(e.target.value)}
                placeholder="e.g. PE / gym, General music, Art room, STEM lab"
                className="input-field"
              />
            </div>

            {outputType === 'troubleshoot' && (
              <div className="sm:max-w-[200px]">
                <label htmlFor="cm-size" className="mb-1.5 block text-sm font-medium text-ink-200">
                  Class size <span className="text-ink-500">(optional)</span>
                </label>
                <input
                  id="cm-size"
                  type="text"
                  value={classSize}
                  onChange={(e) => setClassSize(e.target.value)}
                  placeholder="e.g. 32"
                  className="input-field"
                />
              </div>
            )}

            {/* Color theme picker */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-200">Color theme</label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      themeId === t.id ? 'border-ink-400 bg-ink-800 text-ink-50' : 'border-ink-800 text-ink-400 hover:border-ink-600'
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.hex }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-ink-100">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> {outputType === 'troubleshoot' ? 'Get strategies' : outputType === 'abc-sheet' ? 'Build ABC sheet' : outputType === 'cico-tracker' ? 'Build CICO tracker' : outputType === 'parent-note' ? 'Write note' : `Generate ${OUTPUT_LABEL[outputType].toLowerCase()}`}</>}
            </button>
          </form>

          {/* Generated output */}
          {card && (
            <div className="space-y-5">
              {outputType === 'behavior-chart' ? (
                <BehaviorChartRenderer chart={card} teacherName={teacherName} gradeBand={gradeBand} classContext={classContext} accentHex={theme.hex} />
              ) : outputType === 'reflection-form' ? (
                <ReflectionFormRenderer form={card} teacherName={teacherName} gradeBand={gradeBand} classContext={classContext} accentHex={theme.hex} />
              ) : outputType === 'troubleshoot' ? (
                <TroubleshootRenderer result={card} challenge={challenge} teacherName={teacherName} gradeBand={gradeBand} classContext={classContext} accentHex={theme.hex} />
              ) : outputType === 'abc-sheet' ? (
                <ABCSheetRenderer config={card} teacherName={teacherName} classContext={classContext} accentHex={theme.hex} />
              ) : outputType === 'cico-tracker' ? (
                <CICOTrackerRenderer config={card} teacherName={teacherName} gradeBand={gradeBand} classContext={classContext} accentHex={theme.hex} />
              ) : outputType === 'parent-note' ? (
                <ParentCommunicationRenderer note={card} signatureName={signatureName} teacherName={teacherName} classContext={classContext} accentHex={theme.hex} />
              ) : (
                <ClassroomCardRenderer card={card} teacherName={teacherName} gradeBand={gradeBand} accentHex={theme.hex} />
              )}

              <div className="no-print flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  <Printer size={16} /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus !== 'idle'}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink-700 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-ink-500 disabled:opacity-60"
                >
                  {saveStatus === 'saved' ? <><Check size={16} /> Saved</> : saveStatus === 'saving' ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save to my cards</>}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
