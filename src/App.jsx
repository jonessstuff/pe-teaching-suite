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
import ModulePicker from './pages/ModulePicker'
import Dashboard from './pages/Dashboard'
import LessonGenerator from './pages/LessonGenerator'
import LessonLibrary from './pages/LessonLibrary'
import LessonDetail from './pages/LessonDetail'
import CurriculumMap from './pages/CurriculumMap'
import LibraryHome from './pages/LibraryHome'
import LibraryGenerator from './pages/LibraryGenerator'
import LibraryLessonLibrary from './pages/LibraryLessonLibrary'
import LibraryUnitBuilder from './pages/LibraryUnitBuilder'
import ArtHome from './pages/ArtHome'
import ArtGenerator from './pages/ArtGenerator'
import ArtLessonLibrary from './pages/ArtLessonLibrary'
import ArtUnitBuilder from './pages/ArtUnitBuilder'
import MusicHome from './pages/MusicHome'
import MusicGenerator from './pages/MusicGenerator'
import MusicLessonLibrary from './pages/MusicLessonLibrary'
import MusicUnitBuilder from './pages/MusicUnitBuilder'
import AdaptivePEGenerator from './pages/AdaptivePEGenerator'
import StemHome from './pages/StemHome'
import StemGenerator from './pages/StemGenerator'
import StemLessonLibrary from './pages/StemLessonLibrary'
import StemUnitBuilder from './pages/StemUnitBuilder'
import CteHome from './pages/CteHome'
import CteGenerator from './pages/CteGenerator'
import CteLessonLibrary from './pages/CteLessonLibrary'
import SubBinderGenerator from './pages/SubBinderGenerator'
import Schedule from './pages/Schedule'
import Students from './pages/Students'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Landing from './pages/Landing'
import ResetPassword from './pages/ResetPassword'
import MyBinders from './pages/MyBinders'
import AssessmentBank from './pages/AssessmentBank'
import StandardsTracker from './pages/StandardsTracker'
import SharedLesson from './pages/SharedLesson'
import TryFreeLesson from './pages/TryFreeLesson'
import FreeLessonView from './pages/FreeLessonView'
import ImportLesson from './pages/ImportLesson'
import EOYNarrativeGenerator from './pages/EOYNarrativeGenerator'
import ActivityBank from './pages/ActivityBank'
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
import InterventionGenerator from './pages/InterventionGenerator'
import StaffPdGenerator from './pages/StaffPdGenerator'
import SchoolCounselorGenerator from './pages/SchoolCounselorGenerator'
import SlpGenerator from './pages/SlpGenerator'
import OtGenerator from './pages/OtGenerator'
import PtGenerator from './pages/PtGenerator'
import WorldLanguagesGenerator from './pages/WorldLanguagesGenerator'
import AfterSchoolClubsGenerator from './pages/AfterSchoolClubsGenerator'
import TestPrepGenerator from './pages/TestPrepGenerator'
import SstActivityGenerator from './pages/SstActivityGenerator'

// Module-level promise reference. When a genuine new login triggers claimSession(),
// this holds the in-flight Promise so that any concurrent SIGNED_IN events (e.g.
// from mobile keyboard-dismiss causing an immediate visibility change) piggyback
// on the same call instead of starting a second one. Cleared in the finally block.
let activeClaimPromise = null

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [authError, setAuthError] = useState(null)
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

        // No claim in flight — this is the genuine first login event.
        activeClaimPromise = claimSession()
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
        // Can't re-claim (ALREADY_ACTIVE or DB error) — genuine displacement.
        // scope: 'local' so we don't revoke the other devices' tokens and
        // trigger the account-wide re-login cascade (see the login handler above).
        supabase.auth.signOut({ scope: 'local' })
      }
    }

    tick() // immediate check on mount / session restore
    const interval = setInterval(tick, HEARTBEAT_MS)
    return () => clearInterval(interval)
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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login authError={authError} onClearAuthError={() => setAuthError(null)} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/shared/:token" element={<SharedLesson />} />
          <Route path="/try" element={<TryFreeLesson />} />
          <Route path="/free-lesson/:token" element={<FreeLessonView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <TrialProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<ModulePicker />} />
          <Route path="pe-health" element={<Dashboard />} />
          <Route path="generate" element={<LessonGenerator />} />
          <Route path="lessons" element={<LessonLibrary />} />
          <Route path="lessons/:id" element={<LessonDetail />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="students" element={<Students />} />
          <Route path="curriculum-map" element={<CurriculumMap />} />
          <Route path="library" element={<LibraryHome />} />
          <Route path="library/generate" element={<LibraryGenerator />} />
          <Route path="library/lessons" element={<LibraryLessonLibrary />} />
          <Route path="library/units/new" element={<LibraryUnitBuilder />} />
          <Route path="library/makerspace" element={<MakerProjectGenerator origin="library" />} />
          <Route path="art" element={<ArtHome />} />
          <Route path="art/generate" element={<ArtGenerator />} />
          <Route path="art/lessons" element={<ArtLessonLibrary />} />
          <Route path="art/units/new" element={<ArtUnitBuilder />} />
          <Route path="music" element={<MusicHome />} />
          <Route path="music/generate" element={<MusicGenerator />} />
          <Route path="music/lessons" element={<MusicLessonLibrary />} />
          <Route path="music/units/new" element={<MusicUnitBuilder />} />
          <Route path="adaptive-pe" element={<AdaptivePEGenerator />} />
          <Route path="stem" element={<StemHome />} />
          <Route path="stem/generate" element={<StemGenerator />} />
          <Route path="stem/lessons" element={<StemLessonLibrary />} />
          <Route path="stem/units/new" element={<StemUnitBuilder />} />
          <Route path="stem/makerspace" element={<MakerProjectGenerator origin="stem" />} />
          <Route path="cte" element={<CteHome />} />
          <Route path="cte/generate" element={<CteGenerator />} />
          <Route path="cte/lessons" element={<CteLessonLibrary />} />
          <Route path="classroom-management" element={<ClassroomManagementGenerator />} />
          <Route path="gifted-talented" element={<GiftedTalentedGenerator />} />
          <Route path="reading-specialists" element={<ReadingSpecialistGenerator />} />
          <Route path="math-specialists" element={<MathSpecialistGenerator />} />
          <Route path="special-education" element={<SpecialEducationGenerator />} />
          <Route path="esl-specialist" element={<EslSpecialistGenerator />} />
          <Route path="early-childhood" element={<EarlyChildhoodGenerator />} />
          <Route path="intervention" element={<InterventionGenerator />} />
          <Route path="staff-pd" element={<StaffPdGenerator />} />
          <Route path="school-counselors" element={<SchoolCounselorGenerator />} />
          <Route path="slp" element={<SlpGenerator />} />
          <Route path="ot" element={<OtGenerator />} />
          <Route path="pt" element={<PtGenerator />} />
          <Route path="world-languages" element={<WorldLanguagesGenerator />} />
          <Route path="after-school-clubs" element={<AfterSchoolClubsGenerator />} />
          <Route path="test-prep" element={<TestPrepGenerator />} />
          <Route path="student-support-activities" element={<SstActivityGenerator />} />
          <Route path="my-classroom-cards" element={<MyClassroomCards />} />
          <Route path="sub-binder" element={<SubBinderGenerator />} />
          <Route path="my-binders" element={<MyBinders />} />
          <Route path="assessments" element={<AssessmentBank />} />
          <Route path="standards-tracker" element={<StandardsTracker />} />
          <Route path="shared/:token" element={<SharedLesson />} />
          <Route path="free-lesson/:token" element={<FreeLessonView />} />
          <Route path="import" element={<ImportLesson />} />
          <Route path="eoy-narrative" element={<EOYNarrativeGenerator />} />
          <Route path="activity-bank" element={<ActivityBank />} />
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
