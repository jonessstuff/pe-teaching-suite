import { useMemo, useState } from 'react'
import {
  ClipboardList, FileStack, Flag, IdCard, LayoutGrid, ListChecks, Printer,
} from 'lucide-react'

const KIT_OPTIONS = [
  { key: 'teacher', title: 'Teacher Plan', description: 'Timing, rotation, setup, featured books, and follow-up', Icon: ClipboardList },
  { key: 'passports', title: 'Student Passports', description: 'One complete tasting passport—choose the number of copies when printing', Icon: IdCard },
  { key: 'stations', title: 'Station Cards', description: 'A guided sampling card for every featured book', Icon: LayoutGrid },
  { key: 'signs', title: 'Table Signs', description: 'Large, easy-to-see signs for each tasting station', Icon: Flag },
  { key: 'slips', title: 'Book Choice Slips', description: 'Four checkout or reservation choices per page', Icon: ListChecks },
  { key: 'complete', title: 'Complete Kit', description: 'Every teacher and student printable in one PDF', Icon: FileStack },
]

const stationMinutes = (inputs) => Math.max(5, Math.floor(Number(inputs.minutes || 45) / Math.max(1, Number(inputs.stations || 4))))
const genreLabel = (book) => book.genres?.filter(Boolean).slice(0, 2).join(' · ') || book.format || 'Featured read'

function PrintHeader({ inputs, label }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-4 border-b-2 border-amber-500 pb-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">PlansK12 · Book Tasting Studio</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">{inputs.title}</h2>
        <p className="mt-1 text-xs font-semibold text-slate-600">{inputs.theme} · Grade {inputs.grade} · {inputs.minutes} minutes</p>
      </div>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">{label}</span>
    </header>
  )
}

function TeacherPlan({ inputs, books }) {
  return (
    <section className="kit-sheet">
      <PrintHeader inputs={inputs} label="Teacher plan" />
      <div className="grid grid-cols-2 gap-4">
        <section className="kit-panel">
          <h3>Run of show</h3>
          <ol className="kit-numbered">
            <li><strong>Welcome — 3 minutes:</strong> Explain that readers will sample, not finish, each book.</li>
            <li><strong>Rotate — {stationMinutes(inputs)} minutes per station:</strong> Study the cover, read the summary, sample a page, and complete the passport.</li>
            <li><strong>Choose — 5 minutes:</strong> Record a first choice and one backup.</li>
            <li><strong>Share — 3 minutes:</strong> Invite a quick table recommendation.</li>
          </ol>
        </section>
        <section className="kit-panel">
          <h3>Setup checklist</h3>
          {['One featured book at each station', 'Station card and large table sign', 'One passport and pencil per reader', 'Clearly labeled book return spot', 'Timer or projected countdown', 'Optional tablecloths, menus, or battery candles'].map((item) => <p key={item} className="kit-check">□ {item}</p>)}
        </section>
        <section className="kit-panel col-span-2">
          <h3>Featured books and rotation</h3>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
            {books.map((book, index) => <div key={book.id || `${book.title}-${index}`} className="flex gap-3 border-b border-slate-200 pb-2"><strong className="text-amber-700">{index + 1}</strong><div><p className="font-bold text-slate-950">{book.title}</p><p className="text-xs text-slate-600">{book.author} · {genreLabel(book)}</p></div></div>)}
          </div>
        </section>
        <section className="kit-panel">
          <h3>Student groups</h3>
          {books.map((_, index) => <p key={index} className="mt-3 border-b border-slate-300 pb-1 text-xs text-slate-700">Group {index + 1}: __________________________________</p>)}
        </section>
        <section className="kit-panel">
          <h3>After the tasting</h3>
          {['Tally first and backup choices.', 'Reserve popular titles fairly.', 'Create a display from the most-requested genres.', 'Use passports for future recommendations.'].map((item) => <p key={item} className="kit-check">□ {item}</p>)}
          <p className="mt-4 text-xs font-bold text-slate-700">Notes</p>
          <div className="mt-2 h-16 rounded-lg border border-dashed border-slate-300" />
        </section>
      </div>
    </section>
  )
}

function StudentPassport({ inputs, books }) {
  return (
    <section className="kit-sheet">
      <PrintHeader inputs={inputs} label="Student tasting passport" />
      <div className="mb-4 grid grid-cols-[1fr_180px] gap-4 text-sm font-bold text-slate-800">
        <p>Name: <span className="inline-block w-60 border-b border-slate-500" /></p>
        <p>Date: <span className="inline-block w-24 border-b border-slate-500" /></p>
      </div>
      <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">At every station: notice the cover, sample a page, and capture your honest first impression. You do not have to love every book!</p>
      <div className="grid grid-cols-2 gap-4">
        {books.map((book, index) => <section key={book.id || `${book.title}-${index}`} className="kit-panel min-h-[225px]">
          <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Station {index + 1}</p><h3 className="mt-1">{book.title}</h3><p className="text-xs text-slate-600">by {book.author}</p></div><span className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900">{genreLabel(book)}</span></div>
          <p className="kit-write-line">Three words: __________________________________</p>
          <p className="kit-write-line">A detail that made me curious:</p>
          <div className="mt-1 h-8 border-b border-slate-300" />
          <p className="mt-3 text-xs font-bold text-slate-800">Would I keep reading?</p>
          <p className="mt-1 text-xs text-slate-700">○ Not yet &nbsp;&nbsp; ○ Maybe &nbsp;&nbsp; ○ Yes, please!</p>
        </section>)}
      </div>
      <section className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
        <h3 className="font-black text-amber-950">My next-read choices</h3>
        <div className="mt-3 grid grid-cols-2 gap-6 text-sm text-slate-800"><p>First choice: ______________________________</p><p>Backup choice: ____________________________</p></div>
        <p className="mt-4 text-sm text-slate-800">The book I would recommend to someone else is __________________________ because ________________________________.</p>
      </section>
    </section>
  )
}

function StationCards({ inputs, books }) {
  return (
    <section className="kit-sheet">
      <PrintHeader inputs={inputs} label="Station cards" />
      <p className="mb-4 text-xs text-slate-600">Place one card beside each featured book. Two cards are designed to fit on each printed page.</p>
      <div className="grid grid-cols-2 gap-5">
        {books.map((book, index) => <article key={book.id || `${book.title}-${index}`} className="kit-cut-card min-h-[335px]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Station {index + 1}</p>
          <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">{book.title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">by {book.author}</p>
          <span className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{genreLabel(book)}</span>
          <ol className="mt-5 space-y-3 text-sm text-slate-800">
            <li><strong>1.</strong> Study the cover. What clues do you notice?</li>
            <li><strong>2.</strong> Read the summary or inside flap.</li>
            <li><strong>3.</strong> Sample one page chosen by your librarian.</li>
            <li><strong>4.</strong> Complete this station in your passport.</li>
          </ol>
          <p className="mt-5 rounded-xl bg-slate-100 p-3 text-center text-sm font-black text-slate-900">Would you keep reading? Why?</p>
        </article>)}
      </div>
    </section>
  )
}

function TableSigns({ inputs, books }) {
  return (
    <section className="kit-sheet">
      <PrintHeader inputs={inputs} label="Table signs" />
      <div className="grid grid-cols-2 gap-5">
        {books.map((book, index) => <article key={book.id || `${book.title}-${index}`} className="kit-cut-card flex min-h-[300px] flex-col items-center justify-center text-center">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-700">Taste at station {index + 1}</p>
          <h3 className="mt-6 text-3xl font-black leading-tight text-slate-950">{book.title}</h3>
          <p className="mt-3 text-lg font-semibold text-slate-600">{book.author}</p>
          <span className="mt-6 rounded-full bg-amber-100 px-5 py-2 text-sm font-black text-amber-900">{genreLabel(book)}</span>
          <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-500">Look · Sample · Notice · Decide</p>
        </article>)}
      </div>
    </section>
  )
}

function ChoiceSlips({ inputs }) {
  return (
    <section className="kit-sheet">
      <PrintHeader inputs={inputs} label="Book choice slips" />
      <p className="mb-4 text-xs text-slate-600">Cut into four slips. Use these for checkout, holds, or a librarian follow-up list.</p>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((number) => <article key={number} className="kit-cut-card min-h-[285px]">
          <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">My next read</p><span className="text-xs font-bold text-slate-400">#{number}</span></div>
          <p className="kit-slip-line">Name: ____________________________________</p>
          <p className="kit-slip-line">Class/teacher: _____________________________</p>
          <p className="kit-slip-line"><strong>First choice:</strong> _____________________________</p>
          <p className="kit-slip-line"><strong>Backup choice:</strong> __________________________</p>
          <p className="mt-4 text-xs font-bold text-slate-800">What made you choose it?</p>
          <div className="mt-2 h-12 rounded-lg border border-dashed border-slate-300" />
          <div className="mt-4 flex gap-4 text-xs text-slate-700"><span>□ Check out now</span><span>□ Place on hold</span><span>□ Save for later</span></div>
        </article>)}
      </div>
    </section>
  )
}

function Printable({ active, inputs, books }) {
  const views = {
    teacher: <TeacherPlan inputs={inputs} books={books} />,
    passports: <StudentPassport inputs={inputs} books={books} />,
    stations: <StationCards inputs={inputs} books={books} />,
    signs: <TableSigns inputs={inputs} books={books} />,
    slips: <ChoiceSlips inputs={inputs} />,
  }
  if (active !== 'complete') return views[active]
  return <>{views.teacher}{views.passports}{views.stations}{views.signs}{views.slips}</>
}

export default function BookTastingPrintKit({ inputs, books }) {
  const [active, setActive] = useState('teacher')
  const activeOption = KIT_OPTIONS.find((option) => option.key === active) ?? KIT_OPTIONS[5]
  const usableBooks = useMemo(() => books.slice(0, Number(inputs.stations) || 4), [books, inputs.stations])

  return (
    <section className="space-y-5 print:contents">
      <style>{`
        .kit-panel { border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px; color: #0f172a; }
        .kit-panel h3 { color: #0f172a; font-size: 15px; font-weight: 900; }
        .kit-numbered { margin-top: 10px; display: grid; gap: 9px; font-size: 12px; color: #334155; }
        .kit-check { margin-top: 8px; font-size: 12px; color: #334155; }
        .kit-write-line, .kit-slip-line { margin-top: 13px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 12px; color: #334155; }
        .kit-cut-card { break-inside: avoid; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; color: #0f172a; }
        @media print {
          @page { size: letter portrait; margin: 0.42in; }
          .book-tasting-print, .book-tasting-print * { visibility: visible !important; }
          .book-tasting-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; background: white !important; }
          .kit-sheet { min-height: 9.65in; break-after: page; background: white !important; padding: 0 !important; }
          .kit-sheet:last-child { break-after: auto; }
        }
      `}</style>

      <div className="print:hidden">
        <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="label-eyebrow text-amber-400">Your Book Tasting Kit</p><h2 className="mt-1 text-2xl font-black text-ink-50">Everything ready to print and use</h2><p className="mt-2 max-w-2xl text-sm text-ink-500">Choose one printable to preview, or open the complete kit. Every page uses your event details and selected catalog books.</p></div>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">6 printable choices</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {KIT_OPTIONS.map(({ key, title, description, Icon }) => <button key={key} type="button" onClick={() => setActive(key)} aria-label={title} aria-pressed={active === key} className={`group min-h-28 rounded-2xl border p-4 text-left transition ${active === key ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-950/10' : 'border-ink-800 bg-ink-950/60 hover:border-amber-500/35 hover:bg-amber-500/5'}`}>
              <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><Icon size={20} /></span><span><span className="block text-sm font-black text-ink-50">{title}</span><span className="mt-1 block text-xs leading-relaxed text-ink-500">{description}</span></span></div>
            </button>)}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div><p className="label-eyebrow">Printable preview</p><p className="mt-1 text-sm font-bold text-ink-100">{activeOption.title}</p></div>
          <button type="button" onClick={() => window.print()} className="btn-primary"><Printer size={16} /> Print {activeOption.title.toLowerCase()} or save PDF</button>
        </div>
      </div>

      <article className="book-tasting-print overflow-x-auto rounded-3xl border border-ink-800 bg-white p-5 shadow-sm sm:p-8 print:overflow-visible print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="mx-auto min-w-[720px] max-w-[850px] print:min-w-0 print:max-w-none">
          <Printable active={active} inputs={inputs} books={usableBooks} />
        </div>
      </article>
    </section>
  )
}
