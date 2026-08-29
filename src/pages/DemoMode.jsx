import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, BookOpen, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Download, FileText, Footprints, Gauge, Palette, Pause, Play, Printer, RotateCcw, Scissors, Sparkles, Speech, Target, UsersRound, X } from 'lucide-react'
import { CHECKOUT_URL } from '../services/trialService'
import { track } from '../lib/analytics'

const STUDENTS = [
  ['Avery M.', '8:42', '-0:31', 88], ['Jordan R.', '9:18', '-0:22', 72], ['Casey L.', '10:04', '-0:48', 94], ['Morgan T.', '8:56', '-0:15', 65],
]
const PHASES = [
  ['Warm-Up', 'Dynamic movement circuit: high knees, lateral shuffle, and walking lunges.'],
  ['Pacing Practice', 'Partners complete four controlled laps. Call out each split and adjust pace, not effort.'],
  ['Half-Mile Run', 'Students use an even first lap and a strong final lap. Record both lap dots and finish time.'],
  ['Reflection', 'Compare today’s pacing to the personal goal. Name one strategy to repeat next time.'],
]
const DEMO_CSV = [['Student', 'Half-mile time', 'Improvement'], ...STUDENTS.map(([name, time, change]) => [name, time, change])]
  .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
  .join('\n')

function DemoLogo() {
  return <Link to="/" className="flex items-center gap-2 text-lg font-bold"><span className="flex h-9 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">✓</span><span>Plans<span className="text-blue-500">K12</span></span></Link>
}

export default function DemoMode() {
  const [demoArea, setDemoArea] = useState('pe')
  const [view, setView] = useState('today')
  const [phase, setPhase] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [featurePreview, setFeaturePreview] = useState(null)
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  useEffect(() => {
    track('demo_viewed')
  }, [])

  useEffect(() => {
    if (!timerRunning) return undefined
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [timerRunning])

  function changeView(next) {
    setView(next)
    track('demo_section_viewed', { section: next })
  }

  function formatTime(value) {
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
  }

  return (
    <div className="force-light min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <DemoLogo />
          <div className="flex items-center gap-2 sm:gap-3"><span className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 sm:inline">FICTIONAL DEMO DATA</span><a href={CHECKOUT_URL} onClick={() => track('demo_trial_clicked', { placement: 'header' })} className="btn-primary px-3 text-sm sm:px-4">Start free trial <ArrowRight size={15} /></a></div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Choose a teacher experience</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['pe', Footprints, 'PE & Health', 'Teach, track, and show growth'],
              ['art', Palette, 'Art', 'Plan, display, and assess'],
              ['elementary', Scissors, 'Elementary printable', 'Low-screen student materials'],
              ['support', Speech, 'SLP & Intervention', 'Sessions and progress evidence'],
            ].map(([key, Icon, label, detail]) => (
              <button key={key} type="button" onClick={() => { setDemoArea(key); track('demo_module_viewed', { module: key }) }} className={`rounded-xl border p-3 text-left transition ${demoArea === key ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}`}>
                <span className="flex items-center gap-2"><Icon size={18} className={demoArea === key ? 'text-blue-600' : 'text-slate-500'} /><strong className="text-sm">{label}</strong></span>
                <span className="mt-1 block text-xs text-slate-500">{detail}</span>
              </button>
            ))}
          </div>
        </div>

        {demoArea === 'pe' && <>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-bold text-teal-600">Interactive product tour</p><h1 className="mt-1 text-3xl font-bold leading-tight">See a PE teacher’s day in PlansK12</h1><p className="mt-2 text-slate-600">Pine Ridge Middle School · Demo PE Class · Nothing here is real student information.</p><p className="mt-3 text-sm font-semibold text-slate-700">Click Today, Teach, and Progress to explore the workflow.</p></div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {[['today', CalendarDays, 'Today'], ['teach', Play, 'Teach'], ['progress', BarChart3, 'Progress']].map(([key, Icon, label], index) => <button key={key} onClick={() => changeView(key)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold sm:flex-none sm:px-3 ${view === key ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={15} />{label}<span className="sr-only">Step {index + 1} of 3</span></button>)}
          </div>
        </div>

        {view === 'today' && <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-600 p-6 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-100">Today · {todayLabel}</p><h2 className="mt-2 text-2xl font-bold">Good morning, Coach Taylor!</h2><p className="mt-1 text-teal-50">Everything you need for today’s classes.</p>
            <div className="mt-6 space-y-3">
              {[['Period 2 · Grade 6', 'Pacing for the Half-Mile', true], ['Period 4 · Grade 7', 'Cooperative Challenges', false], ['Period 6 · Grade 8', 'Cardiovascular Fitness Stations', false]].map(([period, title, active]) => <div key={period} className="flex flex-col gap-3 rounded-xl bg-white/95 p-4 text-slate-900 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase text-slate-500">{period}</p><p className="font-bold">{title}</p></div><button onClick={() => { setView('teach'); setPhase(0) }} className={active ? 'btn-primary' : 'btn-secondary'}><Play size={15} /> Teach now</button></div>)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <DemoQuick onClick={() => setFeaturePreview('participation')} icon={UsersRound} color="text-emerald-600" title="Participation" text="Take daily grades in seconds" />
            <DemoQuick onClick={() => setFeaturePreview('run')} icon={Footprints} color="text-blue-600" title="Run Tracker" text="Track laps, times, and goals" />
            <DemoQuick onClick={() => setFeaturePreview('lesson')} icon={Sparkles} color="text-violet-600" title="Create a lesson" text="Standards-aligned and ready to teach" />
          </div>
        </section>}

        {view === 'teach' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-400">Teach now · Step {phase + 1} of {PHASES.length}</p><h2 className="text-xl font-bold">Pacing for the Half-Mile</h2></div><button onClick={() => setView('today')} className="rounded-lg p-2 hover:bg-slate-800"><X /></button></div>
          <div className="grid min-h-[470px] lg:grid-cols-[1fr_280px]">
            <div className="p-6 sm:p-10"><h3 className="text-4xl font-bold sm:text-5xl">{PHASES[phase][0]}</h3><p className="mt-8 max-w-3xl text-xl leading-relaxed text-slate-200 sm:text-2xl">{PHASES[phase][1]}</p><div className="mt-12 flex justify-between border-t border-slate-800 pt-5"><button disabled={phase === 0} onClick={() => setPhase((v) => v - 1)} className="btn-secondary"><ChevronLeft size={17} /> Previous</button><button disabled={phase === PHASES.length - 1} onClick={() => setPhase((v) => v + 1)} className="btn-primary">Next <ChevronRight size={17} /></button></div></div>
            <aside className="border-t border-slate-800 bg-slate-900 p-6 lg:border-l lg:border-t-0"><p className="text-xs font-bold uppercase text-teal-400">Class timer</p><p className="mt-2 font-mono text-5xl font-bold tabular-nums">{formatTime(seconds)}</p><div className="mt-4 flex gap-2"><button onClick={() => setTimerRunning((value) => !value)} className="btn-primary">{timerRunning ? <Pause size={16} /> : <Play size={16} />} {timerRunning ? 'Pause' : 'Start'}</button><button aria-label="Reset timer" onClick={() => { setTimerRunning(false); setSeconds(0) }} className="btn-secondary"><RotateCcw size={16} /></button></div><div className="mt-7"><h4 className="font-bold">Equipment</h4><p className="mt-2 text-sm text-slate-300">Cones · Stopwatch · Lap cards · Pencils</p></div></aside>
          </div>
        </section>}

        {view === 'progress' && <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-teal-600">Half-mile progress</p><h2 className="text-2xl font-bold">Demo PE Class</h2></div><Gauge className="text-teal-600" /></div><div className="mt-6 space-y-4">{STUDENTS.map(([name, time, change, progress]) => <div key={name}><div className="flex justify-between text-sm"><span className="font-semibold">{name}</span><span>{time} <strong className="ml-2 text-emerald-600">{change}</strong></span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${progress}%` }} /></div></div>)}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><CheckCircle2 size={28} className="text-emerald-600" /><h3 className="mt-4 text-xl font-bold">SMART class goal</h3><p className="mt-2 text-slate-600">By October 15, 80% of students will improve their half-mile time by at least 20 seconds using consistent pacing.</p><div className="mt-5 rounded-xl bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-800">On track</p><p className="mt-1 text-sm text-emerald-700">72% are currently meeting the target pace.</p></div><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(DEMO_CSV)}`} download="plansk12-demo-half-mile-progress.csv" onClick={() => track('demo_csv_downloaded')} className="btn-secondary mt-5 w-full"><Download size={16} /> Download sample CSV</a></div>
        </section>}
        </>}

        {demoArea === 'art' && <ArtDemo />}
        {demoArea === 'elementary' && <ElementaryPrintableDemo />}
        {demoArea === 'support' && <SupportDemo />}

        <div className="mt-7 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center"><p className="font-bold text-violet-950">Ready to use your own classes, lessons, preferences, and progress?</p><p className="mt-1 text-sm text-violet-800">Try every PlansK12 tool free for 7 days, then $9.99/month. Cancel anytime.</p><a href={CHECKOUT_URL} onClick={() => track('demo_trial_clicked', { placement: 'footer' })} className="btn-primary mt-3 inline-flex">Start my 7-day free trial <ArrowRight size={16} /></a><p className="mt-3 text-xs text-violet-700">Already have an account? <Link to="/login" className="font-semibold underline">Log in</Link></p></div>
      </main>
      {featurePreview && <FeaturePreview type={featurePreview} onClose={() => setFeaturePreview(null)} />}
    </div>
  )
}

function ArtDemo() {
  const [tab, setTab] = useState('plan')
  const tabs = [['plan', BookOpen, 'Teacher plan'], ['materials', Palette, 'Student display'], ['assess', ClipboardCheck, 'Assessment']]
  return <section>
    <div className="mb-6"><p className="text-sm font-bold text-rose-600">Interactive Art demo</p><h1 className="mt-1 text-3xl font-bold">From blank page to studio-ready lesson</h1><p className="mt-2 text-slate-600">Grade 4 · Warm and cool color landscapes · Fictional demonstration</p></div>
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Explore the lesson kit</p><div className="mt-3 space-y-2">{tabs.map(([key, Icon, label]) => <button key={key} onClick={() => setTab(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold ${tab === key ? 'bg-rose-600 text-white' : 'text-slate-700 hover:bg-rose-50'}`}><Icon size={18} />{label}<ArrowRight size={15} className="ml-auto" /></button>)}</div><div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900"><strong>Teacher prep:</strong> 8 watercolor sets, heavy paper, water cups, brushes, drying rack, and two landscape references.</div></aside>
      <div className="min-h-[480px] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
        {tab === 'plan' && <div><p className="text-xs font-bold uppercase tracking-wide text-rose-600">Teacher at-a-glance</p><h2 className="mt-1 text-2xl font-bold">Warm and Cool Color Landscapes</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Gather', 'Watercolors · paper · brushes'], ['Set up', 'Demo table + drying area'], ['Safety', 'Carry water with two hands']].map(([label, text]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm">{text}</p></div>)}</div><div className="mt-6 space-y-4">{[['1', 'Notice', 'Compare the feeling created by warm and cool colors.'], ['2', 'Watch', 'See wet-on-wet blending without muddying colors.'], ['3', 'Create', 'Paint foreground, middle ground, and background.'], ['4', 'Reflect', 'Name one color choice that supports the mood.']].map(([number, title, text]) => <div key={number} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700">{number}</span><div><p className="font-bold">{title}</p><p className="text-sm text-slate-600">{text}</p></div></div>)}</div></div>}
        {tab === 'materials' && <div><p className="text-xs font-bold uppercase tracking-wide text-violet-600">Student-facing visual</p><h2 className="mt-1 text-2xl font-bold">Color Creates Mood</h2><div className="mt-6 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-gradient-to-br from-red-500 via-orange-400 to-yellow-300 p-6 text-white shadow"><p className="text-2xl font-black">WARM</p><p className="mt-2 font-semibold">energy · sunlight · excitement</p></div><div className="rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-violet-500 p-6 text-white shadow"><p className="text-2xl font-black">COOL</p><p className="mt-2 font-semibold">calm · shade · distance</p></div></div><div className="mt-6 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 p-5"><p className="font-bold text-violet-900">Your challenge</p><p className="mt-1 text-violet-800">Choose mostly warm or mostly cool colors. Make your landscape communicate one clear mood.</p></div><p className="mt-5 text-sm text-slate-500">This display is concise for students; the detailed teaching language stays in speaker notes.</p></div>}
        {tab === 'assess' && <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Quick assessment</p><h2 className="mt-1 text-2xl font-bold">Three-point studio check</h2><div className="mt-6 overflow-hidden rounded-xl border border-slate-200">{[['Color choice', 'Warm/cool palette supports an intentional mood'], ['Space', 'Foreground, middle ground, and background are visible'], ['Reflection', 'Student explains one artistic choice']].map(([skill, evidence], index) => <div key={skill} className={`grid gap-2 p-4 sm:grid-cols-[150px_1fr_auto] ${index ? 'border-t border-slate-200' : ''}`}><strong>{skill}</strong><span className="text-sm text-slate-600">{evidence}</span><span className="w-fit rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Ready to observe</span></div>)}</div><div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold">Exit reflection</p><p className="mt-1 text-slate-600">“My color choices make the landscape feel ___ because ___.”</p></div></div>}
      </div>
    </div>
  </section>
}

function ElementaryPrintableDemo() {
  const [resource, setResource] = useState('sort')
  const [completed, setCompleted] = useState(false)
  const options = [['sort', 'Picture sort', 'Living or nonliving'], ['cut', 'Cut & paste', 'Sequence a plant life cycle'], ['centers', 'Center cards', 'Four independent stations']]
  return <section>
    <div className="mb-6"><p className="text-sm font-bold text-amber-600">Interactive elementary demo</p><h1 className="mt-1 text-3xl font-bold">Useful without adding screen time</h1><p className="mt-2 text-slate-600">Choose a printable and preview what students would actually receive.</p></div>
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Choose a resource</p><div className="mt-3 space-y-2">{options.map(([key, label, detail]) => <button key={key} onClick={() => { setResource(key); setCompleted(false) }} className={`w-full rounded-xl border p-3 text-left ${resource === key ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'}`}><strong className="block">{label}</strong><span className="text-xs text-slate-500">{detail}</span></button>)}</div><button onClick={() => { window.print(); track('demo_print_clicked', { module: 'elementary' }) }} className="btn-secondary mt-5 w-full"><Printer size={16} /> Print sample</button></aside>
      <div className="rounded-2xl bg-slate-200 p-3 shadow-inner sm:p-6"><div className="mx-auto min-h-[560px] max-w-2xl bg-white p-6 shadow-xl sm:p-9"><div className="border-b-2 border-slate-900 pb-3"><p className="text-xs font-bold uppercase tracking-widest text-amber-600">PlansK12 student printable · Grade 1</p><h2 className="mt-1 text-2xl font-black">{resource === 'sort' ? 'Living or Nonliving?' : resource === 'cut' ? 'How a Plant Grows' : 'Science Discovery Centers'}</h2><p className="mt-1 text-sm">Name: ____________________  Date: ____________</p></div>{resource === 'sort' && <div className="mt-6"><p className="font-bold">Draw a line from each item to the correct group.</p><div className="mt-5 grid grid-cols-2 gap-4">{[['🌻', 'sunflower'], ['🪨', 'rock'], ['🐞', 'ladybug'], ['🧸', 'toy bear']].map(([icon, label]) => <button key={label} onClick={() => setCompleted(true)} className={`rounded-xl border-2 p-4 text-center ${completed ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}`}><span className="text-4xl">{icon}</span><span className="mt-2 block font-bold capitalize">{label}</span></button>)}</div><div className="mt-6 grid grid-cols-2 gap-4"><div className="rounded-xl border-2 border-emerald-500 p-4 text-center font-black text-emerald-800">LIVING</div><div className="rounded-xl border-2 border-blue-500 p-4 text-center font-black text-blue-800">NONLIVING</div></div></div>}{resource === 'cut' && <div className="mt-6"><p className="font-bold">Cut out the cards. Glue them in order from 1 to 4.</p><div className="mt-6 grid grid-cols-2 gap-4">{[['🌱', 'A sprout appears'], ['🌻', 'The plant flowers'], ['🫘', 'A seed is planted'], ['🪴', 'Leaves grow']].map(([icon, label]) => <div key={label} className="rounded-xl border-2 border-dashed border-slate-400 p-4 text-center"><span className="text-4xl">{icon}</span><p className="mt-2 font-bold">{label}</p></div>)}</div></div>}{resource === 'centers' && <div className="mt-6 grid gap-4 sm:grid-cols-2">{[['1', 'SORT', 'Sort picture cards into living and nonliving.'], ['2', 'BUILD', 'Use blocks to design a habitat.'], ['3', 'DRAW', 'Draw what a living thing needs.'], ['4', 'EXPLAIN', 'Tell a partner how you know it is living.']].map(([number, title, text]) => <div key={number} className="rounded-xl border-2 border-slate-900 p-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 font-black">{number}</span><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-2 text-sm">{text}</p></div>)}</div>}{completed && <p className="mt-5 rounded-lg bg-emerald-100 p-3 text-center font-bold text-emerald-800"><Check size={17} className="mr-1 inline" />Interactive sample selected—printed copies remain pencil-and-paper.</p>}</div></div>
    </div>
  </section>
}

function SupportDemo() {
  const [service, setService] = useState('slp')
  const [checked, setChecked] = useState([])
  const [noteSaved, setNoteSaved] = useState(false)
  const activities = service === 'slp'
    ? ['Listen-and-do first/then warm-up', 'Barrier-game direction practice', 'Classroom carryover and student self-rating']
    : ['Phoneme-grapheme review', 'Word-building with letter tiles', 'Decodable reading and one-minute check']
  function toggleActivity(index) { setChecked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]) }
  return <section>
    <div className="mb-6"><p className="text-sm font-bold text-indigo-600">Interactive specialist demo</p><h1 className="mt-1 text-3xl font-bold">Plan the session and capture usable evidence</h1><p className="mt-2 text-slate-600">Fictional group data only · No names or protected student information</p></div>
    <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><button onClick={() => { setService('slp'); setChecked([]); setNoteSaved(false) }} className={`rounded-lg px-4 py-2 text-sm font-bold ${service === 'slp' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}><Speech size={16} className="mr-1.5 inline" />SLP session</button><button onClick={() => { setService('intervention'); setChecked([]); setNoteSaved(false) }} className={`rounded-lg px-4 py-2 text-sm font-bold ${service === 'intervention' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}><BookOpen size={16} className="mr-1.5 inline" />Reading intervention</button></div>
    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{service === 'slp' ? 'Grade 3 language group' : 'Grade 2 decoding group'}</p><h2 className="mt-1 text-2xl font-bold">{service === 'slp' ? 'Following two-step directions' : 'Short-vowel word building'}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">30 min</span></div><div className="mt-6 space-y-3">{activities.map((activity, index) => <button key={activity} onClick={() => toggleActivity(index)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${checked.includes(index) ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-indigo-300'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${checked.includes(index) ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>{checked.includes(index) ? <Check size={16} /> : index + 1}</span><span><strong className="block">{activity}</strong><span className="text-xs text-slate-500">Tap when completed in this demo</span></span></button>)}</div><div className="mt-6 rounded-xl bg-indigo-50 p-4"><p className="text-sm font-bold text-indigo-900">Built-in support</p><p className="mt-1 text-sm text-indigo-800">{service === 'slp' ? 'Visual first/then card, one repetition, and optional gesture cue.' : 'Continuous blending prompt, reduced word set, and immediate corrective feedback.'}</p></div></div>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Target size={24} className="text-indigo-600" /><h3 className="mt-3 text-lg font-bold">Progress evidence</h3><p className="mt-1 text-sm text-slate-600">{checked.length} of {activities.length} activities completed</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${checked.length / activities.length * 100}%` }} /></div><div className="mt-5 rounded-xl border border-slate-200 p-3"><p className="text-xs font-bold uppercase text-slate-500">Observation note</p><p className="mt-2 text-sm text-slate-700">{service === 'slp' ? 'Group followed two-step directions with visual support in 4 of 5 opportunities.' : 'Group accurately blended 8 of 10 short-vowel words with one verbal prompt.'}</p></div><button onClick={() => setNoteSaved(true)} className="btn-primary mt-4 w-full"><FileText size={16} /> Save demo note</button>{noteSaved && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><CheckCircle2 size={16} className="mr-1 inline" />Saved to fictional progress history</p>}<p className="mt-5 text-xs leading-relaxed text-slate-500">PlansK12 supports professional planning and documentation. Specialists still apply their own judgment and required district practices.</p></aside>
    </div>
  </section>
}

function DemoQuick({ icon: Icon, color, title, text, onClick }) {
  return <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"><Icon size={25} className={color} /><p className="mt-4 font-bold">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p><p className="mt-3 text-xs font-bold text-teal-600">Try the preview →</p></button>
}

function FeaturePreview({ type, onClose }) {
  const content = {
    participation: { title: 'Participation grading', body: <div className="space-y-2">{[['Avery M.', '100'], ['Jordan R.', '95 · shoes'], ['Casey L.', '50 · did not participate']].map(([name, grade]) => <div key={name} className="flex justify-between rounded-lg bg-slate-50 p-3"><strong>{name}</strong><span>{grade}</span></div>)}<p className="pt-2 text-sm text-slate-600">Daily deductions automatically roll into the weekly average.</p></div> },
    run: { title: 'Live lap tracking', body: <div><p className="text-sm text-slate-600">Tap a dot each time a student completes a lap.</p><div className="mt-4 flex gap-3">{[1, 2, 3, 4].map((lap) => <span key={lap} className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${lap < 4 ? 'bg-blue-600 text-white' : 'border-2 border-blue-200 text-blue-600'}`}>{lap}</span>)}</div><p className="mt-4 font-semibold">3 of 4 laps · 06:41 elapsed</p></div> },
    lesson: { title: 'Ready-to-teach lesson', body: <div className="space-y-3"><p className="rounded-lg bg-violet-50 p-3 font-semibold text-violet-900">Grade 6 · 45 minutes · Cardiovascular endurance</p><p className="text-sm text-slate-600">Standards, warm-up, equipment, safety, instruction, modifications, assessment, and closure are created together.</p><p className="text-sm font-bold text-emerald-700">✓ Saved to your lesson library</p></div> },
  }[type]
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-600">Interactive preview</p><h2 className="mt-1 text-xl font-bold">{content.title}</h2></div><button aria-label="Close preview" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={19} /></button></div><div className="mt-5">{content.body}</div><button onClick={onClose} className="btn-primary mt-6 w-full">Continue exploring</button></div></div>
}
