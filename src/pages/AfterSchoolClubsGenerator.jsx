import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PartyPopper, Sparkles, Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import { generateAfterSchoolClubs } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import AfterSchoolClubsRenderer from '../components/renderers/AfterSchoolClubsRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

// Grouped for the <select> optgroups. Values MUST match VALID_CLUBS in the
// edge function / CLUBS in afterSchoolClubsPrompt.js.
const CLUB_GROUPS = [
  {
    label: 'Sports (rec-level)',
    options: [
      { value: 'basketball', label: 'Basketball (rec)' },
      { value: 'volleyball', label: 'Volleyball (rec)' },
      { value: 'soccer', label: 'Soccer (rec)' },
      { value: 'flag_football', label: 'Flag football' },
      { value: 'pickleball', label: 'Pickleball' },
      { value: 'badminton', label: 'Badminton' },
      { value: 'table_tennis', label: 'Table tennis' },
      { value: 'ultimate_frisbee', label: 'Ultimate frisbee' },
      { value: 'bowling', label: 'Bowling' },
      { value: 'archery', label: 'Archery' },
    ],
  },
  {
    label: 'Academic & Enrichment',
    options: [
      { value: 'dnd', label: 'D&D / tabletop gaming' },
      { value: 'stem', label: 'STEM club' },
      { value: 'robotics', label: 'Robotics' },
      { value: 'coding', label: 'Coding / game design' },
      { value: 'debate', label: 'Debate' },
      { value: 'model_un', label: 'Model UN' },
      { value: 'quiz_bowl', label: 'Quiz bowl / academic team' },
      { value: 'book_club', label: 'Book club' },
      { value: 'creative_writing', label: 'Creative writing' },
      { value: 'chess', label: 'Chess' },
      { value: 'math_team', label: 'Math team' },
      { value: 'lego_club', label: 'Lego club' },
      { value: 'foreign_language', label: 'Foreign language club (Spanish, French…)' },
      { value: 'resume_club', label: 'Resume writing (MS/HS)' },
      { value: 'entrepreneurship', label: 'Entrepreneurship / young business' },
    ],
  },
  {
    label: 'Creative & Performing',
    options: [
      { value: 'yearbook', label: 'Yearbook' },
      { value: 'newspaper', label: 'Newspaper / journalism' },
      { value: 'photography', label: 'Photography' },
      { value: 'film_video', label: 'Film / video production' },
      { value: 'art', label: 'Art club' },
      { value: 'choir', label: 'Choir' },
      { value: 'drama', label: 'Drama / theater' },
      { value: 'step_team', label: 'Step team' },
      { value: 'dance_team', label: 'Dance team' },
      { value: 'digital_art', label: 'Digital art' },
      { value: 'sewing_fiber', label: 'Sewing / fiber crafts' },
      { value: 'stained_glass', label: 'Stained glass' },
      { value: 'ceramics', label: 'Ceramics / pottery' },
    ],
  },
  {
    label: 'Physical & Wellness',
    options: [
      { value: 'run_club', label: 'Run club' },
      { value: 'fitness_club', label: 'Fitness club' },
      { value: 'jump_rope', label: 'Jump rope' },
      { value: 'cheer', label: 'Cheer' },
      { value: 'yoga', label: 'Yoga / mindfulness' },
      { value: 'hiking', label: 'Hiking / outdoors' },
      { value: 'golf', label: 'Golf' },
      { value: 'tennis', label: 'Tennis' },
      { value: 'swim', label: 'Swim club' },
      { value: 'wellness', label: 'Wellness / healthy habits' },
      { value: 'nature_club', label: 'Nature club' },
      { value: 'gardening', label: 'Gardening' },
      { value: 'marine_science', label: 'Marine life / ocean science' },
    ],
  },
  {
    label: 'Leadership & Service',
    options: [
      { value: 'student_council', label: 'Student council' },
      { value: 'honor_society', label: 'Honor society' },
      { value: 'kindness_club', label: 'Kindness / service club' },
      { value: 'environmental_club', label: 'Environmental / sustainability' },
      { value: 'peer_mentoring', label: 'Peer mentoring' },
      { value: 'sca_sga', label: 'SCA / SGA (student government)' },
      { value: 'beta_club', label: 'Beta Club / Junior Beta Club' },
      { value: 'mock_trial', label: 'Mock trial' },
      { value: 'youth_in_government', label: 'Youth in Government' },
      { value: 'key_club', label: 'Key Club / Interact' },
    ],
  },
  {
    label: 'Identity, Culture & Interest',
    options: [
      { value: 'anime_manga', label: 'Anime / manga club' },
      { value: 'esports', label: 'Gaming / esports' },
      { value: 'language_culture', label: 'Language & culture club' },
    ],
  },
  {
    label: 'Life Skills & Hands-On',
    options: [
      { value: 'cooking_club', label: 'Cooking (baking / culinary)' },
      { value: 'boys_girls_club', label: 'Boys / Girls club (mentorship)' },
      { value: 'natural_products', label: 'Natural products / DIY (soap)' },
      { value: 'candle_making', label: 'Candle making' },
    ],
  },
]

const FREQUENCIES = [
  { value: '', label: '(not specified)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'twice a week', label: 'Twice a week' },
  { value: 'every other week', label: 'Every other week' },
  { value: 'monthly', label: 'Monthly' },
]

export default function AfterSchoolClubsGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [gradeBand, setGradeBand] = useState('3-5')
  const [clubType, setClubType] = useState('stem')
  const [clubSize, setClubSize] = useState('')
  const [meetingFrequency, setMeetingFrequency] = useState('')
  const [meetingLengthMinutes, setMeetingLengthMinutes] = useState(60)
  const [teacherNotes, setTeacherNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input = { gradeBand, clubType, clubSize, meetingFrequency, meetingLengthMinutes, teacherNotes }
      const generated = await generateAfterSchoolClubs(input)
      setResult(generated)

      if (generated?.title) {
        const saved = await createLesson(generated, { aiModel: 'claude-sonnet-4-6' })
        setSavedId(saved.id)
      }

      setView('result')
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setView('form')
    setResult(null)
    setSavedId(null)
    setError(null)
  }

  if (view === 'result' && result) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link to="/after-school-clubs" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            After-School Clubs
          </Link>
          <button type="button" onClick={resetForm} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            Start over
          </button>
          {savedId && (
            <Link to={`/lessons/${savedId}`} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              View in archive
              <ExternalLink size={14} />
            </Link>
          )}
          <button
            type="button"
            onClick={async () => { if (await requestExport()) window.print() }}
            className="ml-auto btn-secondary"
          >
            Print
          </button>
        </div>

        {savedId && (
          <p className="mb-4 text-xs text-ink-500 print:hidden">Saved to your lesson archive.</p>
        )}

        <AfterSchoolClubsRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/after-school-clubs" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          After-School Clubs
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-500/15">
            <PartyPopper size={18} className="text-coral-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">After-School Clubs</h1>
            <p className="text-xs text-ink-500">
              Ready-to-run club session plans · K–12, scaled by grade band · 40+ club types
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Club &amp; grade band</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="club-type">Club type</label>
              <select id="club-type" value={clubType} onChange={(e) => setClubType(e.target.value)} className="input-field">
                {CLUB_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="club-band">Grade band</label>
              <select id="club-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="club-size">
                Club size <span className="text-ink-500">(optional)</span>
              </label>
              <input
                id="club-size"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 15"
                value={clubSize}
                onChange={(e) => setClubSize(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="club-freq">
                Meets <span className="text-ink-500">(optional)</span>
              </label>
              <select id="club-freq" value={meetingFrequency} onChange={(e) => setMeetingFrequency(e.target.value)} className="input-field">
                {FREQUENCIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="club-length">Meeting length (min)</label>
              <input
                id="club-length"
                type="number"
                min={20}
                max={120}
                step={5}
                value={meetingLengthMinutes}
                onChange={(e) => setMeetingLengthMinutes(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Sponsor notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="club-notes"
            placeholder="Anything to tailor the plan — space/equipment available, mixed grades, budget, your comfort level with this club type, a theme or event you're building toward, etc."
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate session plan
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            This usually takes 30–60 seconds · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
