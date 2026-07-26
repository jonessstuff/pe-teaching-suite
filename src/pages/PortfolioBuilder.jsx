import { useEffect, useState } from 'react'
import { ALL_TEACHER_SUBJECTS } from '../constants/toolSubjects'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Briefcase, Loader2, Trash2, Plus, Printer, Wand2, Check, Save } from 'lucide-react'
import { generatePortfolio } from '../services/generationService'
import { createPortfolio, updatePortfolio, listPortfolios, getPortfolio, deletePortfolio } from '../services/portfolioService'
import { listLessons } from '../services/lessonsService'
import { useTrial } from '../context/TrialContext'

const SUBJECTS = ALL_TEACHER_SUBJECTS

function SectionHeader({ label }) {
  return <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-3">{label}</h3>
}

export default function PortfolioBuilder() {
  const navigate = useNavigate()
  const { requestExport } = useTrial()
  const [view, setView] = useState('list')
  const [portfolios, setPortfolios] = useState(null)
  const [lessons, setLessons] = useState([])
  const [portfolioId, setPortfolioId] = useState(null)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')

  const [form, setForm] = useState({
    title: '',
    subject: 'PE & Health',
    yearsTeaching: '',
    teachingPhilosophy: '',
    philosophySeeds: '',
    selectedLessonIds: [],
    reflections: {},
    studentWorkExamples: '',
    professionalGoals: '',
  })
  const [genStatus, setGenStatus] = useState('idle')

  useEffect(() => {
    listPortfolios().then(setPortfolios).catch(e => setError(e.message))
    listLessons().then(setLessons).catch(() => {})
  }, [])

  async function openPortfolio(p) {
    try {
      const full = await getPortfolio(p.id)
      setPortfolioId(full.id)
      setForm({
        title: full.title ?? '',
        subject: full.subject ?? 'PE & Health',
        yearsTeaching: full.years_teaching ?? '',
        teachingPhilosophy: full.teaching_philosophy ?? '',
        philosophySeeds: '',
        selectedLessonIds: full.selected_lesson_ids ?? [],
        reflections: full.reflections ?? {},
        studentWorkExamples: full.student_work_examples ?? '',
        professionalGoals: full.professional_goals ?? '',
      })
      setView('edit')
    } catch (e) {
      setError(e.message)
    }
  }

  function startNew() {
    setPortfolioId(null)
    setForm({ title: '', subject: 'PE & Health', yearsTeaching: '', teachingPhilosophy: '', philosophySeeds: '', selectedLessonIds: [], reflections: {}, studentWorkExamples: '', professionalGoals: '' })
    setSaveStatus('idle')
    setView('edit')
  }

  async function handleGeneratePhilosophy() {
    setGenStatus('generating')
    try {
      const result = await generatePortfolio({ subject: form.subject, yearsTeaching: form.yearsTeaching, philosophySeeds: form.philosophySeeds })
      setForm(f => ({ ...f, teachingPhilosophy: result.teaching_philosophy }))
    } catch (e) {
      setError(e.message)
    } finally {
      setGenStatus('idle')
    }
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      const payload = {
        title: form.title || `Portfolio — ${form.subject}`,
        subject: form.subject,
        yearsTeaching: form.yearsTeaching,
        teachingPhilosophy: form.teachingPhilosophy,
        selectedLessonIds: form.selectedLessonIds,
        reflections: form.reflections,
        studentWorkExamples: form.studentWorkExamples,
        professionalGoals: form.professionalGoals,
      }
      if (portfolioId) {
        await updatePortfolio(portfolioId, payload)
      } else {
        const saved = await createPortfolio(payload)
        setPortfolioId(saved.id)
        setPortfolios(prev => [{ id: saved.id, title: payload.title, created_at: saved.created_at }, ...(prev ?? [])])
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (e) {
      setError(e.message)
      setSaveStatus('idle')
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!window.confirm('Delete this portfolio?')) return
    await deletePortfolio(id)
    setPortfolios(prev => prev.filter(p => p.id !== id))
  }

  function toggleLesson(id) {
    setForm(f => ({
      ...f,
      selectedLessonIds: f.selectedLessonIds.includes(id)
        ? f.selectedLessonIds.filter(x => x !== id)
        : [...f.selectedLessonIds, id],
    }))
  }

  if (view === 'edit') {
    const selectedLessons = lessons.filter(l => form.selectedLessonIds.includes(l.id))
    return (
      <div className="space-y-8 print:text-gray-900">
        <div className="flex items-center gap-3 flex-wrap print:hidden">
          <button type="button" onClick={() => setView('list')} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200">
            <ArrowLeft size={14} /> My Portfolios
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={async () => { if (await requestExport()) window.print() }} className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200">
              <Printer size={14} className="inline mr-1" />Print
            </button>
            <button type="button" onClick={handleSave} disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-fuchsia-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-fuchsia-400 disabled:opacity-50 transition-colors">
              <Save size={14} />
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save portfolio'}
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 print:hidden">{error}</p>}

        <div className="space-y-8 max-w-3xl">
          {/* Section 1: Identity */}
          <div className="card p-6 space-y-4 print:border-gray-300">
            <SectionHeader label="Portfolio Identity" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1.5 print:text-gray-700">Portfolio title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 2025–26 Teaching Portfolio"
                  className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-fuchsia-500 print:border-gray-400 print:bg-white print:text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1.5 print:text-gray-700">Years teaching</label>
                <input value={form.yearsTeaching} onChange={e => setForm(f => ({ ...f, yearsTeaching: e.target.value }))}
                  placeholder="e.g. 8 years"
                  className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-fuchsia-500 print:border-gray-400 print:bg-white print:text-gray-900" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-2 print:text-gray-700">Subject</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => (
                  <button key={s} type="button" onClick={() => setForm(f => ({ ...f, subject: s }))}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors print:hidden ${form.subject === s ? 'border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-400' : 'border-ink-700 text-ink-500 hover:border-ink-500'}`}>
                    {s}
                  </button>
                ))}
                <p className="hidden print:block text-sm text-gray-900">{form.subject}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Teaching Philosophy */}
          <div className="card p-6 space-y-4 print:border-gray-300">
            <SectionHeader label="Teaching Philosophy" />
            <div className="print:hidden">
              <label className="block text-sm font-medium text-ink-300 mb-1.5">Seed ideas for AI draft (optional)</label>
              <textarea value={form.philosophySeeds} onChange={e => setForm(f => ({ ...f, philosophySeeds: e.target.value }))} rows={2}
                placeholder="e.g. student-centered movement, joy of play, social-emotional learning…"
                className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-fuchsia-500 resize-y" />
              <button type="button" onClick={handleGeneratePhilosophy} disabled={genStatus === 'generating'}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 px-3 py-1.5 text-sm text-fuchsia-400 hover:bg-fuchsia-500/25 disabled:opacity-50 transition-colors">
                {genStatus === 'generating' ? <><Loader2 size={14} className="animate-spin" /> Drafting…</> : <><Wand2 size={14} /> AI draft philosophy</>}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5 print:text-gray-700">Teaching philosophy</label>
              <textarea value={form.teachingPhilosophy} onChange={e => setForm(f => ({ ...f, teachingPhilosophy: e.target.value }))} rows={8}
                placeholder="Write your teaching philosophy here, or use the AI draft button above…"
                className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-fuchsia-500 resize-y print:border-gray-400 print:bg-white print:text-gray-900" />
            </div>
          </div>

          {/* Section 3: Selected Lessons */}
          <div className="card p-6 space-y-4 print:border-gray-300">
            <SectionHeader label="Featured Lessons" />
            {lessons.length > 0 && (
              <div className="print:hidden space-y-2">
                <p className="text-xs text-ink-500 mb-2">Select lessons to feature in your portfolio</p>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-ink-800 p-2">
                  {lessons.map(l => (
                    <label key={l.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-200/30 cursor-pointer">
                      <input type="checkbox" checked={form.selectedLessonIds.includes(l.id)} onChange={() => toggleLesson(l.id)}
                        className="accent-fuchsia-500" />
                      <span className="text-sm text-ink-700">{l.meta?.title || l.lesson_object?.title || l.id}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {selectedLessons.length > 0 ? (
              <div className="space-y-3">
                {selectedLessons.map(lesson => {
                  const title = lesson.meta?.title || lesson.lesson_object?.title || 'Lesson'
                  return (
                    <div key={lesson.id} className="rounded-lg border border-ink-800 p-4 space-y-2 print:border-gray-300">
                      <p className="font-semibold text-ink-50 print:text-gray-900">{title}</p>
                      <div>
                        <label className="block text-xs font-medium text-ink-500 mb-1 print:text-gray-600">Reflection</label>
                        <textarea
                          value={form.reflections[lesson.id] ?? ''}
                          onChange={e => setForm(f => ({ ...f, reflections: { ...f.reflections, [lesson.id]: e.target.value } }))}
                          rows={3} placeholder="What went well? What would you change? What student learning evidence do you have?"
                          className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-fuchsia-500 resize-y print:border-gray-300 print:bg-white print:text-gray-900" />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-ink-600">No lessons selected. Use the checkbox list above to feature lessons.</p>
            )}
          </div>

          {/* Section 4: Student Work */}
          <div className="card p-6 space-y-4 print:border-gray-300">
            <SectionHeader label="Student Work Examples" />
            <textarea value={form.studentWorkExamples} onChange={e => setForm(f => ({ ...f, studentWorkExamples: e.target.value }))} rows={5}
              placeholder="Describe student work examples you would include: written reflections, skill assessments, video links, artwork, compositions, projects…"
              className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-fuchsia-500 resize-y print:border-gray-400 print:bg-white print:text-gray-900" />
          </div>

          {/* Section 5: Professional Goals */}
          <div className="card p-6 space-y-4 print:border-gray-300">
            <SectionHeader label="Professional Goals" />
            <textarea value={form.professionalGoals} onChange={e => setForm(f => ({ ...f, professionalGoals: e.target.value }))} rows={5}
              placeholder="Describe your professional development goals for the coming year: skills to grow, resources to pursue, collaborations to build…"
              className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-fuchsia-500 resize-y print:border-gray-400 print:bg-white print:text-gray-900" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 mb-3">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15">
              <Briefcase size={20} className="text-fuchsia-400" />
            </div>
            <h1 className="text-2xl font-semibold text-ink-50">Portfolio Builder</h1>
          </div>
        </div>
        <button type="button" onClick={startNew}
          className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-400 transition-colors">
          <Plus size={16} /> New portfolio
        </button>
      </div>

      {!portfolios && <div className="flex items-center gap-2 text-ink-400 text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {portfolios?.length === 0 && (
        <div className="card p-8 text-center">
          <Briefcase size={32} className="mx-auto mb-3 text-ink-600" />
          <p className="font-medium text-ink-300 mb-1">No portfolios yet</p>
          <p className="text-sm text-ink-600 mb-4">Build a professional teaching portfolio with AI-drafted philosophy, lesson reflections, and goals.</p>
          <button type="button" onClick={startNew}
            className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-400 transition-colors">
            <Plus size={16} /> Create portfolio
          </button>
        </div>
      )}

      {portfolios && portfolios.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map(p => (
            <div key={p.id} onClick={() => openPortfolio(p)}
              className="card group flex flex-col gap-3 p-5 cursor-pointer hover:border-fuchsia-500/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15">
                  <Briefcase size={20} className="text-fuchsia-400" />
                </div>
                <button type="button" onClick={e => handleDelete(p.id, e)}
                  className="text-ink-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="font-semibold text-ink-50">{p.title}</p>
              <p className="text-xs text-ink-600">{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
