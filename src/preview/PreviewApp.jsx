import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Dashboard from '../pages/Dashboard'
import LessonGenerator from '../pages/LessonGenerator'
import LessonLibrary from '../pages/LessonLibrary'
import LessonDetail from '../pages/LessonDetail'
import CurriculumMap from '../pages/CurriculumMap'
import Settings from '../pages/Settings'
import ModulePicker from '../pages/ModulePicker'
import OwnerDashboard from '../pages/OwnerDashboard'
import ModuleHome from '../components/module/ModuleHome'
import { MODULE_HOMES } from '../constants/moduleHomes'
import ArtGenerator from '../pages/ArtGenerator'
import ArtLessonLibrary from '../pages/ArtLessonLibrary'
import MusicGenerator from '../pages/MusicGenerator'
import MusicLessonLibrary from '../pages/MusicLessonLibrary'
import LibraryGenerator from '../pages/LibraryGenerator'
import LibraryLessonLibrary from '../pages/LibraryLessonLibrary'
import MakerProjectGenerator from '../pages/MakerProjectGenerator'
import CteGenerator from '../pages/CteGenerator'
import CteLessonLibrary from '../pages/CteLessonLibrary'
import StemHome from '../pages/StemHome'
import StemGenerator from '../pages/StemGenerator'
import StemLessonLibrary from '../pages/StemLessonLibrary'
import SlpGenerator from '../pages/SlpGenerator'
import InterventionGenerator from '../pages/InterventionGenerator'
import SchoolCounselorGenerator from '../pages/SchoolCounselorGenerator'
import EarlyChildhoodGenerator from '../pages/EarlyChildhoodGenerator'
import TheaterGenerator from '../pages/TheaterGenerator'
import DanceGenerator from '../pages/DanceGenerator'
import WorldLanguagesGenerator from '../pages/WorldLanguagesGenerator'
import JrotcGenerator from '../pages/JrotcGenerator'
import ElementaryTechGenerator from '../pages/ElementaryTechGenerator'
import EslSpecialistGenerator from '../pages/EslSpecialistGenerator'
import GiftedTalentedGenerator from '../pages/GiftedTalentedGenerator'
import ReadingSpecialistGenerator from '../pages/ReadingSpecialistGenerator'
import MathSpecialistGenerator from '../pages/MathSpecialistGenerator'
import SpecialEducationGenerator from '../pages/SpecialEducationGenerator'
import EcseGenerator from '../pages/EcseGenerator'
import AfterSchoolClubsGenerator from '../pages/AfterSchoolClubsGenerator'
import OtGenerator from '../pages/OtGenerator'
import PtGenerator from '../pages/PtGenerator'
import TviGenerator from '../pages/TviGenerator'
import DhhGenerator from '../pages/DhhGenerator'
import StaffPdGenerator from '../pages/StaffPdGenerator'
import InstructionalCoachingGenerator from '../pages/InstructionalCoachingGenerator'
import SstActivityGenerator from '../pages/SstActivityGenerator'
import TestPrepGenerator from '../pages/TestPrepGenerator'
import Schedule from '../pages/Schedule'
import Students from '../pages/Students'
import ParticipationTracker from '../pages/ParticipationTracker'
import RunTracker from '../pages/RunTracker'
import AssessmentBank from '../pages/AssessmentBank'
import StandardsTracker from '../pages/StandardsTracker'
import PacingGuideGenerator from '../pages/PacingGuideGenerator'
import ActivityBank from '../pages/ActivityBank'
import WarmupGenerator from '../pages/WarmupGenerator'
import EOYNarrativeGenerator from '../pages/EOYNarrativeGenerator'
import PortfolioBuilder from '../pages/PortfolioBuilder'
import SubBinderGenerator from '../pages/SubBinderGenerator'
import ImportLesson from '../pages/ImportLesson'
import UnitBuilder from '../pages/UnitBuilder'
import ClassroomManagementGenerator from '../pages/ClassroomManagementGenerator'
import DemoMode from '../pages/DemoMode'
import SmartGoals from '../pages/SmartGoals'
import StudentDataPrivacy from '../pages/StudentDataPrivacy'

/**
 * Standalone preview app.
 *
 * Same pages/components as the real app, but with no auth gate and
 * mocked services (see vite.preview.config.js aliases), so it can be
 * explored without a Supabase project.
 */
export default function PreviewApp() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/demo" element={<DemoMode />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<ModulePicker />} />
          <Route path="pe-health" element={<Dashboard />} />
          <Route path="generate" element={<LessonGenerator />} />
          <Route path="lessons" element={<LessonLibrary />} />
          <Route path="lessons/:id" element={<LessonDetail />} />
          <Route path="curriculum-map" element={<CurriculumMap />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="students" element={<Students />} />
          <Route path="participation" element={<ParticipationTracker />} />
          <Route path="run-tracker" element={<RunTracker />} />
          <Route path="smart-goals" element={<SmartGoals />} />
          <Route path="assessments" element={<AssessmentBank />} />
          <Route path="standards-tracker" element={<StandardsTracker />} />
          <Route path="pacing-guide" element={<PacingGuideGenerator />} />
          <Route path="activity-bank" element={<ActivityBank />} />
          <Route path="warm-up-generator" element={<WarmupGenerator />} />
          <Route path="eoy-narrative" element={<EOYNarrativeGenerator />} />
          <Route path="portfolio" element={<PortfolioBuilder />} />
          <Route path="sub-binder" element={<SubBinderGenerator />} />
          <Route path="import" element={<ImportLesson />} />
          <Route path="build-unit" element={<UnitBuilder />} />
          <Route path="classroom-management" element={<ClassroomManagementGenerator />} />
          <Route path="settings" element={<Settings />} />
          <Route path="privacy" element={<StudentDataPrivacy />} />
          <Route path="owner" element={<OwnerDashboard />} />
          {Object.entries(MODULE_HOMES).map(([slug, config]) => (
            <Route key={slug} path={slug} element={<ModuleHome config={config} />} />
          ))}
          <Route path="art/generate" element={<ArtGenerator />} />
          <Route path="art/lessons" element={<ArtLessonLibrary />} />
          <Route path="music/generate" element={<MusicGenerator />} />
          <Route path="music/lessons" element={<MusicLessonLibrary />} />
          <Route path="library/generate" element={<LibraryGenerator />} />
          <Route path="library/lessons" element={<LibraryLessonLibrary />} />
          <Route path="library/makerspace" element={<MakerProjectGenerator origin="library" />} />
          <Route path="stem" element={<StemHome />} />
          <Route path="stem/generate" element={<StemGenerator />} />
          <Route path="stem/lessons" element={<StemLessonLibrary />} />
          <Route path="stem/makerspace" element={<MakerProjectGenerator origin="stem" />} />
          <Route path="cte/generate" element={<CteGenerator />} />
          <Route path="cte/lessons" element={<CteLessonLibrary />} />
          <Route path="theater/generate" element={<TheaterGenerator />} />
          <Route path="dance/generate" element={<DanceGenerator />} />
          <Route path="world-languages/generate" element={<WorldLanguagesGenerator />} />
          <Route path="jrotc/generate" element={<JrotcGenerator />} />
          <Route path="elementary-tech/generate" element={<ElementaryTechGenerator />} />
          <Route path="esl-specialist/generate" element={<EslSpecialistGenerator />} />
          <Route path="gifted-talented/generate" element={<GiftedTalentedGenerator />} />
          <Route path="reading-specialists/generate" element={<ReadingSpecialistGenerator />} />
          <Route path="math-specialists/generate" element={<MathSpecialistGenerator />} />
          <Route path="special-education/generate" element={<SpecialEducationGenerator />} />
          <Route path="ecse/generate" element={<EcseGenerator />} />
          <Route path="after-school-clubs/generate" element={<AfterSchoolClubsGenerator />} />
          <Route path="ot/generate" element={<OtGenerator />} />
          <Route path="pt/generate" element={<PtGenerator />} />
          <Route path="slp/generate" element={<SlpGenerator />} />
          <Route path="tvi/generate" element={<TviGenerator />} />
          <Route path="dhh/generate" element={<DhhGenerator />} />
          <Route path="staff-pd/generate" element={<StaffPdGenerator />} />
          <Route path="instructional-coaching/generate" element={<InstructionalCoachingGenerator />} />
          <Route path="intervention/generate" element={<InterventionGenerator />} />
          <Route path="student-support-activities/generate" element={<SstActivityGenerator />} />
          <Route path="test-prep/generate" element={<TestPrepGenerator />} />
          <Route path="school-counselors/generate" element={<SchoolCounselorGenerator />} />
          <Route path="early-childhood/generate" element={<EarlyChildhoodGenerator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
