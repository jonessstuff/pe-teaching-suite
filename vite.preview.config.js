import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Standalone preview build: aliases real Supabase-backed services to
// in-memory mocks, uses preview.html as the entry, and outputs to
// dist-preview/ with relative asset paths so it can be opened directly
// from the filesystem (no server required) or hosted as a static site.
export default defineConfig({
  plugins: [react()],
  base: './',
  define: { 'import.meta.env.VITE_STANDALONE_PREVIEW': JSON.stringify('true') },
  resolve: {
    alias: {
      '../services/lessonsService': path.resolve(__dirname, 'src/preview/mockLessonsService.js'),
      '../services/generationService': path.resolve(__dirname, 'src/preview/mockGenerationService.js'),
      '../../services/generationService': path.resolve(__dirname, 'src/preview/mockGenerationService.js'),
      '../lib/supabaseClient': path.resolve(__dirname, 'src/preview/mockSupabaseClient.js'),
      '../../services/lessonsService': path.resolve(__dirname, 'src/preview/mockLessonsService.js'),
      '../../lib/supabaseClient': path.resolve(__dirname, 'src/preview/mockSupabaseClient.js'),
      '../services/ownerAnalyticsService': path.resolve(__dirname, 'src/preview/mockOwnerAnalyticsService.js'),
      '../services/smartGoalsService': path.resolve(__dirname, 'src/preview/mockSmartGoalsService.js'),
      '../services/classPeriodsService': path.resolve(__dirname, 'src/preview/mockClassPeriodsService.js'),
      '../services/studentsService': path.resolve(__dirname, 'src/preview/mockStudentsService.js'),
      '../services/assessmentService': path.resolve(__dirname, 'src/preview/mockAssessmentService.js'),
      '../services/participationService': path.resolve(__dirname, 'src/preview/mockParticipationService.js'),
      '../services/runTrackerService': path.resolve(__dirname, 'src/preview/mockRunTrackerService.js'),
      '../services/classroomManagementService': path.resolve(__dirname, 'src/preview/mockClassroomManagementService.js'),
    },
  },
  build: {
    outDir: 'dist-preview',
    rollupOptions: {
      input: path.resolve(__dirname, 'preview.html'),
    },
  },
})
