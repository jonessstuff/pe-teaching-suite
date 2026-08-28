import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from './lib/supabaseClient'
import { claimSession, heartbeat, releaseSession, getStoredToken, clearStoredToken } from './services/sessionService'
import { isInactive, recordActivity, clearActivity } from './services/inactivityService'
import { useTheme } from './hooks/useTheme'
import { identifyUser, resetAnalytics } from './lib/analytics'
import { setSentryUser } from './lib/sentry'
import { TrialProvider } from './context/TrialContext'
import AppShell from './components/layout/AppShell'
import ModuleHome from './components/module/ModuleHome'
import { MODULE_HOMES } from './constants/moduleHomes'
import ModulePicker from './pages/ModulePicker'
import UpdateCard from './pages/UpdateCard'
import Dashboard from './pages/Dashboard'
import LessonGenerator from './pages/LessonGenerator'
import LessonLibrary from './pages/LessonLibrary'
import LessonDetail from './pages/LessonDetail'
import CurriculumMap from './pages/CurriculumMap'
import LibraryHome from './pages/LibraryHome'
import LibraryGenerator from './pages/LibraryGenerator'
import LibraryLessonLibrary from './pages/LibraryLessonLibrary'
import ArtHome from './pages/ArtHome'
import ArtGenerator from './pages/ArtGenerator'
import ArtLessonLibrary from './pages/ArtLessonLibrary'
import MusicHome from './pages/MusicHome'
import MusicGenerator from './pages/MusicGenerator'
import MusicLessonLibrary from './pages/MusicLessonLibrary'
import AdaptivePEGenerator from './pages/AdaptivePEGenerator'
import StemHome from './pages/StemHome'
import StemGenerator from './pages/StemGenerator'
import StemLessonLibrary from './pages/StemLessonLibrary'
import CteGenerator from './pages/CteGenerator'
import CteLessonLibrary from './pages/CteLessonLibrary'
import SubBinderGenerator from './pages/SubBinderGenerator'
import UnitBuilder from './pages/UnitBuilder'
import Schedule from './pages/Schedule'
import Students from './pages/Students'
import ParticipationTracker from './pages/ParticipationTracker'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Landing from './pages/Landing'
import ResetPassword from './pages/ResetPassword'
import Welcome from './pages/Welcome'
import MyBinders from './pages/MyBinders'
import AssessmentBank from './pages/AssessmentBank'
import StandardsTracker from './pages/StandardsTracker'
import SharedLesson from './pages/SharedLesson'
import TryFreeLesson from './pages/TryFreeLesson'
import FreeLessonView from './pages/FreeLessonView'
import ImportLesson from './pages/ImportLesson'
import EOYNarrativeGenerator from './pages/EOYNarrativeGenerator'
import ActivityBank from './pages/ActivityBank'
import WarmupGenerator from './pages/WarmupGenerator'
import PacingGuideGenerator from './pages/PacingGuideGenerator'
import MyPacingGuides from './pages/MyPacingGuides'
import FieldDayPlanner from './pages/FieldDayPlanner'
import PortfolioBuilder from './pages/PortfolioBuilder'
import DistrictReport from './pages/DistrictReport'
import ClassroomManagementGenerator from './pages/ClassroomManagementGenerator'
import MyClassroomCards from './pages/MyClassroomCards'
import GiftedTalentedGenerator from './pages/GiftedTalentedGenerator'
import ReadingSpecialistGenerator from './pages/ReadingSpecialistGenerator'
import MathSpecialistGenerator from './pages/MathSpecialistGenerator'
import MakerProjectGenerator from './pages/MakerProjectGenerator'
import SpecialEducationGenerator from './pages/SpecialEducationGenerator'
import EslSpecialistGenerator from './pages/EslSpecialistGenerator'
import EarlyChildhoodGenerator from './pages/EarlyChildhoodGenerator'
import EcseGenerator from './pages/EcseGenerator'
import InterventionGenerator from './pages/InterventionGenerator'
import StaffPdGenerator from './pages/StaffPdGenerator'
import InstructionalCoachingGenerator from './pages/InstructionalCoachingGenerator'
import SchoolCounselorGenerator from './pages/SchoolCounselorGenerator'
import ElementaryTechGenerator from './pages/ElementaryTechGenerator'
import SlpGenerator from './pages/SlpGenerator'
import OtGenerator from './pages/OtGenerator'
import PtGenerator from './pages/PtGenerator'
import TviGenerator from './pages/TviGenerator'
import DhhGenerator from './pages/DhhGenerator'
import WorldLanguagesGenerator from './pages/WorldLanguagesGenerator'
import AfterSchoolClubsGenerator from './pages/AfterSchoolClubsGenerator'
import JrotcGenerator from './pages/JrotcGenerator'
import TestPrepGenerator from './pages/TestPrepGenerator'
import SstActivityGenerator from './pages/SstActivityGenerator'
import TheaterGenerator from './pages/TheaterGenerator'
import DanceGenerator from './pages/DanceGenerator'

// Module-level promise reference. When a genuine new login triggers claimSession(),
// this holds the in-flight Promise so that any concurrent SIGNED_IN events (e.g.
// from mobile keyboard-dismiss causing an immediate visibility change) piggyback
// on the same call instead of starting a second one. Cleared in the finally block.
let activeClaimPromise = null

// Wraps the sign-in screen shown at /update-card for a logged-out user. It drops a
// short-lived flag so that after auth we can bounce them to /update-card even when
// the login method (magic link) lands them at the site root. Password sign-in keeps
// the URL at /update-card, so this is only needed for the magic-link path — AppShell
// reads and clears the flag on the authenticated side.
function CardUpdateGate({ children }) {
  useEffect(() => {
    try { localStorage.setItem('cardUpdateRedirect', String(Date.now())) } catch { /* ignore */ }
  }, [])
  return children
}

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [authError, setAuthError] = useState(null)
  // Set when this device was displaced (a newer login evicted its session). Routes
  // the signed-out user to Login so the explanatory notice is actually seen, rather
  // than silently dropping them on the landing page. Self-clears on next sign-in.
  const [displaced, setDisplaced] = useState(false)
  useTheme() // applies dark/light class to <html> on mount

  useEffect(() => {
    // getSession() handles the initial load (page refresh with an existing session).
    // It does NOT fire onAuthStateChange, so it bypasses the SIGNED_IN gate below —
    // which is correct: we only enforce single-session at login time, not on refresh.
    supabase.auth.getSession().then(({ data }) => {
      const existing = data.session

      // Inactivity gate: if this device hasn't been active within the window,
      // force a fresh login instead of silently restoring a stale session.
      // scope: 'local' so we never revoke the account's other devices.
      if (existing && isInactive()) {
        clearActivity()
        releaseSession()
        supabase.auth.signOut({ scope: 'local' })
        setSession(null)
        return
      }

      if (existing) recordActivity()
      setSession(existing)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Supabase fires SIGNED_IN for token refreshes as well as real logins.
        // If a token is already in localStorage, verify it still has a live DB row
        // before taking the fast path. A stale token (row cleaned up after 20 min
        // of inactivity) looks identical to a valid one from localStorage's perspective,
        // but the immediate heartbeat tick after setSession() would return 'displaced'
        // and sign the user back out — causing a silent bounce to landing with no error.
        //
        // Outcomes of the heartbeat check:
        //   'ok'        — token is live, this is a returning registered device → fast path
        //   'displaced' — token is stale (no DB row) → clear it, fall through to claimSession()
        //   'error'     — DB/network failure, state unknown → treat as valid to avoid
        //                 false-rejecting a user whose row may still exist
        const storedToken = getStoredToken()
        if (storedToken) {
          const validity = await heartbeat(storedToken)
          if (validity !== 'displaced') {
            setAuthError(null)
            setSession(session)
            return
          }
          // Stale token — clear it and proceed with a fresh claim below.
          clearStoredToken()
        }

        // No stored token (or stale one just cleared). But on mobile, the keyboard
        // dismissal fires a visibility change within ~100–200ms of login — before
        // claimSession() finishes its 4 async round trips (~400–800ms). That second
        // SIGNED_IN also sees null from getStoredToken() and would start a duplicate
        // claim, filling active_sessions to MAX_SESSIONS and causing the next event
        // to throw ALREADY_ACTIVE → signOut. Guard against this by checking whether
        // a claim is already in flight and piggybacking on it instead.
        if (activeClaimPromise) {
          try {
            await activeClaimPromise
            setAuthError(null)
            setSession(session)
          } catch {
            // The original claim failed; its handler already set authError and
            // called signOut. This concurrent event is a no-op.
          }
          return
        }

        // No claim in flight — this is the genuine first login event. Evict the
        // oldest session if the account is at the limit, so a new sign-in (e.g.
        // installing the PWA, a separate storage context) never hard-fails.
        activeClaimPromise = claimSession({ evictOldest: true })
        try {
          await activeClaimPromise
          setAuthError(null)
          setSession(session)
        } catch (err) {
          if (err === 'ALREADY_ACTIVE') {
            setAuthError(
              'This account is already signed in on another device. Please log out there first, or wait a few minutes if that session has ended.'
            )
          } else {
            setAuthError(err?.message ?? 'Sign-in failed. Please try again.')
          }
          // Sign the new login back out. This fires SIGNED_OUT → the else
          // branch below runs setSession(null), which is a no-op since session
          // is already null. Login stays mounted and authError prop is shown.
          //
          // scope: 'local' is critical. The default 'global' scope revokes the
          // refresh tokens for EVERY device on this account server-side, kicking
          // the other live sessions offline. Each of those devices then silently
          // re-authenticates, re-inserts an active_sessions row, and trips this
          // same limit again — a login → logout → token-refresh loop firing every
          // 30–90s (Supabase's refresh backoff). Only sign out THIS browser.
          await supabase.auth.signOut({ scope: 'local' })
        } finally {
          activeClaimPromise = null
        }
      } else {
        if (event === 'SIGNED_OUT') {
          releaseSession()
        }
        setSession(session)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Analytics + Sentry identity — mirror the resolved session's Supabase user
  // id (id only, never email/name). Decoupled from the single-session logic
  // above so it simply reacts to whatever session ends up set.
  useEffect(() => {
    if (session === undefined) return // still loading
    const userId = session?.user?.id ?? null
    if (userId) {
      identifyUser(userId)
      setSentryUser(userId)
    } else {
      resetAnalytics()
      setSentryUser(null)
    }
  }, [session])

  // Heartbeat: keep last_seen_at fresh and detect displacement.
  // Runs immediately on session restore (catches a takeover while the tab
  // was closed), then repeats every 5 minutes.
  useEffect(() => {
    if (!session) return

    const token = getStoredToken()
    if (!token) return

    // We have a live session on this device — stamp activity now (covers login,
    // token refresh, and session restore) so the inactivity gate only fires
    // after a genuine stretch away from the app.
    recordActivity()

    const HEARTBEAT_MS = 5 * 60 * 1000

    async function tick() {
      recordActivity()
      const result = await heartbeat(token)
      if (result !== 'displaced') return

      // Row is gone. Try to re-claim before giving up — the row may have been
      // deleted by another device's stale-cleanup pass, not a genuine takeover.
      clearStoredToken()
      try {
        await claimSession()
        // Re-claimed successfully; user stays logged in with a fresh row.
      } catch {
        // Can't re-claim (ALREADY_ACTIVE or DB error) — genuine displacement:
        // a newer login (e.g. another device, or installing the PWA past the
        // session limit) evicted this session. Surface a brief notice so it
        // isn't mysterious, and route to Login (setDisplaced) since the signed-
        // out user would otherwise land silently on the marketing page.
        setAuthError('You’ve been signed out because your account was opened on another device.')
        setDisplaced(true)
        // scope: 'local' so we don't revoke the other devices' tokens and
        // trigger the account-wide re-login cascade (see the login handler above).
        supabase.auth.signOut({ scope: 'local' })
      }
    }

    tick() // immediate check on mount / session restore
    const interval = setInterval(tick, HEARTBEAT_MS)
    return () => clearInterval(interval)
  }, [session])

  // Clear the displacement flag once a session is (re)established, so a stale
  // flag can't surface the "signed out on another device" notice on a later,
  // ordinary logout.
  useEffect(() => {
    if (session) setDisplaced(false)
  }, [session])

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 text-ink-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={displaced
            ? <Login authError={authError} onClearAuthError={() => { setAuthError(null); setDisplaced(false) }} />
            : <Landing />} />
          <Route path="/login" element={<Login authError={authError} onClearAuthError={() => { setAuthError(null); setDisplaced(false) }} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/shared/:token" element={<SharedLesson />} />
          <Route path="/try" element={<TryFreeLesson />} />
          <Route path="/free-lesson/:token" element={<FreeLessonView />} />
          <Route path="/update-card" element={
            <CardUpdateGate>
              <Login authError={authError} onClearAuthError={() => { setAuthError(null); setDisplaced(false) }} />
            </CardUpdateGate>
          } />
          <Route path="*" element={<Navigate to={displaced ? '/login' : '/'} replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <TrialProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/update-card" element={<UpdateCard />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<ModulePicker />} />
          <Route path="pe-health" element={<Dashboard />} />
          <Route path="generate" element={<LessonGenerator />} />
          <Route path="lessons" element={<LessonLibrary />} />
          <Route path="lessons/:id" element={<LessonDetail />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="students" element={<Students />} />
          <Route path="participation" element={<ParticipationTracker />} />
          <Route path="curriculum-map" element={<CurriculumMap />} />
          <Route path="library" element={<LibraryHome />} />
          <Route path="library/generate" element={<LibraryGenerator />} />
          <Route path="library/lessons" element={<LibraryLessonLibrary />} />
          <Route path="library/makerspace" element={<MakerProjectGenerator origin="library" />} />
          <Route path="art" element={<ArtHome />} />
          <Route path="art/generate" element={<ArtGenerator />} />
          <Route path="art/lessons" element={<ArtLessonLibrary />} />
          <Route path="music" element={<MusicHome />} />
          <Route path="music/generate" element={<MusicGenerator />} />
          <Route path="music/lessons" element={<MusicLessonLibrary />} />
          <Route path="adaptive-pe" element={<AdaptivePEGenerator />} />
          <Route path="stem" element={<StemHome />} />
          <Route path="stem/generate" element={<StemGenerator />} />
          <Route path="stem/lessons" element={<StemLessonLibrary />} />
          <Route path="stem/makerspace" element={<MakerProjectGenerator origin="stem" />} />
          <Route path="cte" element={<ModuleHome config={MODULE_HOMES.cte} />} />
          <Route path="cte/generate" element={<CteGenerator />} />
          <Route path="cte/lessons" element={<CteLessonLibrary />} />
          <Route path="classroom-management" element={<ClassroomManagementGenerator />} />
          <Route path="gifted-talented" element={<ModuleHome config={MODULE_HOMES['gifted-talented']} />} />
          <Route path="gifted-talented/generate" element={<GiftedTalentedGenerator />} />
          <Route path="reading-specialists" element={<ModuleHome config={MODULE_HOMES['reading-specialists']} />} />
          <Route path="reading-specialists/generate" element={<ReadingSpecialistGenerator />} />
          <Route path="math-specialists" element={<ModuleHome config={MODULE_HOMES['math-specialists']} />} />
          <Route path="math-specialists/generate" element={<MathSpecialistGenerator />} />
          <Route path="special-education" element={<ModuleHome config={MODULE_HOMES['special-education']} />} />
          <Route path="special-education/generate" element={<SpecialEducationGenerator />} />
          <Route path="esl-specialist" element={<ModuleHome config={MODULE_HOMES['esl-specialist']} />} />
          <Route path="esl-specialist/generate" element={<EslSpecialistGenerator />} />
          <Route path="early-childhood" element={<ModuleHome config={MODULE_HOMES['early-childhood']} />} />
          <Route path="early-childhood/generate" element={<EarlyChildhoodGenerator />} />
          <Route path="ecse" element={<ModuleHome config={MODULE_HOMES['ecse']} />} />
          <Route path="ecse/generate" element={<EcseGenerator />} />
          <Route path="intervention" element={<ModuleHome config={MODULE_HOMES['intervention']} />} />
          <Route path="intervention/generate" element={<InterventionGenerator />} />
          <Route path="staff-pd" element={<ModuleHome config={MODULE_HOMES['staff-pd']} />} />
          <Route path="staff-pd/generate" element={<StaffPdGenerator />} />
          <Route path="instructional-coaching" element={<ModuleHome config={MODULE_HOMES['instructional-coaching']} />} />
          <Route path="instructional-coaching/generate" element={<InstructionalCoachingGenerator />} />
          <Route path="school-counselors" element={<ModuleHome config={MODULE_HOMES['school-counselors']} />} />
          <Route path="school-counselors/generate" element={<SchoolCounselorGenerator />} />
          <Route path="elementary-tech" element={<ModuleHome config={MODULE_HOMES['elementary-tech']} />} />
          <Route path="elementary-tech/generate" element={<ElementaryTechGenerator />} />
          <Route path="slp" element={<ModuleHome config={MODULE_HOMES['slp']} />} />
          <Route path="slp/generate" element={<SlpGenerator />} />
          <Route path="ot" element={<ModuleHome config={MODULE_HOMES.ot} />} />
          <Route path="ot/generate" element={<OtGenerator />} />
          <Route path="pt" element={<ModuleHome config={MODULE_HOMES['pt']} />} />
          <Route path="pt/generate" element={<PtGenerator />} />
          <Route path="tvi" element={<ModuleHome config={MODULE_HOMES['tvi']} />} />
          <Route path="tvi/generate" element={<TviGenerator />} />
          <Route path="dhh" element={<ModuleHome config={MODULE_HOMES['dhh']} />} />
          <Route path="dhh/generate" element={<DhhGenerator />} />
          <Route path="world-languages" element={<ModuleHome config={MODULE_HOMES['world-languages']} />} />
          <Route path="world-languages/generate" element={<WorldLanguagesGenerator />} />
          <Route path="theater" element={<ModuleHome config={MODULE_HOMES.theater} />} />
          <Route path="theater/generate" element={<TheaterGenerator />} />
          <Route path="dance" element={<ModuleHome config={MODULE_HOMES['dance']} />} />
          <Route path="dance/generate" element={<DanceGenerator />} />
          <Route path="after-school-clubs" element={<ModuleHome config={MODULE_HOMES['after-school-clubs']} />} />
          <Route path="after-school-clubs/generate" element={<AfterSchoolClubsGenerator />} />
          <Route path="jrotc" element={<ModuleHome config={MODULE_HOMES['jrotc']} />} />
          <Route path="jrotc/generate" element={<JrotcGenerator />} />
          <Route path="test-prep" element={<ModuleHome config={MODULE_HOMES['test-prep']} />} />
          <Route path="test-prep/generate" element={<TestPrepGenerator />} />
          <Route path="student-support-activities" element={<ModuleHome config={MODULE_HOMES['student-support-activities']} />} />
          <Route path="student-support-activities/generate" element={<SstActivityGenerator />} />
          <Route path="my-classroom-cards" element={<MyClassroomCards />} />
          <Route path="sub-binder" element={<SubBinderGenerator />} />
          <Route path="build-unit" element={<UnitBuilder />} />
          <Route path="my-binders" element={<MyBinders />} />
          <Route path="assessments" element={<AssessmentBank />} />
          <Route path="standards-tracker" element={<StandardsTracker />} />
          <Route path="shared/:token" element={<SharedLesson />} />
          <Route path="free-lesson/:token" element={<FreeLessonView />} />
          <Route path="import" element={<ImportLesson />} />
          <Route path="eoy-narrative" element={<EOYNarrativeGenerator />} />
          <Route path="activity-bank" element={<ActivityBank />} />
          <Route path="warm-up-generator" element={<WarmupGenerator />} />
          <Route path="pacing-guide" element={<PacingGuideGenerator />} />
          <Route path="my-pacing-guides" element={<MyPacingGuides />} />
          <Route path="field-day" element={<FieldDayPlanner />} />
          <Route path="portfolio" element={<PortfolioBuilder />} />
          <Route path="district-report" element={<DistrictReport />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </TrialProvider>
  )
}

export default App
