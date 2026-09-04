import { useMemo, useState } from 'react'
import { ClipboardCheck, FileStack, Image, Megaphone, MessageSquareText, Printer, Signpost } from 'lucide-react'

const OPTIONS = [
  { key: 'teacher', title: 'Teacher Event Plan', desc: 'Vision, display map, timeline, supplies, volunteers, and final checks', Icon: ClipboardCheck },
  { key: 'labels', title: 'Artwork Labels', desc: 'Six matched gallery labels per page from the artwork list', Icon: Image },
  { key: 'statements', title: 'Artist Statements', desc: 'Student-friendly reflection prompts ready for display', Icon: MessageSquareText },
  { key: 'promotion', title: 'Invitations & Promotion', desc: 'Invitation, newsletter copy, and social post', Icon: Megaphone },
  { key: 'signs', title: 'Signs & Wayfinding', desc: 'Welcome, grade-zone, direction, and gallery-care signs', Icon: Signpost },
  { key: 'checklists', title: 'Setup & Volunteer Kit', desc: 'Task lists, volunteer assignments, and missing-artwork tracker', Icon: ClipboardCheck },
  { key: 'complete', title: 'Complete Art Show Kit', desc: 'All teacher, student, family, and display materials in one PDF', Icon: FileStack },
]

function Header({ inputs, label }) {
  return <header className="mb-5 flex items-end justify-between gap-4 border-b-4 border-coral-500 pb-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-coral-700">PlansK12 · Art Show Studio</p><h2 className="mt-1 text-2xl font-black text-slate-950">{inputs.title}</h2><p className="mt-1 text-xs font-semibold text-slate-600">{inputs.theme} · {inputs.date || 'Date coming soon'} · {inputs.location}</p></div><span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-900">{label}</span></header>
}

function TeacherPlan({ inputs, plan }) {
  return <section className="art-kit-sheet"><Header inputs={inputs} label="Teacher event plan" /><div className="grid grid-cols-2 gap-4">{plan.sections.map((section, index) => <section key={section.title} className={`art-kit-panel ${index === 1 ? 'col-span-2' : ''}`}><h3>{section.title}</h3><div className="mt-2 space-y-2">{section.items.map((item) => <p key={item} className="text-xs leading-relaxed text-slate-700">□ {item}</p>)}</div></section>)}</div></section>
}

function ArtworkLabels({ inputs, artworks }) {
  const rows = artworks.length ? artworks : Array.from({ length: 6 }, (_, index) => ({ id: `blank-${index}`, student: 'Student artist', grade: 'Grade / Class', title: 'Artwork title', medium: 'Medium' }))
  return <section className="art-kit-sheet"><Header inputs={inputs} label="Artwork labels" /><p className="mb-4 text-xs text-slate-600">Cut along the dashed borders. Verify names and titles against school display policy before mounting.</p><div className="grid grid-cols-2 gap-4">{rows.map((art, index) => <article key={art.id || index} className="art-cut-card min-h-[185px]"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-coral-700">Student gallery label</p><h3 className="mt-4 text-xl font-black italic text-slate-950">{art.title}</h3><p className="mt-3 text-base font-bold text-slate-800">{art.student}</p><p className="mt-1 text-xs text-slate-600">{art.grade}</p><p className="mt-4 border-t border-slate-200 pt-3 text-sm font-semibold text-slate-700">{art.medium}</p></article>)}</div></section>
}

function ArtistStatements({ inputs, artworks }) {
  const rows = artworks.length ? artworks : Array.from({ length: 2 }, (_, index) => ({ id: `statement-${index}`, student: '', grade: '', title: '' }))
  return <section className="art-kit-sheet"><Header inputs={inputs} label="Artist statements" /><div className="grid grid-cols-2 gap-4">{rows.map((art, index) => <article key={art.id || index} className="art-cut-card min-h-[360px]"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-coral-700">My artist statement</p><h3 className="mt-2 text-lg font-black text-slate-950">{art.title || 'My artwork'}</h3><p className="mt-1 text-xs text-slate-600">Artist: {art.student || '________________________'} &nbsp; {art.grade}</p><p className="art-write">My idea or inspiration was…</p><div className="art-lines" /><p className="art-write">I used these materials, choices, or techniques…</p><div className="art-lines" /><p className="art-write">Something I want viewers to notice is…</p><div className="art-lines" /><p className="art-write">I am proud of…</p><div className="art-lines" /></article>)}</div></section>
}

function Promotion({ inputs, plan }) {
  return <section className="art-kit-sheet"><Header inputs={inputs} label="Invitations & promotion" /><div className="grid grid-cols-2 gap-4"><section className="art-kit-panel col-span-2 bg-gradient-to-br from-rose-50 to-amber-50 text-center"><p className="text-xs font-black uppercase tracking-[0.24em] text-coral-700">You’re invited</p><h3 className="mt-3 text-3xl font-black text-slate-950">{inputs.title}</h3><p className="mt-2 text-lg italic text-slate-700">{inputs.theme}</p><p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-800">{plan.invitation}</p></section><section className="art-kit-panel"><h3>Family/staff newsletter</h3><p className="mt-3 text-sm leading-6 text-slate-700">{plan.newsletter}</p></section><section className="art-kit-panel"><h3>Social post</h3><p className="mt-3 text-sm leading-6 text-slate-700">{plan.social}</p><p className="mt-5 text-xs font-bold text-slate-500">Confirm school photo and student-name policies before posting.</p></section></div></section>
}

function Signs({ inputs, plan }) {
  const zones = plan.sections.find((section) => section.title === 'Display map')?.items ?? []
  return <section className="art-kit-sheet"><Header inputs={inputs} label="Signs & wayfinding" /><div className="grid grid-cols-2 gap-5"><article className="art-sign col-span-2"><p className="text-sm font-black uppercase tracking-[0.3em] text-coral-700">Welcome to</p><h3 className="mt-4 text-5xl font-black text-slate-950">{inputs.title}</h3><p className="mt-4 text-xl italic text-slate-600">Celebrating {inputs.theme}</p></article>{zones.map((zone, index) => <article key={zone} className="art-sign"><p className="text-xs font-black uppercase tracking-wider text-coral-700">Gallery zone {index + 1}</p><h3 className="mt-3 text-2xl font-black text-slate-950">{zone.split(':')[0]}</h3><p className="mt-3 text-sm text-slate-600">This way →</p></article>)}<article className="art-sign"><h3 className="text-2xl font-black text-slate-950">Please look—do not touch</h3><p className="mt-3 text-sm text-slate-600">Help us protect every student artist’s work.</p></article><article className="art-sign"><h3 className="text-2xl font-black text-slate-950">Share a kind response</h3><p className="mt-3 text-sm text-slate-600">I notice… &nbsp; I wonder… &nbsp; This reminds me of…</p></article></div></section>
}

function Checklists({ inputs, plan, artworks }) {
  const timeline = plan.sections.find((section) => section.title === 'Setup timeline')?.items ?? []
  const volunteers = plan.sections.find((section) => section.title === 'Volunteer jobs')?.items ?? []
  return <section className="art-kit-sheet"><Header inputs={inputs} label="Setup & volunteer kit" /><div className="grid grid-cols-2 gap-4"><section className="art-kit-panel"><h3>Master setup checklist</h3>{timeline.map((item) => <p key={item} className="mt-2 text-xs leading-relaxed text-slate-700">□ {item}</p>)}</section><section className="art-kit-panel"><h3>Volunteer assignments</h3>{volunteers.map((item) => <p key={item} className="mt-2 border-b border-slate-200 pb-2 text-xs leading-relaxed text-slate-700">□ {item}<br />Assigned to: __________________</p>)}</section><section className="art-kit-panel col-span-2"><h3>Artwork intake and missing-information tracker</h3><div className="mt-3 grid grid-cols-[1.2fr_.6fr_1fr_.8fr_.45fr] gap-2 border-b-2 border-slate-300 pb-2 text-[10px] font-black uppercase text-slate-600"><span>Student/ID</span><span>Class</span><span>Title</span><span>Medium</span><span>Ready</span></div>{(artworks.length ? artworks : Array.from({ length: 8 }, (_, index) => ({ id: index, student: '', grade: '', title: '', medium: '' }))).map((art) => <div key={art.id} className="grid grid-cols-[1.2fr_.6fr_1fr_.8fr_.45fr] gap-2 border-b border-slate-200 py-2 text-xs text-slate-700"><span>{art.student || '________________'}</span><span>{art.grade || '______'}</span><span>{art.title || '____________'}</span><span>{art.medium || '________'}</span><span>□</span></div>)}</section></div></section>
}

function PrintView({ active, inputs, plan, artworks }) {
  const views = { teacher: <TeacherPlan inputs={inputs} plan={plan} />, labels: <ArtworkLabels inputs={inputs} artworks={artworks} />, statements: <ArtistStatements inputs={inputs} artworks={artworks} />, promotion: <Promotion inputs={inputs} plan={plan} />, signs: <Signs inputs={inputs} plan={plan} />, checklists: <Checklists inputs={inputs} plan={plan} artworks={artworks} /> }
  if (active !== 'complete') return views[active]
  return <>{views.teacher}{views.labels}{views.statements}{views.promotion}{views.signs}{views.checklists}</>
}

export default function ArtShowPrintKit({ inputs, plan, artworks }) {
  const [active, setActive] = useState('teacher')
  const option = useMemo(() => OPTIONS.find((item) => item.key === active) ?? OPTIONS[0], [active])
  return <section className="space-y-5 print:contents"><style>{`
    .art-kit-panel { border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px; color: #0f172a; }
    .art-kit-panel h3 { color: #0f172a; font-size: 15px; font-weight: 900; }
    .art-cut-card { break-inside: avoid; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; color: #0f172a; }
    .art-write { margin-top: 16px; font-size: 12px; font-weight: 800; color: #334155; }
    .art-lines { height: 44px; margin-top: 4px; background: repeating-linear-gradient(to bottom, transparent 0, transparent 20px, #cbd5e1 21px); }
    .art-sign { break-inside: avoid; min-height: 210px; border: 3px solid #fb7185; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    @media print { @page { size: letter portrait; margin: .42in; } .art-show-print, .art-show-print * { visibility: visible !important; } .art-show-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; background: white !important; } .art-kit-sheet { min-height: 9.65in; break-after: page; background: white !important; } .art-kit-sheet:last-child { break-after: auto; } }
  `}</style><div className="print:hidden"><div className="rounded-3xl border border-coral-500/25 bg-gradient-to-br from-coral-500/15 via-rose-500/10 to-amber-500/5 p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="label-eyebrow text-coral-400">Your Art Show Kit</p><h2 className="mt-1 text-2xl font-black text-ink-50">From idea to opening night</h2><p className="mt-2 max-w-2xl text-sm text-ink-500">Preview and print each resource separately, or download the complete event kit.</p></div><span className="rounded-full bg-coral-500/15 px-3 py-1 text-xs font-bold text-coral-400">7 printable choices</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{OPTIONS.map(({ key, title, desc, Icon }) => <button key={key} type="button" aria-label={title} aria-pressed={active === key} onClick={() => setActive(key)} className={`min-h-28 rounded-2xl border p-4 text-left transition ${active === key ? 'border-coral-400 bg-coral-500/15' : 'border-ink-800 bg-ink-950/60 hover:border-coral-500/35'}`}><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-500/15 text-coral-400"><Icon size={20} /></span><span><span className="block text-sm font-black text-ink-50">{title}</span><span className="mt-1 block text-xs leading-relaxed text-ink-500">{desc}</span></span></div></button>)}</div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><p className="label-eyebrow">Printable preview</p><p className="mt-1 text-sm font-bold text-ink-100">{option.title}</p></div><button type="button" onClick={() => window.print()} className="btn-primary"><Printer size={16} /> Print {option.title.toLowerCase()} or save PDF</button></div></div><article className="art-show-print overflow-x-auto rounded-3xl border border-ink-800 bg-white p-5 shadow-sm sm:p-8 print:overflow-visible print:rounded-none print:border-0 print:p-0 print:shadow-none"><div className="mx-auto min-w-[720px] max-w-[850px] print:min-w-0 print:max-w-none"><PrintView active={active} inputs={inputs} plan={plan} artworks={artworks} /></div></article></section>
}
