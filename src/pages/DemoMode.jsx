import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Footprints, Gauge, Play, RotateCcw, Sparkles, UsersRound, X } from 'lucide-react'

const STUDENTS = [
  ['Avery M.', '8:42', '-0:31', 88], ['Jordan R.', '9:18', '-0:22', 72], ['Casey L.', '10:04', '-0:48', 94], ['Morgan T.', '8:56', '-0:15', 65],
]
const PHASES = [
  ['Warm-Up', 'Dynamic movement circuit: high knees, lateral shuffle, and walking lunges.'],
  ['Pacing Practice', 'Partners complete four controlled laps. Call out each split and adjust pace, not effort.'],
  ['Half-Mile Run', 'Students use an even first lap and a strong final lap. Record both lap dots and finish time.'],
  ['Reflection', 'Compare today’s pacing to the personal goal. Name one strategy to repeat next time.'],
]

function DemoLogo() {
  return <Link to="/" className="flex items-center gap-2 text-lg font-bold"><span className="flex h-9 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">✓</span><span>Plans<span className="text-blue-500">K12</span></span></Link>
}

export default function DemoMode() {
  const [view, setView] = useState('today')
  const [phase, setPhase] = useState(0)

  return (
    <div className="force-light min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <DemoLogo />
          <div className="flex items-center gap-3"><span className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 sm:inline">FICTIONAL DEMO DATA</span><Link to="/login" className="btn-primary">Start free trial <ArrowRight size={15} /></Link></div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-bold text-teal-600">Interactive product tour</p><h1 className="mt-1 text-3xl font-bold">See a PE teacher’s day in PlansK12</h1><p className="mt-2 text-slate-600">Pine Ridge Middle School · Demo PE Class · Nothing here is real student information.</p></div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {[['today', CalendarDays, 'Today'], ['teach', Play, 'Teach'], ['progress', BarChart3, 'Progress']].map(([key, Icon, label]) => <button key={key} onClick={() => setView(key)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${view === key ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={15} />{label}</button>)}
          </div>
        </div>

        {view === 'today' && <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-600 p-6 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-100">Today · Tuesday, August 28</p><h2 className="mt-2 text-2xl font-bold">Good morning, Coach Taylor!</h2><p className="mt-1 text-teal-50">Everything you need for today’s classes.</p>
            <div className="mt-6 space-y-3">
              {[['Period 2 · Grade 6', 'Pacing for the Half-Mile', true], ['Period 4 · Grade 7', 'Cooperative Challenges', false], ['Period 6 · Grade 8', 'Cardiovascular Fitness Stations', false]].map(([period, title, active]) => <div key={period} className="flex flex-col gap-3 rounded-xl bg-white/95 p-4 text-slate-900 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase text-slate-500">{period}</p><p className="font-bold">{title}</p></div><button onClick={() => { setView('teach'); setPhase(0) }} className={active ? 'btn-primary' : 'btn-secondary'}><Play size={15} /> Teach now</button></div>)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <DemoQuick icon={UsersRound} color="text-emerald-600" title="Participation" text="Take daily grades in seconds" />
            <DemoQuick icon={Footprints} color="text-blue-600" title="Run Tracker" text="Track laps, times, and goals" />
            <DemoQuick icon={Sparkles} color="text-violet-600" title="Create a lesson" text="Standards-aligned and ready to teach" />
          </div>
        </section>}

        {view === 'teach' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-400">Teach now · Step {phase + 1} of {PHASES.length}</p><h2 className="text-xl font-bold">Pacing for the Half-Mile</h2></div><button onClick={() => setView('today')} className="rounded-lg p-2 hover:bg-slate-800"><X /></button></div>
          <div className="grid min-h-[470px] lg:grid-cols-[1fr_280px]">
            <div className="p-6 sm:p-10"><h3 className="text-4xl font-bold sm:text-5xl">{PHASES[phase][0]}</h3><p className="mt-8 max-w-3xl text-xl leading-relaxed text-slate-200 sm:text-2xl">{PHASES[phase][1]}</p><div className="mt-12 flex justify-between border-t border-slate-800 pt-5"><button disabled={phase === 0} onClick={() => setPhase((v) => v - 1)} className="btn-secondary"><ChevronLeft size={17} /> Previous</button><button disabled={phase === PHASES.length - 1} onClick={() => setPhase((v) => v + 1)} className="btn-primary">Next <ChevronRight size={17} /></button></div></div>
            <aside className="border-t border-slate-800 bg-slate-900 p-6 lg:border-l lg:border-t-0"><p className="text-xs font-bold uppercase text-teal-400">Class timer</p><p className="mt-2 font-mono text-5xl font-bold">06:24</p><div className="mt-4 flex gap-2"><button className="btn-primary"><Play size={16} /> Start</button><button className="btn-secondary"><RotateCcw size={16} /></button></div><div className="mt-7"><h4 className="font-bold">Equipment</h4><p className="mt-2 text-sm text-slate-300">Cones · Stopwatch · Lap cards · Pencils</p></div></aside>
          </div>
        </section>}

        {view === 'progress' && <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-teal-600">Half-mile progress</p><h2 className="text-2xl font-bold">Demo PE Class</h2></div><Gauge className="text-teal-600" /></div><div className="mt-6 space-y-4">{STUDENTS.map(([name, time, change, progress]) => <div key={name}><div className="flex justify-between text-sm"><span className="font-semibold">{name}</span><span>{time} <strong className="ml-2 text-emerald-600">{change}</strong></span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${progress}%` }} /></div></div>)}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><CheckCircle2 size={28} className="text-emerald-600" /><h3 className="mt-4 text-xl font-bold">SMART class goal</h3><p className="mt-2 text-slate-600">By October 15, 80% of students will improve their half-mile time by at least 20 seconds using consistent pacing.</p><div className="mt-5 rounded-xl bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-800">On track</p><p className="mt-1 text-sm text-emerald-700">72% are currently meeting the target pace.</p></div><button className="btn-secondary mt-5 w-full">Download CSV report</button></div>
        </section>}

        <div className="mt-7 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center"><p className="font-bold text-violet-950">This is only a guided sample. Your account uses your classes, lessons, preferences, and progress.</p><Link to="/login" className="btn-primary mt-3 inline-flex">Build my real workspace <ArrowRight size={16} /></Link></div>
      </main>
    </div>
  )
}

function DemoQuick({ icon: Icon, color, title, text }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon size={25} className={color} /><p className="mt-4 font-bold">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>
}
