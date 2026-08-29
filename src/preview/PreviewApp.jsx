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
import MusicGenerator from '../pages/MusicGenerator'
import LibraryGenerator from '../pages/LibraryGenerator'
import MakerProjectGenerator from '../pages/MakerProjectGenerator'
import CteGenerator from '../pages/CteGenerator'
import SlpGenerator from '../pages/SlpGenerator'
import InterventionGenerator from '../pages/InterventionGenerator'
import SchoolCounselorGenerator from '../pages/SchoolCounselorGenerator'
import EarlyChildhoodGenerator from '../pages/EarlyChildhoodGenerator'
import DemoMode from '../pages/DemoMode'
import SmartGoals from '../pages/SmartGoals'

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
          <Route path="smart-goals" element={<SmartGoals />} />
          <Route path="settings" element={<Settings />} />
          <Route path="owner" element={<OwnerDashboard />} />
          {Object.entries(MODULE_HOMES).map(([slug, config]) => (
            <Route key={slug} path={slug} element={<ModuleHome config={config} />} />
          ))}
          <Route path="art/generate" element={<ArtGenerator />} />
          <Route path="music/generate" element={<MusicGenerator />} />
          <Route path="library/generate" element={<LibraryGenerator />} />
          <Route path="library/makerspace" element={<MakerProjectGenerator origin="library" />} />
          <Route path="cte/generate" element={<CteGenerator />} />
          <Route path="slp/generate" element={<SlpGenerator />} />
          <Route path="intervention/generate" element={<InterventionGenerator />} />
          <Route path="school-counselors/generate" element={<SchoolCounselorGenerator />} />
          <Route path="early-childhood/generate" element={<EarlyChildhoodGenerator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
