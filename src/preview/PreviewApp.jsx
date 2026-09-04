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
import ArtShowStudio from '../pages/ArtShowStudio'
import MusicGenerator from '../pages/MusicGenerator'
import MusicLessonLibrary from '../pages/MusicLessonLibrary'
import LibraryGenerator from '../pages/LibraryGenerator'
import LibraryLessonLibrary from '../pages/LibraryLessonLibrary'
import ReadingChallengeHub from '../pages/ReadingChallengeHub'
import LibraryNewsletterStudio from '../pages/LibraryNewsletterStudio'
import BookMatchmaker from '../pages/BookMatchmaker'
import LibraryProjectStudio from '../pages/LibraryProjectStudio'
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
import AdvancedThinkersStudio from '../pages/AdvancedThinkersStudio'
import ReadingSpecialistGenerator from '../pages/ReadingSpecialistGenerator'
import MathSpecialistGenerator from '../pages/MathSpecialistGenerator'
import InterventionFamilyNightHub from '../pages/InterventionFamilyNightHub'
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
import MyClassroomCards from '../pages/MyClassroomCards'
import DemoMode from '../pages/DemoMode'
import SmartGoals from '../pages/SmartGoals'
import CoachingTryouts from '../pages/CoachingTryouts'
import StaffWellnessChallenge from '../pages/StaffWellnessChallenge'
import StaffWellnessCheckIn from '../pages/StaffWellnessCheckIn'
import SpecialtyProgramHub from '../pages/SpecialtyProgramHub'
import FundingStudio from '../pages/FundingStudio'
import SpecialtyExperienceStudio from '../pages/SpecialtyExperienceStudio'
import CteReadinessStudio from '../pages/CteReadinessStudio'
import StudentDataPrivacy from '../pages/StudentDataPrivacy'
import Landing from '../pages/Landing'
import MySchoolYear from '../pages/MySchoolYear'
import LessonPlanFormat from '../pages/LessonPlanFormat'
import TeacherHealthWellness from '../pages/TeacherHealthWellness'

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
        <Route path="/landing-review" element={<Landing />} />
        <Route path="/demo" element={<DemoMode />} />
        <Route path="/wellness-check-in/:token" element={<StaffWellnessCheckIn />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<ModulePicker />} />
          <Route path="pe-health" element={<Dashboard />} />
          <Route path="generate" element={<LessonGenerator />} />
          <Route path="lessons" element={<LessonLibrary />} />
          <Route path="lessons/:id" element={<LessonDetail />} />
          <Route path="curriculum-map" element={<CurriculumMap />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="my-year" element={<MySchoolYear />} />
          <Route path="lesson-format" element={<LessonPlanFormat />} />
          <Route path="students" element={<Students />} />
          <Route path="participation" element={<ParticipationTracker />} />
          <Route path="run-tracker" element={<RunTracker />} />
          <Route path="teacher-wellness" element={<TeacherHealthWellness />} />
          <Route path="smart-goals" element={<SmartGoals />} />
          <Route path="coaching" element={<CoachingTryouts />} />
          <Route path="staff-wellness" element={<StaffWellnessChallenge />} />
          <Route path="programs" element={<SpecialtyProgramHub />} />
          <Route path="funding" element={<FundingStudio />} />
          <Route path="open-house" element={<SpecialtyExperienceStudio key="open-house" experienceKey="open-house" />} />
          <Route path="pe-health/events" element={<SpecialtyExperienceStudio key="pe-events" experienceKey="pe-events" />} />
          <Route path="field-day" element={<Navigate to="/pe-health/events?view=stations" replace />} />
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
          <Route path="my-classroom-cards" element={<MyClassroomCards />} />
          <Route path="settings" element={<Settings />} />
          <Route path="privacy" element={<StudentDataPrivacy />} />
          <Route path="owner" element={<OwnerDashboard />} />
          {Object.entries(MODULE_HOMES).map(([slug, config]) => (
            <Route key={slug} path={slug} element={<ModuleHome config={config} />} />
          ))}
          <Route path="art/generate" element={<ArtGenerator />} />
          <Route path="art/lessons" element={<ArtLessonLibrary />} />
          <Route path="art/art-show" element={<ArtShowStudio />} />
          <Route path="music/generate" element={<MusicGenerator />} />
          <Route path="music/lessons" element={<MusicLessonLibrary />} />
          <Route path="music/concert-builder" element={<SpecialtyExperienceStudio key="music-concert" experienceKey="music-concert" />} />
          <Route path="library/generate" element={<LibraryGenerator />} />
          <Route path="library/lessons" element={<LibraryLessonLibrary />} />
          <Route path="library/makerspace" element={<MakerProjectGenerator origin="library" />} />
          <Route path="library/reading-challenges" element={<ReadingChallengeHub />} />
          <Route path="library/newsletters" element={<LibraryNewsletterStudio />} />
          <Route path="library/book-matchmaker" element={<BookMatchmaker />} />
          <Route path="library/book-tasting" element={<LibraryProjectStudio type="book_tasting" />} />
          <Route path="library/collaboration" element={<LibraryProjectStudio type="teacher_collaboration" />} />
          <Route path="library/family-literacy-night" element={<LibraryProjectStudio type="family_literacy_night" />} />
          <Route path="library/research-quest" element={<LibraryProjectStudio type="research_quest" />} />
          <Route path="stem" element={<StemHome />} />
          <Route path="stem/generate" element={<StemGenerator />} />
          <Route path="stem/lessons" element={<StemLessonLibrary />} />
          <Route path="stem/makerspace" element={<MakerProjectGenerator origin="stem" />} />
          <Route path="stem/stem-night" element={<SpecialtyExperienceStudio key="stem-night" experienceKey="stem-night" />} />
          <Route path="cte/generate" element={<CteGenerator />} />
          <Route path="cte/lessons" element={<CteLessonLibrary />} />
          <Route path="cte/experiences" element={<SpecialtyExperienceStudio key="cte-experiences" experienceKey="cte-experiences" />} />
          <Route path="cte/readiness" element={<CteReadinessStudio />} />
          <Route path="cte/pathway-fit" element={<CteReadinessStudio />} />
          <Route path="cte/career-foundations" element={<CteReadinessStudio />} />
          <Route path="cte/employability-skills" element={<CteReadinessStudio />} />
          <Route path="theater/generate" element={<TheaterGenerator />} />
          <Route path="theater/production-planner" element={<SpecialtyExperienceStudio key="theater-production" experienceKey="theater-production" />} />
          <Route path="dance/generate" element={<DanceGenerator />} />
          <Route path="dance/recital-planner" element={<SpecialtyExperienceStudio key="dance-recital" experienceKey="dance-recital" />} />
          <Route path="world-languages/generate" element={<WorldLanguagesGenerator />} />
          <Route path="world-languages/experiences" element={<SpecialtyExperienceStudio key="world-language-experiences" experienceKey="world-language-experiences" />} />
          <Route path="jrotc/generate" element={<JrotcGenerator />} />
          <Route path="elementary-tech/generate" element={<ElementaryTechGenerator />} />
          <Route path="esl-specialist/generate" element={<EslSpecialistGenerator />} />
          <Route path="esl-specialist/family-night" element={<SpecialtyExperienceStudio key="esl-family-night" experienceKey="esl-family-night" />} />
          <Route path="gifted-talented/generate" element={<GiftedTalentedGenerator />} />
          <Route path="gifted-talented/showcase" element={<SpecialtyExperienceStudio key="gifted-showcase" experienceKey="gifted-showcase" />} />
          <Route path="gifted-talented/advanced-thinkers" element={<AdvancedThinkersStudio />} />
          <Route path="reading-specialists/generate" element={<ReadingSpecialistGenerator />} />
          <Route path="reading-specialists/family-night" element={<InterventionFamilyNightHub key="reading-family-night" type="reading" />} />
          <Route path="math-specialists/generate" element={<MathSpecialistGenerator />} />
          <Route path="math-specialists/family-night" element={<InterventionFamilyNightHub key="math-family-night" type="math" />} />
          <Route path="special-education/generate" element={<SpecialEducationGenerator />} />
          <Route path="ecse/generate" element={<EcseGenerator />} />
          <Route path="early-childhood/family-events" element={<SpecialtyExperienceStudio key="early-family-events" experienceKey="early-family-events" />} />
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
          <Route path="test-prep/family-support" element={<SpecialtyExperienceStudio key="test-prep-family-support" experienceKey="test-prep-family-support" />} />
          <Route path="school-counselors/generate" element={<SchoolCounselorGenerator />} />
          <Route path="early-childhood/generate" element={<EarlyChildhoodGenerator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
