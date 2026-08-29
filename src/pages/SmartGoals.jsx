import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Check, ChevronDown, ChevronUp, Download, Loader2, Plus, Printer, RefreshCw, Target, Users } from 'lucide-react'
import { listPeriods } from '../services/classPeriodsService'
import { listStudents } from '../services/studentsService'
import { addSmartGoalUpdate, createSmartGoal, getRunTrackerClassProgress, listSmartGoals, updateSmartGoalStatus, updateStudentGoal } from '../services/smartGoalsService'
import { SPECIALTY_CONTEXTS } from '../constants/moduleHomes'
import { subjectMatchesFilter } from '../constants/modules'

const TODAY = new Date().toISOString().slice(0, 10)
const FUTURE = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const TEMPLATES = [
  { key: 'general', subject: 'General', label: 'General skill mastery', title: 'Increase skill mastery', metricName: 'students meeting the success criteria', unit: 'percent', baseline: 50, target: 80, direction: 'increase' },
  { key: 'pe-cardio', subject: 'PE & Health', label: 'Cardiovascular improvement', title: 'Improve cardiovascular endurance', metricName: 'average run time', unit: 'seconds', baseline: 720, target: 660, direction: 'decrease', sourceType: 'run_tracker', sourceLabel: 'Half-mile' },
  { key: 'pe-participation', subject: 'PE & Health', label: 'Participation consistency', title: 'Increase weekly participation', metricName: 'weekly participation average', unit: 'percent', baseline: 82, target: 95, direction: 'increase' },
  { key: 'art', subject: 'Art', label: 'Studio technique', title: 'Apply the target studio technique', metricName: 'students meeting the technique rubric', unit: 'percent', baseline: 45, target: 80, direction: 'increase' },
  { key: 'music', subject: 'Music', label: 'Performance accuracy', title: 'Improve performance accuracy', metricName: 'students meeting the performance criteria', unit: 'percent', baseline: 55, target: 85, direction: 'increase' },
  { key: 'library', subject: 'Library & Media', label: 'Research skills', title: 'Strengthen research and source evaluation', metricName: 'students independently meeting the research criteria', unit: 'percent', baseline: 40, target: 80, direction: 'increase' },
  { key: 'cte', subject: 'CTE', label: 'Safety and competency', title: 'Increase safe technical skill performance', metricName: 'students meeting the safety and competency checklist', unit: 'percent', baseline: 60, target: 90, direction: 'increase' },
  { key: 'theater', subject: 'Theater / Drama', label: 'Ensemble performance', title: 'Strengthen ensemble performance skills', metricName: 'students meeting the rehearsal and performance criteria', unit: 'percent', baseline: 50, target: 85, direction: 'increase' },
  { key: 'dance', subject: 'Dance', label: 'Movement performance', title: 'Improve movement phrase performance', metricName: 'students meeting the movement and choreography criteria', unit: 'percent', baseline: 50, target: 85, direction: 'increase' },
  { key: 'stem', subject: 'STEM', label: 'Engineering design growth', title: 'Improve use of the engineering design process', metricName: 'students meeting the design-process success criteria', unit: 'percent', baseline: 45, target: 80, direction: 'increase' },
  { key: 'world-languages', subject: 'World Languages', label: 'Target-language communication', title: 'Increase target-language communication', metricName: 'students meeting the interpersonal communication criteria', unit: 'percent', baseline: 45, target: 80, direction: 'increase' },
  { key: 'jrotc', subject: 'JROTC', label: 'Leadership application', title: 'Strengthen applied leadership skills', metricName: 'cadets meeting the leadership performance criteria', unit: 'percent', baseline: 55, target: 85, direction: 'increase' },
  { key: 'elementary-tech', subject: 'Elementary Technology / Computer Lab', label: 'Independent digital skills', title: 'Increase independent use of the target digital skill', metricName: 'students completing the digital task independently', unit: 'percent', baseline: 45, target: 85, direction: 'increase' },
  { key: 'school-counselors', subject: 'School Counselors', label: 'SEL skill application', title: 'Increase use of the target SEL strategy', metricName: 'students applying the strategy in classroom scenarios', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'esl-specialist', subject: 'ESL/ELL Specialist', label: 'Language growth', title: 'Increase successful use of the language objective', metricName: 'students meeting the language-domain success criteria', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'gifted-talented', subject: 'Gifted & Talented', label: 'Depth and complexity', title: 'Increase depth and complexity in student products', metricName: 'students meeting the advanced product criteria', unit: 'percent', baseline: 50, target: 85, direction: 'increase' },
  { key: 'reading-specialists', subject: 'Reading Specialists', label: 'Targeted literacy growth', title: 'Improve performance on the targeted literacy skill', metricName: 'students meeting the literacy skill criterion', unit: 'percent', baseline: 35, target: 75, direction: 'increase' },
  { key: 'math-specialists', subject: 'Math Specialists', label: 'Targeted math growth', title: 'Improve mastery of the targeted math skill', metricName: 'students meeting the math skill criterion', unit: 'percent', baseline: 40, target: 80, direction: 'increase' },
  { key: 'special-education', subject: 'Special Education', label: 'Access and independence', title: 'Increase independence with the target learning routine', metricName: 'students completing the routine with planned supports', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'early-childhood', subject: 'Early Childhood / Pre-K', label: 'Learning through play', title: 'Increase demonstration of the target early-learning skill', metricName: 'children demonstrating the skill during play and routines', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'ecse', subject: 'Early Childhood Special Education', label: 'Participation and access', title: 'Increase participation in the target classroom routine', metricName: 'successful opportunities with planned supports', unit: 'percent', baseline: 35, target: 70, direction: 'increase' },
  { key: 'after-school-clubs', subject: 'After-School Clubs', label: 'Engagement and project growth', title: 'Increase active participation in club projects', metricName: 'students meeting the participation and project criteria', unit: 'percent', baseline: 55, target: 85, direction: 'increase' },
  { key: 'ot', subject: 'Occupational Therapists', label: 'Functional participation', title: 'Increase use of the target participation strategy', metricName: 'successful opportunities with the planned strategy', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'pt', subject: 'Physical Therapists', label: 'Movement and access', title: 'Increase success with the target movement skill', metricName: 'successful movement opportunities with planned supports', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'slp', subject: 'Speech-Language Pathologists', label: 'Group communication target', title: 'Increase successful use of the targeted communication skill', metricName: 'successful opportunities with planned supports', unit: 'percent', baseline: 45, target: 75, direction: 'increase' },
  { key: 'tvi', subject: 'Teacher of the Visually Impaired', label: 'ECC independence', title: 'Increase independence with the target ECC skill', metricName: 'successful opportunities using the target access skill', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'dhh', subject: 'Teacher of the Deaf & Hard of Hearing', label: 'Communication access', title: 'Increase communication access and self-advocacy', metricName: 'successful use of the target access or advocacy strategy', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'staff-pd', subject: 'Staff PD & Meeting Planning', label: 'Professional learning implementation', title: 'Increase implementation of the target instructional practice', metricName: 'staff members demonstrating the agreed implementation evidence', unit: 'percent', baseline: 35, target: 80, direction: 'increase' },
  { key: 'instructional-coaching', subject: 'Instructional Coaching', label: 'Teacher-selected practice', title: 'Increase consistent use of the teacher-selected practice', metricName: 'observed opportunities showing the agreed success criteria', unit: 'percent', baseline: 40, target: 80, direction: 'increase' },
  { key: 'intervention', subject: 'Intervention Planning', label: 'Intervention response', title: 'Improve performance on the targeted intervention measure', metricName: 'students meeting the intervention aimline', unit: 'percent', baseline: 35, target: 75, direction: 'increase' },
  { key: 'student-support-activities', subject: 'Student Support Team Activities', label: 'SEL and behavior growth', title: 'Increase use of the target SEL or behavior skill', metricName: 'students demonstrating the skill in planned practice', unit: 'percent', baseline: 40, target: 75, direction: 'increase' },
  { key: 'test-prep', subject: 'Test Prep', label: 'Targeted test-skill growth', title: 'Improve accuracy on the targeted assessment skill', metricName: 'practice questions answered correctly', unit: 'percent', baseline: 50, target: 80, direction: 'increase' },
]

const EMPTY_FORM = {
  scope: 'class', classPeriodId: '', gradeLabel: '', subject: 'General', templateKey: 'general',
  title: TEMPLATES[0].title, metricName: TEMPLATES[0].metricName, metricUnit: 'percent',
  direction: 'increase', baselineValue: '50', targetValue: '80', targetDate: FUTURE,
  specificStatement: '', sourceType: 'manual', sourceLabel: '', notes: '', includeIndividuals: false,
}

function formForModule(moduleLabel) {
  if (!moduleLabel) return EMPTY_FORM
  const template = TEMPLATES.find((item) => item.subject === moduleLabel)
  if (!template) return { ...EMPTY_FORM, subject: moduleLabel }
  return {
    ...EMPTY_FORM,
    templateKey: template.key,
    subject: template.subject,
    title: template.title,
    metricName: template.metricName,
    metricUnit: template.unit,
    baselineValue: String(template.baseline),
    targetValue: String(template.target),
    direction: template.direction,
    sourceType: template.sourceType || 'manual',
    sourceLabel: template.sourceLabel || '',
  }
}

function formatDate(value) {
  if (!value) return 'No date'
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatValue(value, unit) {
  if (value == null || value === '') return '—'
  if (unit === 'seconds') return `${Math.floor(Number(value) / 60)}:${String(Math.round(Number(value)) % 60).padStart(2, '0')}`
  if (unit === 'percent') return `${Number(value)}%`
  return `${Number(value)} ${unit}`
}

function currentValue(goal) {
  const groupUpdates = (goal.smart_goal_updates ?? []).filter((update) => !update.student_id)
  return groupUpdates.at(-1)?.value ?? goal.baseline_value
}

function progressPercent(goal) {
  const baseline = Number(goal.baseline_value)
  const target = Number(goal.target_value)
  const current = Number(currentValue(goal))
  if (baseline === target) return current === target ? 100 : 0
  const raw = goal.direction === 'decrease'
    ? (baseline - current) / (baseline - target)
    : (current - baseline) / (target - baseline)
  return Math.max(0, Math.min(100, Math.round(raw * 100)))
}

function trendLabel(goal) {
  const baseline = Number(goal.baseline_value)
  const current = Number(currentValue(goal))
  const change = current - baseline
  if (change === 0) return 'No change yet'
  const improving = goal.direction === 'decrease' ? change < 0 : change > 0
  return `${improving ? 'Improving' : 'Regression'} · ${formatValue(Math.abs(change), goal.metric_unit)} ${goal.direction === 'decrease' ? (change < 0 ? 'faster' : 'slower') : (change > 0 ? 'higher' : 'lower')}`
}

function buildStatement(form, periods) {
  const period = periods.find((item) => item.id === form.classPeriodId)
  const group = form.scope === 'class' ? (period?.label || 'the selected class') : `Grade ${form.gradeLabel || 'level'} students`
  const verb = form.direction === 'decrease' ? 'decrease' : form.direction === 'maintain' ? 'maintain' : 'increase'
  return `By ${formatDate(form.targetDate)}, ${group} will ${verb} ${form.metricName} from ${formatValue(form.baselineValue, form.metricUnit)} to ${formatValue(form.targetValue, form.metricUnit)}, as measured by teacher progress checks${form.sourceType === 'run_tracker' ? ' and the PlansK12 Run Tracker' : ''}.`
}

export default function SmartGoals() {
  const [searchParams] = useSearchParams()
  const requestedModule = searchParams.get('module')
  return <SmartGoalsWorkspace key={requestedModule || 'all-specialties'} requestedModule={requestedModule} />
}

function SmartGoalsWorkspace({ requestedModule }) {
  const moduleEntry = Object.entries(SPECIALTY_CONTEXTS).find(([slug, config]) =>
    requestedModule === slug || requestedModule === config.moduleLabel || requestedModule === config.title
  )
  const moduleBackTo = requestedModule === 'PE & Health'
    ? '/pe-health'
    : moduleEntry
      ? `/${moduleEntry[0]}`
      : '/'
  const moduleBackLabel = requestedModule
    ? `${moduleEntry?.[1].title ?? requestedModule} dashboard`
    : 'All modules'
  const [goals, setGoals] = useState([])
  const [periods, setPeriods] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(() => formForModule(requestedModule))
  const [selectedStudents, setSelectedStudents] = useState([])
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedGoal, setExpandedGoal] = useState(null)
  const [progressDrafts, setProgressDrafts] = useState({})
  const [savingGoalId, setSavingGoalId] = useState(null)
  const [allViewModule, setAllViewModule] = useState(null)

  const classStudents = useMemo(() => students.filter((student) => student.class_period_id === form.classPeriodId), [students, form.classPeriodId])
  const visiblePeriods = requestedModule
    ? periods.filter((period) => subjectMatchesFilter(period.subject, requestedModule))
    : periods
  const templateOptions = requestedModule
    ? TEMPLATES.filter((template) => template.key === 'general' || template.subject === requestedModule)
    : TEMPLATES

  async function load() {
    setLoading(true); setError(null)
    try {
      const [goalRows, periodRows, studentRows] = await Promise.all([listSmartGoals(), listPeriods(), listStudents()])
      setGoals(Array.isArray(goalRows) ? goalRows : [])
      setPeriods(Array.isArray(periodRows) ? periodRows : [])
      setStudents(Array.isArray(studentRows) ? studentRows : [])
    } catch (err) { setError(err.message ?? 'Could not load SMART Goals.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let active = true
    Promise.all([listSmartGoals(), listPeriods(), listStudents()])
      .then(([goalRows, periodRows, studentRows]) => {
        if (!active) return
        setGoals(Array.isArray(goalRows) ? goalRows : [])
        setPeriods(Array.isArray(periodRows) ? periodRows : [])
        setStudents(Array.isArray(studentRows) ? studentRows : [])
      })
      .catch((err) => {
        if (active) setError(err.message ?? 'Could not load SMART Goals.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  function applyTemplate(key) {
    const template = TEMPLATES.find((item) => item.key === key) ?? TEMPLATES[0]
    setForm((current) => ({ ...current, templateKey: key, subject: requestedModule && template.key === 'general' ? requestedModule : template.subject, title: template.title, metricName: template.metricName, metricUnit: template.unit, baselineValue: String(template.baseline), targetValue: String(template.target), direction: template.direction, sourceType: template.sourceType || 'manual', sourceLabel: template.sourceLabel || '', specificStatement: '' }))
  }

  function chooseClass(classPeriodId) {
    const period = periods.find((item) => item.id === classPeriodId)
    setForm((current) => ({ ...current, classPeriodId, subject: period?.subject || current.subject }))
    setSelectedStudents([])
  }

  function toggleIndividuals(checked) {
    setForm((current) => ({ ...current, includeIndividuals: checked }))
    setSelectedStudents(checked ? classStudents.map((student) => student.id) : [])
  }

  async function submitGoal(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.metricName.trim() || !form.targetDate || !form.subject.trim()) return setError('Complete the goal title, measure, subject, and target date.')
    if (form.scope === 'class' && !form.classPeriodId) return setError('Choose the class this goal belongs to.')
    if (form.scope === 'grade' && !form.gradeLabel.trim()) return setError('Enter the grade level for this goal.')
    setCreating(true); setError(null)
    try {
      await createSmartGoal({ ...form, specificStatement: form.specificStatement.trim() || buildStatement(form, periods) }, form.includeIndividuals ? selectedStudents : [])
      setNotice({ type: 'success', message: 'SMART Goal saved.' })
      setForm(formForModule(requestedModule)); setSelectedStudents([]); setShowCreate(false)
      await load()
    } catch (err) { setError(err.message ?? 'Could not save the SMART Goal.') }
    finally { setCreating(false) }
  }

  async function saveProgress(goal) {
    const draft = progressDrafts[goal.id] ?? {}
    if (draft.value === '' || draft.value == null) return setError('Enter a progress value before saving.')
    setSavingGoalId(goal.id); setError(null)
    try {
      await addSmartGoalUpdate({ goalId: goal.id, value: draft.value, observedAt: draft.observedAt || TODAY, note: draft.note || '' })
      setNotice({ type: 'success', message: `Progress saved for “${goal.title}.”` })
      setProgressDrafts((current) => ({ ...current, [goal.id]: {} }))
      await load()
    } catch (err) { setError(err.message ?? 'Could not save progress.') }
    finally { setSavingGoalId(null) }
  }

  async function syncRunTracker(goal) {
    setSavingGoalId(goal.id); setError(null)
    try {
      const progress = await getRunTrackerClassProgress(goal.class_period_id, goal.source_label)
      await addSmartGoalUpdate({ goalId: goal.id, value: progress.current.value, observedAt: progress.current.observedAt, note: `Synced from Run Tracker · ${progress.current.studentCount} finish times` })
      setNotice({ type: 'success', message: `Run Tracker synced: ${formatValue(progress.current.value, 'seconds')} class average.` })
      await load()
    } catch (err) { setError(err.message ?? 'Could not sync Run Tracker.') }
    finally { setSavingGoalId(null) }
  }

  async function changeStatus(goalId, status) {
    setSavingGoalId(goalId)
    try { await updateSmartGoalStatus(goalId, status); await load() }
    catch (err) { setError(err.message ?? 'Could not update goal status.') }
    finally { setSavingGoalId(null) }
  }

  const showingAllSpecialties = Boolean(requestedModule && allViewModule === requestedModule)
  const visibleGoals = requestedModule && !showingAllSpecialties
    ? goals.filter((goal) => subjectMatchesFilter(goal.subject, requestedModule))
    : goals
  const activeGoals = visibleGoals.filter((goal) => goal.status !== 'archived')
  const achieved = activeGoals.filter((goal) => goal.status === 'achieved').length
  const needsSupport = activeGoals.filter((goal) => goal.status === 'needs_support').length

  function downloadCsv() {
    const rows = [['Goal', 'Scope', 'Subject', 'Measure', 'Baseline', 'Current', 'Target', 'Unit', 'Target date', 'Status', 'Student']]
    visibleGoals.forEach((goal) => {
      rows.push([goal.title, goal.scope, goal.subject, goal.metric_name, goal.baseline_value, currentValue(goal), goal.target_value, goal.metric_unit, goal.target_date, goal.status, 'Whole group'])
      ;(goal.smart_goal_students ?? []).forEach((studentGoal) => rows.push([goal.title, 'individual within group', goal.subject, goal.metric_name, studentGoal.baseline_value, studentGoal.current_value, studentGoal.target_value, goal.metric_unit, goal.target_date, studentGoal.status, studentGoal.students?.name_or_initials || 'Student']))
    })
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'plansk12-smart-goals.csv'; anchor.click(); URL.revokeObjectURL(href)
  }

  return <div className="space-y-6">
    <div className="no-print flex flex-wrap items-center justify-between gap-3">
      <Link to={moduleBackTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-100"><ArrowLeft size={15} /> {moduleBackLabel}</Link>
      <div className="flex flex-wrap gap-2"><button onClick={downloadCsv} disabled={!visibleGoals.length} className="btn-secondary"><Download size={16} /> CSV</button><button onClick={() => window.print()} className="btn-secondary"><Printer size={16} /> Print</button><button onClick={() => setShowCreate((value) => !value)} className="btn-primary"><Plus size={16} /> New SMART Goal</button></div>
    </div>

    <header><p className="label-eyebrow text-accent-500">{requestedModule ? `${requestedModule} · shared teacher workspace` : 'Shared teacher workspace'}</p><h1 className="mt-1 text-3xl font-bold text-ink-50">SMART Goals</h1><p className="mt-2 max-w-3xl text-ink-500">Create one measurable class or grade-level goal, keep optional personal targets inside it, and show improvement or regression with evidence over time.</p></header>

    {requestedModule && <section className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-500/20 bg-accent-500/5 px-4 py-3"><div><p className="text-sm font-semibold text-ink-100">{showingAllSpecialties ? 'Showing goals from all your specialties' : `Showing only ${requestedModule} goals`}</p><p className="mt-0.5 text-xs text-ink-500">New goals created here will stay connected to {requestedModule}.</p></div><button onClick={() => setAllViewModule(showingAllSpecialties ? null : requestedModule)} className="btn-secondary py-2 text-xs">{showingAllSpecialties ? `Show only ${requestedModule}` : 'View all specialties'}</button></section>}

    <div className="grid gap-3 sm:grid-cols-3"><SummaryCard Icon={Target} label="Active goals" value={activeGoals.length} color="text-accent-500" /><SummaryCard Icon={Check} label="Achieved" value={achieved} color="text-emerald-500" /><SummaryCard Icon={AlertCircle} label="Need support" value={needsSupport} color="text-amber-500" /></div>

    {notice && <p role="status" className={`rounded-xl border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-600'}`}>{notice.message}</p>}
    {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}

    {showCreate && <GoalForm form={form} setForm={setForm} periods={visiblePeriods} templates={templateOptions} lockedSubject={requestedModule} classStudents={classStudents} selectedStudents={selectedStudents} setSelectedStudents={setSelectedStudents} applyTemplate={applyTemplate} chooseClass={chooseClass} toggleIndividuals={toggleIndividuals} submitGoal={submitGoal} creating={creating} statement={buildStatement(form, periods)} />}

    {loading ? <p className="flex items-center gap-2 text-sm text-ink-500"><Loader2 size={16} className="animate-spin" /> Loading SMART Goals…</p> : activeGoals.length === 0 ? <div className="card p-8 text-center"><Target size={32} className="mx-auto text-accent-500" /><h2 className="mt-3 text-xl font-semibold">{requestedModule && !showingAllSpecialties ? `Create your first ${requestedModule} goal` : 'Create your first measurable goal'}</h2><p className="mx-auto mt-2 max-w-lg text-sm text-ink-500">Start with a template, attach a class or grade level, and add progress checks during the grading period.</p><button onClick={() => setShowCreate(true)} className="btn-primary mt-4"><Plus size={16} /> New SMART Goal</button></div> : <div className="space-y-4">{activeGoals.map((goal) => <GoalCard key={goal.id} goal={goal} expanded={expandedGoal === goal.id} onToggle={() => setExpandedGoal((current) => current === goal.id ? null : goal.id)} draft={progressDrafts[goal.id] ?? {}} setDraft={(draft) => setProgressDrafts((current) => ({ ...current, [goal.id]: draft }))} onSaveProgress={() => saveProgress(goal)} onSync={() => syncRunTracker(goal)} onStatus={(status) => changeStatus(goal.id, status)} saving={savingGoalId === goal.id} onStudentSaved={load} />)}</div>}
  </div>
}

function SummaryCard({ Icon, label, value, color }) {
  return <div className="card flex items-center gap-3 p-4"><div className="rounded-xl bg-ink-900/50 p-2.5"><Icon size={20} className={color} /></div><div><p className="text-2xl font-bold text-ink-50">{value}</p><p className="text-xs text-ink-500">{label}</p></div></div>
}

function GoalForm({ form, setForm, periods, templates, lockedSubject, classStudents, selectedStudents, setSelectedStudents, applyTemplate, chooseClass, toggleIndividuals, submitGoal, creating, statement }) {
  const field = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  return <form onSubmit={submitGoal} className="card space-y-5 p-5 sm:p-6">
    <div><p className="label-eyebrow text-accent-500">New goal</p><h2 className="mt-1 text-xl font-semibold">Build a measurable goal</h2></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-ink-300">Goal template<select value={form.templateKey} onChange={(event) => applyTemplate(event.target.value)} className="input-field mt-1">{templates.map((template) => <option key={template.key} value={template.key}>{template.key === 'general' && lockedSubject ? lockedSubject : template.subject} · {template.label}</option>)}</select></label><label className="text-sm font-medium text-ink-300">Scope<select value={form.scope} onChange={(event) => field('scope', event.target.value)} className="input-field mt-1"><option value="class">Whole class</option><option value="grade">Whole grade level</option></select></label></div>
    <div className="grid gap-4 sm:grid-cols-2">{form.scope === 'class' ? <label className="text-sm font-medium text-ink-300">Class<select value={form.classPeriodId} onChange={(event) => chooseClass(event.target.value)} className="input-field mt-1"><option value="">Choose a class…</option>{periods.map((period) => <option key={period.id} value={period.id}>{period.label} · {period.subject}</option>)}</select>{periods.length === 0 && <span className="mt-1 block text-xs font-normal text-ink-500">Add a {lockedSubject} class in Classes &amp; Rosters, or choose a whole grade-level goal.</span>}</label> : <label className="text-sm font-medium text-ink-300">Grade level<input value={form.gradeLabel} onChange={(event) => field('gradeLabel', event.target.value)} placeholder="e.g. 4 or 6–8" className="input-field mt-1" /></label>}<label className="text-sm font-medium text-ink-300">Subject / specialty<input value={form.subject} onChange={(event) => field('subject', event.target.value)} readOnly={Boolean(lockedSubject)} className="input-field mt-1" />{lockedSubject && <span className="mt-1 block text-xs font-normal text-ink-500">Set by the {lockedSubject} workspace.</span>}</label></div>
    <label className="block text-sm font-medium text-ink-300">Goal title<input value={form.title} onChange={(event) => field('title', event.target.value)} className="input-field mt-1" /></label>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-medium text-ink-300">Measure<input value={form.metricName} onChange={(event) => field('metricName', event.target.value)} className="input-field mt-1" /></label><label className="text-sm font-medium text-ink-300">Unit<select value={form.metricUnit} onChange={(event) => field('metricUnit', event.target.value)} className="input-field mt-1"><option value="percent">Percent</option><option value="seconds">Time (seconds)</option><option value="points">Points</option><option value="score">Score</option><option value="frequency">Frequency</option></select></label><label className="text-sm font-medium text-ink-300">Baseline<input type="number" step="any" value={form.baselineValue} onChange={(event) => field('baselineValue', event.target.value)} className="input-field mt-1" /></label><label className="text-sm font-medium text-ink-300">Target<input type="number" step="any" value={form.targetValue} onChange={(event) => field('targetValue', event.target.value)} className="input-field mt-1" /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-ink-300">Change direction<select value={form.direction} onChange={(event) => field('direction', event.target.value)} className="input-field mt-1"><option value="increase">Increase</option><option value="decrease">Decrease</option><option value="maintain">Maintain</option></select></label><label className="text-sm font-medium text-ink-300">Target date<input type="date" value={form.targetDate} onChange={(event) => field('targetDate', event.target.value)} className="input-field mt-1" /></label></div>
    {form.sourceType === 'run_tracker' && <div className="grid gap-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 sm:grid-cols-2"><div><p className="text-sm font-semibold text-ink-200">Run Tracker connection</p><p className="mt-1 text-xs text-ink-500">This goal can pull the newest class average from completed runs.</p></div><label className="text-sm font-medium text-ink-300">Distance label<input value={form.sourceLabel} onChange={(event) => field('sourceLabel', event.target.value)} placeholder="Half-mile or 1 mile" className="input-field mt-1" /></label></div>}
    <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4"><p className="text-xs font-bold uppercase tracking-wide text-accent-600">SMART statement preview</p><p className="mt-2 text-sm leading-relaxed text-ink-200">{statement}</p><textarea value={form.specificStatement} onChange={(event) => field('specificStatement', event.target.value)} placeholder="Optional: customize the statement above" className="input-field mt-3 min-h-20" /></div>
    {form.scope === 'class' && form.classPeriodId && <div className="rounded-xl border border-ink-800 p-4"><label className="flex items-start gap-3"><input type="checkbox" checked={form.includeIndividuals} onChange={(event) => toggleIndividuals(event.target.checked)} className="mt-1" /><span><strong className="block text-sm text-ink-200">Keep personal targets inside this class goal</strong><span className="text-xs text-ink-500">Create an individual progress row for selected students while preserving the whole-class goal.</span></span></label>{form.includeIndividuals && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{classStudents.map((student) => <label key={student.id} className="flex items-center gap-2 rounded-lg bg-ink-900/40 p-2 text-sm"><input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={(event) => setSelectedStudents((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id))} />{student.name_or_initials}</label>)}{classStudents.length === 0 && <p className="text-sm text-ink-500">No roster found for this class yet.</p>}</div>}</div>}
    <label className="block text-sm font-medium text-ink-300">Notes (optional)<textarea value={form.notes} onChange={(event) => field('notes', event.target.value)} className="input-field mt-1 min-h-20" /></label>
    <button type="submit" disabled={creating} className="btn-primary">{creating ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />} Save SMART Goal</button>
  </form>
}

function GoalChart({ goal }) {
  const points = [{ observed_at: goal.created_at?.slice(0, 10), value: goal.baseline_value }, ...(goal.smart_goal_updates ?? []).filter((item) => !item.student_id)]
  const values = points.map((point) => Number(point.value))
  const min = Math.min(...values, Number(goal.target_value)); const max = Math.max(...values, Number(goal.target_value)); const span = max - min || 1
  const coords = points.map((point, index) => `${points.length === 1 ? 8 : 8 + index * 84 / (points.length - 1)},${48 - (Number(point.value) - min) / span * 38}`).join(' ')
  return <div><svg viewBox="0 0 100 55" className="h-28 w-full" role="img" aria-label={`Progress trend for ${goal.title}`}><line x1="8" y1={48 - (Number(goal.target_value) - min) / span * 38} x2="92" y2={48 - (Number(goal.target_value) - min) / span * 38} stroke="currentColor" strokeDasharray="3 3" className="text-emerald-500" /><polyline points={coords} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-500" />{points.map((point, index) => { const [x, y] = coords.split(' ')[index].split(','); return <circle key={`${point.observed_at}-${index}`} cx={x} cy={y} r="2.5" fill="currentColor" className="text-accent-600" /> })}</svg><div className="flex justify-between text-[11px] text-ink-500"><span>Baseline {formatValue(goal.baseline_value, goal.metric_unit)}</span><span>Target {formatValue(goal.target_value, goal.metric_unit)}</span></div></div>
}

function GoalCard({ goal, expanded, onToggle, draft, setDraft, onSaveProgress, onSync, onStatus, saving, onStudentSaved }) {
  const progress = progressPercent(goal)
  const group = goal.scope === 'class' ? (goal.class_period_id ? 'Whole class' : 'Class') : `Grade ${goal.grade_label}`
  return <article className="card overflow-hidden"><div className="p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-bold text-accent-700">{group}</span><span className="rounded-full bg-ink-900/50 px-2.5 py-1 text-xs text-ink-500">{goal.subject}</span>{goal.source_type === 'run_tracker' && <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600">Run Tracker connected</span>}</div><h2 className="mt-3 text-xl font-semibold text-ink-50">{goal.title}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-400">{goal.specific_statement}</p></div><select value={goal.status} onChange={(event) => onStatus(event.target.value)} disabled={saving} className="input-field w-fit py-2 text-xs"><option value="active">Active</option><option value="achieved">Achieved</option><option value="needs_support">Needs support</option><option value="paused">Paused</option><option value="archived">Archive</option></select></div><div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]"><div><div className="flex flex-wrap items-end justify-between gap-2 text-sm"><p><strong className="text-ink-100">{formatValue(currentValue(goal), goal.metric_unit)}</strong> current · {formatValue(goal.target_value, goal.metric_unit)} target</p><p className={trendLabel(goal).startsWith('Regression') ? 'font-semibold text-amber-500' : 'font-semibold text-emerald-600'}>{trendLabel(goal)}</p></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-emerald-500" style={{ width: `${progress}%` }} /></div><div className="mt-1 flex justify-between text-xs text-ink-500"><span>{progress}% of goal change completed</span><span>Due {formatDate(goal.target_date)}</span></div></div><GoalChart goal={goal} /></div><button onClick={onToggle} className="btn-secondary mt-4 w-full justify-center">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {expanded ? 'Hide progress tools' : 'Update and view details'}</button></div>
    {expanded && <div className="border-t border-ink-800 bg-ink-900/20 p-5 sm:p-6"><div className="grid gap-5 lg:grid-cols-2"><section><h3 className="font-semibold text-ink-100">Add a group progress check</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm text-ink-400">Observed value<input type="number" step="any" value={draft.value ?? ''} onChange={(event) => setDraft({ ...draft, value: event.target.value })} className="input-field mt-1" /></label><label className="text-sm text-ink-400">Date<input type="date" value={draft.observedAt ?? TODAY} onChange={(event) => setDraft({ ...draft, observedAt: event.target.value })} className="input-field mt-1" /></label></div><label className="mt-3 block text-sm text-ink-400">Evidence or note<textarea value={draft.note ?? ''} onChange={(event) => setDraft({ ...draft, note: event.target.value })} className="input-field mt-1 min-h-20" /></label><div className="mt-3 flex flex-wrap gap-2"><button onClick={onSaveProgress} disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Save progress</button>{goal.source_type === 'run_tracker' && goal.class_period_id && <button onClick={onSync} disabled={saving} className="btn-secondary"><RefreshCw size={16} /> Sync Run Tracker</button>}</div></section><section><h3 className="font-semibold text-ink-100">Progress history</h3><div className="mt-3 space-y-2">{(goal.smart_goal_updates ?? []).filter((item) => !item.student_id).length ? (goal.smart_goal_updates ?? []).filter((item) => !item.student_id).map((update) => <div key={update.id} className="rounded-lg border border-ink-800 p-3 text-sm"><div className="flex justify-between gap-3"><strong>{formatValue(update.value, goal.metric_unit)}</strong><span className="text-xs text-ink-500">{formatDate(update.observed_at)}</span></div>{update.note && <p className="mt-1 text-xs text-ink-500">{update.note}</p>}</div>) : <p className="text-sm text-ink-500">No progress checks yet.</p>}</div></section></div>{(goal.smart_goal_students ?? []).length > 0 && <section className="mt-6 border-t border-ink-800 pt-5"><div className="flex items-center gap-2"><Users size={18} className="text-accent-500" /><div><h3 className="font-semibold text-ink-100">Personal targets within this goal</h3><p className="text-xs text-ink-500">These stay connected to the larger class goal.</p></div></div><div className="mt-3 grid gap-3 lg:grid-cols-2">{goal.smart_goal_students.map((studentGoal) => <StudentGoalRow key={studentGoal.id} studentGoal={studentGoal} goal={goal} onSaved={onStudentSaved} />)}</div></section>}</div>}
  </article>
}

function StudentGoalRow({ studentGoal, goal, onSaved }) {
  const [current, setCurrent] = useState(studentGoal.current_value ?? studentGoal.baseline_value ?? '')
  const [target, setTarget] = useState(studentGoal.target_value ?? goal.target_value)
  const [status, setStatus] = useState(studentGoal.status)
  const [saving, setSaving] = useState(false)
  async function save() { setSaving(true); try { await updateStudentGoal({ goalId: goal.id, studentId: studentGoal.student_id, currentValue: current, targetValue: target, status, notes: studentGoal.notes || '' }); await onSaved() } finally { setSaving(false) } }
  return <div className="rounded-xl border border-ink-800 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{studentGoal.students?.name_or_initials || 'Student'}</strong><span className="text-xs text-ink-500">Grade {studentGoal.students?.grade ?? '—'}</span></div><div className="mt-2 grid grid-cols-3 gap-2"><label className="text-[11px] text-ink-500">Current<input type="number" step="any" value={current} onChange={(event) => setCurrent(event.target.value)} className="input-field mt-1 px-2 py-1.5 text-xs" /></label><label className="text-[11px] text-ink-500">Target<input type="number" step="any" value={target} onChange={(event) => setTarget(event.target.value)} className="input-field mt-1 px-2 py-1.5 text-xs" /></label><label className="text-[11px] text-ink-500">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="input-field mt-1 px-2 py-1.5 text-xs"><option value="active">Active</option><option value="achieved">Achieved</option><option value="needs_support">Support</option><option value="paused">Paused</option></select></label></div><button onClick={save} disabled={saving} className="btn-secondary mt-2 w-full py-1.5 text-xs">{saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save student target</button></div>
}
