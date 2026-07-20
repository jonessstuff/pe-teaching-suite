import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Dashboard from '../pages/Dashboard'
import LessonGenerator from '../pages/LessonGenerator'
import LessonLibrary from '../pages/LessonLibrary'
import LessonDetail from '../pages/LessonDetail'
import CurriculumMap from '../pages/CurriculumMap'
import Settings from '../pages/Settings'

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
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="generate" element={<LessonGenerator />} />
          <Route path="lessons" element={<LessonLibrary />} />
          <Route path="lessons/:id" element={<LessonDetail />} />
          <Route path="curriculum-map" element={<CurriculumMap />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
