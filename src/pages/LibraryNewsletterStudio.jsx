import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, BookHeart, BookOpen, CalendarDays, Check, Clipboard, Download,
  Library, Loader2, Mail, Newspaper, Palette, Printer, Save, Sparkles, Star, Users2,
} from 'lucide-react'
import { listReadingChallenges } from '../services/readingChallengeService'
import { createLibraryNewsletter, listLibraryNewsletters, updateLibraryNewsletter } from '../services/libraryNewsletterService'

const THEMES = {
  storybook: {
    label: 'Storybook', swatches: ['#1d4ed8', '#f472b6', '#fbbf24'],
    page: 'bg-[#fffaf1]', header: 'bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-600',
    accent: 'text-blue-700', block: 'border-blue-100 bg-blue-50/80', badge: 'bg-amber-300 text-amber-950',
  },
  garden: {
    label: 'Reading Garden', swatches: ['#047857', '#fb7185', '#a3e635'],
    page: 'bg-[#fbfff8]', header: 'bg-gradient-to-br from-emerald-700 via-teal-600 to-lime-600',
    accent: 'text-emerald-700', block: 'border-emerald-100 bg-emerald-50/80', badge: 'bg-rose-300 text-rose-950',
  },
  notebook: {
    label: 'Library Notebook', swatches: ['#7c3aed', '#38bdf8', '#f97316'],
    page: 'bg-[#fcfaff]', header: 'bg-gradient-to-br from-violet-700 via-fuchsia-600 to-rose-500',
    accent: 'text-violet-700', block: 'border-violet-100 bg-violet-50/80', badge: 'bg-sky-300 text-sky-950',
  },
}

const CONTENT_STARTERS = {
  family: {
    title: 'News from Our Library',
    greeting: 'Hello, library families!',
    intro: 'We have a wonderful month of reading, creating, and discovering ahead. Here are a few ways your family can join the fun.',
    spotlightTitle: 'Books we are loving',
    spotlight: 'The Wild Robot — Peter Brown\nThe One and Only Ivan — Katherine Applegate\nThe Book With No Pictures — B. J. Novak',
    eventsTitle: 'Coming up in the library',
    events: 'Family Reading Night — Thursday at 6:00 PM\nBook return reminder — every library day\nNew book voting — all month',
    tipTitle: 'Try this at home',
    tip: 'Ask your child to choose one character and explain what that character wanted most. There is no worksheet—just a good conversation.',
  },
  staff: {
    title: 'Library Collaboration Update',
    greeting: 'Hello, teachers!',
    intro: 'Here is what is happening in the library and how I can support your classroom learning this month.',
    spotlightTitle: 'Resources ready for you',
    spotlight: 'Book sets for research and genre study\nDigital citizenship mini-lessons\nMakerspace materials for curriculum connections',
    eventsTitle: 'Dates and reminders',
    events: 'Send collaboration requests by Friday\nLibrary orientation makeups next week\nNew database tutorials now available',
    tipTitle: 'Let’s collaborate',
    tip: 'Reply with an upcoming standard or unit topic. I can curate texts, plan a research lesson, or build a connected library activity.',
  },
}

const displayDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T12:00:00`))
}

export default function LibraryNewsletterStudio() {
  const monthValue = new Date().toISOString().slice(0, 7)
  const [audience, setAudience] = useState('family')
  const [themeKey, setThemeKey] = useState('storybook')
  const [libraryName, setLibraryName] = useState('Falcon Elementary Library')
  const [librarianName, setLibrarianName] = useState('Ms. Jones')
  const [month, setMonth] = useState(monthValue)
  const [content, setContent] = useState(CONTENT_STARTERS.family)
  const [challengeText, setChallengeText] = useState('Our readers have completed 22 books toward our Read Around the World goal. Keep those pages turning!')
  const [includeChallenge, setIncludeChallenge] = useState(true)
  const [copied, setCopied] = useState(false)
  const [savedNewsletters, setSavedNewsletters] = useState([])
  const [savedId, setSavedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    Promise.all([listReadingChallenges(), listLibraryNewsletters()]).then(([rows, newsletterRows]) => {
      setSavedNewsletters(newsletterRows)
      const active = rows.find((item) => item.status === 'active')
      if (!active) return
      const total = Object.values(active.progress ?? {}).reduce((sum, value) => sum + Number(value), 0)
      const unit = active.metric === 'minutes' ? 'minutes' : active.metric === 'pages' ? 'pages' : active.metric === 'genres' ? 'genres' : 'books'
      setChallengeText(`Our readers have completed ${total.toLocaleString()} ${unit} toward our “${active.title}” goal. Keep up the wonderful reading!`)
    }).catch(() => {})
  }, [])

  const theme = THEMES[themeKey]
  const issueLabel = displayDate(month)
  const plainText = useMemo(() => [
    content.title, `${libraryName} · ${issueLabel}`, '', content.greeting, content.intro, '',
    content.spotlightTitle.toUpperCase(), content.spotlight, '',
    includeChallenge ? `READING CHALLENGE UPDATE\n${challengeText}\n` : '',
    content.eventsTitle.toUpperCase(), content.events, '', content.tipTitle.toUpperCase(), content.tip, '',
    `— ${librarianName}`,
  ].filter(Boolean).join('\n'), [challengeText, content, includeChallenge, issueLabel, librarianName, libraryName])

  function switchAudience(nextAudience) {
    setAudience(nextAudience)
    setContent(CONTENT_STARTERS[nextAudience])
  }

  async function copyEmail() {
    await navigator.clipboard.writeText(plainText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  function draftPayload() {
    return { themeKey, libraryName, librarianName, content, challengeText, includeChallenge }
  }

  function loadDraft(id) {
    setSavedId(id)
    const saved = savedNewsletters.find((item) => item.id === id)
    if (!saved) return
    setAudience(saved.audience)
    setMonth(saved.issue_month)
    const draft = saved.draft ?? {}
    if (draft.themeKey) setThemeKey(draft.themeKey)
    if (draft.libraryName) setLibraryName(draft.libraryName)
    if (draft.librarianName) setLibrarianName(draft.librarianName)
    if (draft.content) setContent(draft.content)
    if (draft.challengeText !== undefined) setChallengeText(draft.challengeText)
    if (draft.includeChallenge !== undefined) setIncludeChallenge(draft.includeChallenge)
  }

  async function saveDraft() {
    setSaving(true)
    setSaveMessage('')
    try {
      const values = { title: content.title, audience, issueMonth: month, draft: draftPayload() }
      const saved = savedId ? await updateLibraryNewsletter(savedId, values) : await createLibraryNewsletter(values)
      setSavedId(saved.id)
      setSavedNewsletters((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      setSaveMessage('Saved in PlansK12')
    } catch (err) {
      setSaveMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-7">
      <style>{`@media print { body * { visibility: hidden !important; } .library-newsletter-print, .library-newsletter-print * { visibility: visible !important; } .library-newsletter-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; } }`}</style>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-200"><ArrowLeft size={14} /> Library &amp; Media</Link>
        <div className="flex flex-wrap gap-2">
          <button onClick={saveDraft} disabled={saving} className="btn-secondary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{saveMessage || 'Save draft'}</button>
          <button onClick={copyEmail} className="btn-secondary">{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? 'Copied!' : 'Copy for email'}</button>
          <button onClick={() => window.print()} className="btn-primary"><Printer size={15} /> Print or save PDF</button>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/15 via-fuchsia-500/10 to-cobalt-500/10 p-5 sm:p-8 print:hidden">
        <div aria-hidden="true" className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-rose-400/15 blur-3xl" />
        <div className="relative flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15"><Newspaper size={28} className="text-rose-400" /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-400">Library Newsletter Studio</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-50">Create something families will actually read.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">Build a polished parent or staff newsletter, pull in reading-challenge progress, and copy it into email or save it as a printable PDF.</p></div></div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-4 print:hidden">
          <section className="card p-5">
            <p className="label-eyebrow">1. Choose your audience</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => switchAudience('family')} className={`rounded-xl border p-3 text-left transition ${audience === 'family' ? 'border-rose-500 bg-rose-500/5' : 'border-ink-800'}`}><Mail size={18} className="text-rose-400" /><p className="mt-2 text-sm font-semibold text-ink-100">Families</p><p className="mt-0.5 text-[11px] text-ink-500">Warm, accessible, home connection</p></button>
              <button onClick={() => switchAudience('staff')} className={`rounded-xl border p-3 text-left transition ${audience === 'staff' ? 'border-cobalt-500 bg-cobalt-500/5' : 'border-ink-800'}`}><Users2 size={18} className="text-cobalt-400" /><p className="mt-2 text-sm font-semibold text-ink-100">Teachers &amp; staff</p><p className="mt-0.5 text-[11px] text-ink-500">Resources and collaboration</p></button>
            </div>
          </section>

          <section className="card p-5">
            <p className="label-eyebrow">Saved newsletters</p>
            <select value={savedId} onChange={(event) => loadDraft(event.target.value)} className="input-field mt-3"><option value="">New newsletter</option>{savedNewsletters.map((saved) => <option key={saved.id} value={saved.id}>{saved.title} · {displayDate(saved.issue_month)}</option>)}</select>
            <p className="mt-2 text-xs text-ink-500">Save a draft now, then reopen and update it next month.</p>
          </section>

          <section className="card p-5">
            <p className="label-eyebrow">2. Pick a cute look</p>
            <div className="mt-3 space-y-2">{Object.entries(THEMES).map(([key, option]) => <button key={key} onClick={() => setThemeKey(key)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${themeKey === key ? 'border-rose-500 bg-rose-500/5' : 'border-ink-800'}`}><span className="flex items-center gap-2"><Palette size={16} className="text-ink-500" /><span className="text-sm font-semibold text-ink-100">{option.label}</span></span><span className="flex gap-1">{option.swatches.map((color) => <span key={color} className="h-4 w-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />)}</span></button>)}</div>
          </section>

          <section className="card space-y-4 p-5">
            <p className="label-eyebrow">3. Make it yours</p>
            <label className="block text-xs font-medium text-ink-500">Library or school name<input value={libraryName} onChange={(event) => setLibraryName(event.target.value)} className="input-field mt-1" /></label>
            <label className="block text-xs font-medium text-ink-500">Your name<input value={librarianName} onChange={(event) => setLibrarianName(event.target.value)} className="input-field mt-1" /></label>
            <label className="block text-xs font-medium text-ink-500">Issue month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input-field mt-1" /></label>
            <label className="block text-xs font-medium text-ink-500">Headline<input value={content.title} onChange={(event) => setContent({ ...content, title: event.target.value })} className="input-field mt-1" /></label>
            <label className="block text-xs font-medium text-ink-500">Welcome message<textarea rows="4" value={`${content.greeting}\n${content.intro}`} onChange={(event) => { const [greeting, ...rest] = event.target.value.split('\n'); setContent({ ...content, greeting, intro: rest.join('\n') }) }} className="input-field mt-1 resize-y" /></label>
            <label className="block text-xs font-medium text-ink-500">Featured books or resources<textarea rows="4" value={content.spotlight} onChange={(event) => setContent({ ...content, spotlight: event.target.value })} className="input-field mt-1 resize-y" /></label>
            <label className="block text-xs font-medium text-ink-500">Events and reminders<textarea rows="4" value={content.events} onChange={(event) => setContent({ ...content, events: event.target.value })} className="input-field mt-1 resize-y" /></label>
            <label className="block text-xs font-medium text-ink-500">Closing tip or invitation<textarea rows="3" value={content.tip} onChange={(event) => setContent({ ...content, tip: event.target.value })} className="input-field mt-1 resize-y" /></label>
            <label className="flex items-start gap-3 rounded-xl border border-cobalt-500/20 bg-cobalt-500/5 p-3"><input type="checkbox" checked={includeChallenge} onChange={(event) => setIncludeChallenge(event.target.checked)} className="mt-1" /><span><span className="block text-sm font-semibold text-ink-100">Include Reading Challenge update</span><span className="mt-0.5 block text-xs text-ink-500">Automatically started from your active challenge; edit below.</span></span></label>
            {includeChallenge && <textarea rows="4" value={challengeText} onChange={(event) => setChallengeText(event.target.value)} className="input-field resize-y" aria-label="Reading challenge update" />}
          </section>
        </aside>

        <main>
          <div className="mb-3 flex items-center justify-between print:hidden"><div><p className="label-eyebrow">Live preview</p><p className="mt-1 text-xs text-ink-500">What you see is what families or staff will receive.</p></div><span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-ink-400">{audience === 'family' ? 'Family edition' : 'Staff edition'}</span></div>
          <article className={`library-newsletter-print mx-auto min-h-[900px] max-w-[760px] overflow-hidden rounded-[2rem] border border-black/5 shadow-2xl print:min-h-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none ${theme.page}`}>
            <header className={`relative overflow-hidden px-7 py-10 text-white sm:px-11 ${theme.header}`}>
              <div aria-hidden="true" className="absolute -right-7 -top-7 h-28 w-28 rounded-full border-[18px] border-white/10" /><div aria-hidden="true" className="absolute bottom-4 right-24 h-12 w-12 rotate-12 rounded-2xl bg-white/10" />
              <div className="relative"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/75"><Library size={16} /> {libraryName}</div><h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">{content.title}</h2><div className="mt-5 flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${theme.badge}`}>{issueLabel}</span><span className="text-sm font-medium text-white/75">From {librarianName}</span></div></div>
            </header>
            <div className="space-y-6 p-7 text-slate-700 sm:p-11">
              <section><p className={`text-xl font-black ${theme.accent}`}>{content.greeting}</p><p className="mt-2 whitespace-pre-line text-[15px] leading-7">{content.intro}</p></section>
              <div className="grid gap-5 md:grid-cols-2">
                <section className={`rounded-3xl border p-5 ${theme.block}`}><div className="flex items-center gap-2"><BookHeart size={20} className={theme.accent} /><h3 className={`font-black ${theme.accent}`}>{content.spotlightTitle}</h3></div><ul className="mt-3 space-y-2 text-sm leading-6">{content.spotlight.split('\n').filter(Boolean).map((item) => <li key={item} className="flex gap-2"><Star size={13} className="mt-1.5 shrink-0 fill-current text-amber-400" /><span>{item}</span></li>)}</ul></section>
                <section className={`rounded-3xl border p-5 ${theme.block}`}><div className="flex items-center gap-2"><CalendarDays size={20} className={theme.accent} /><h3 className={`font-black ${theme.accent}`}>{content.eventsTitle}</h3></div><ul className="mt-3 space-y-2 text-sm leading-6">{content.events.split('\n').filter(Boolean).map((item) => <li key={item} className="flex gap-2"><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${themeKey === 'garden' ? 'bg-emerald-500' : themeKey === 'notebook' ? 'bg-violet-500' : 'bg-blue-500'}`} /><span>{item}</span></li>)}</ul></section>
              </div>
              {includeChallenge && <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white"><div aria-hidden="true" className="absolute -right-6 -top-10 text-[110px] opacity-10">★</div><div className="relative flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-amber-950"><BookOpen size={22} /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Reading Challenge Update</p><p className="mt-2 text-[15px] leading-7 text-white/85">{challengeText}</p></div></div></section>}
              <section className="rounded-3xl border-2 border-dashed border-slate-200 p-6"><div className="flex items-center gap-2"><Sparkles size={20} className={theme.accent} /><h3 className={`font-black ${theme.accent}`}>{content.tipTitle}</h3></div><p className="mt-3 text-[15px] leading-7">{content.tip}</p></section>
              <footer className="border-t border-slate-200 pt-5 text-center"><p className="text-sm font-bold text-slate-700">Happy reading!</p><p className="mt-1 text-xs text-slate-500">{librarianName} · {libraryName}</p></footer>
            </div>
          </article>
          <div className="mt-4 flex flex-wrap justify-center gap-2 print:hidden"><button onClick={copyEmail} className="btn-secondary">{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? 'Copied!' : 'Copy as email'}</button><button onClick={() => window.print()} className="btn-primary"><Download size={15} /> Save as PDF</button></div>
        </main>
      </div>
    </div>
  )
}
