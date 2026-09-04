import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  CalendarCheck2,
  CalendarRange,
  Users2,
  Settings,
  Sun,
  Moon,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  LineChart,
  Timer,
  Target,
  Sparkles,
  BookCheck,
  PartyPopper,
  Flame,
  ScrollText,
  FolderOpen,
  BookMarked,
  FileInput,
  Layers,
  MoreHorizontal,
  X,
  Trophy,
  Briefcase,
  Accessibility,
  HeartPulse,
  Award,
  School,
  BadgeDollarSign,
  FileSliders,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useTrial } from '../../context/TrialContext'
import PaywallModal from '../PaywallModal'
import TrialWatermark from '../TrialWatermark'
import WhatsNewBanner from '../WhatsNewBanner'
import SiteFooter from '../SiteFooter'
import SetPasswordBanner from '../SetPasswordBanner'
import GettingStartedChecklist from '../GettingStartedChecklist'
import CustomerMilestone from '../CustomerMilestone'
import { SPECIALTY_CONTEXTS } from '../../constants/moduleHomes'
import { trackToolUsage } from '../../services/productUsageService'

// Only PE-owned routes receive the PE navigation. Shared areas such as the
// lesson library, schedule, rosters, and SMART goals belong to every specialty.
const PE_ROUTE_PREFIXES = [
  '/pe-health',
  '/generate',
  '/participation',
  '/run-tracker',
  '/coaching',
  '/staff-wellness',
  '/curriculum-map',
  '/adaptive-pe',
]

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(prefix + '/')
}

function findModuleByLabel(value) {
  if (!value) return null
  return Object.entries(SPECIALTY_CONTEXTS).find(([slug, config]) =>
    value === slug || value === config.moduleLabel || value === config.title
  ) ?? null
}

const TRACKED_TOOL_ROUTES = [
  ['/lesson-format', 'lesson-plan-format'],
  ['/teacher-wellness', 'teacher-wellness'],
  ['/my-year', 'my-school-year'],
  ['/participation', 'participation'], ['/run-tracker', 'run-tracker'], ['/coaching', 'coaching-tryouts'],
  ['/staff-wellness', 'staff-wellness'], ['/programs', 'student-programs'], ['/smart-goals', 'smart-goals'],
  ['/assessments', 'assessment-bank'], ['/standards-tracker', 'standards-tracker'], ['/pacing-guide', 'pacing-guide'],
  ['/activity-bank', 'activity-bank'], ['/warm-up-generator', 'warm-up-generator'], ['/eoy-narrative', 'eoy-narrative'],
  ['/portfolio', 'portfolio-builder'], ['/sub-binder', 'sub-binder'], ['/import', 'import-enhance'], ['/build-unit', 'unit-builder'],
  ['/art/art-show', 'art-show'], ['/library/reading-challenges', 'reading-challenges'], ['/library/newsletters', 'library-newsletters'],
  ['/library/book-matchmaker', 'book-matchmaker'], ['/library/book-tasting', 'book-tasting'], ['/library/collaboration', 'teacher-collaboration'],
  ['/library/family-literacy-night', 'family-literacy-night'], ['/library/research-quest', 'research-quest'], ['/library/makerspace', 'makerspace'],
  ['/reading-specialist/family-night', 'reading-family-night'], ['/math-specialist/family-night', 'math-family-night'],
  ['/pe-health/events', 'pe-events'], ['/stem/stem-night', 'stem-night'], ['/music/concert-builder', 'music-concert'],
  ['/theater/production-planner', 'theater-production'], ['/dance/recital-planner', 'dance-recital'], ['/cte/experiences', 'cte-experiences'],
  ['/world-languages/experiences', 'world-language-experiences'], ['/early-childhood/family-events', 'early-family-events'],
  ['/esl-specialist/family-night', 'esl-family-night'], ['/gifted-talented/showcase', 'gifted-showcase'],
  ['/test-prep/family-support', 'test-prep-family-support'], ['/open-house', 'open-house'],
  ['/funding', 'funding-studio'],
]

function trackedToolFor(pathname) {
  const match = TRACKED_TOOL_ROUTES.find(([route]) => pathname === route || pathname.startsWith(`${route}/`))
  if (match) return match[1]
  if (/^\/[a-z-]+\/generate$/.test(pathname) || pathname === '/generate') return 'lesson-generator'
  return null
}

function useNavigationContext() {
  const { pathname, search } = useLocation()

  if (PE_ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return { type: 'pe' }
  }

  const routeSlug = pathname.split('/').filter(Boolean)[0]
  if (routeSlug && SPECIALTY_CONTEXTS[routeSlug]) {
    return { type: 'module', slug: routeSlug, config: SPECIALTY_CONTEXTS[routeSlug] }
  }

  // Shared tools keep the specialty workspace visible when opened from a
  // module. This lets teachers move between goals, rosters, planning tools,
  // and their module without losing their place.
  const requestedModule = new URLSearchParams(search).get('module')
  if (requestedModule === 'PE & Health') return { type: 'pe' }
  const moduleEntry = findModuleByLabel(requestedModule)
  if (moduleEntry) {
    const [slug, config] = moduleEntry
    return { type: 'module', slug, config }
  }

  return { type: 'general' }
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', mobileLabel: 'Home', icon: LayoutDashboard },
  { to: '/my-year', label: 'My School Year', mobileLabel: 'My Year', icon: CalendarCheck2 },
  { to: '/lesson-format', label: 'My Plan Format', mobileLabel: 'Plan Format', icon: FileSliders, mobileHidden: true },
  { to: '/lessons', label: 'Lesson Library', mobileLabel: 'Library', icon: BookOpen },
  { to: '/schedule', label: 'My Schedule', mobileLabel: 'Schedule', icon: CalendarDays },
  { to: '/students', label: 'Classes & Rosters', mobileLabel: 'Classes', icon: Users2 },
  { to: '/participation', label: 'Participation', mobileLabel: 'Participation', icon: ClipboardCheck },
  { to: '/run-tracker', label: 'Run Tracker', mobileLabel: 'Run', icon: Timer },
  { to: '/smart-goals', label: 'SMART Goals', mobileLabel: 'Goals', icon: Target, mobileHidden: true },
  { to: '/curriculum-map', label: 'Year Plan', mobileLabel: 'Year', icon: CalendarRange, mobileHidden: true },
]

const PE_NAV_ITEMS = [
  { to: '/pe-health', label: 'PE Dashboard', mobileLabel: 'PE Home', icon: LayoutDashboard },
  { to: '/my-year?module=PE%20%26%20Health', label: 'My School Year', mobileLabel: 'My Year', icon: CalendarCheck2 },
  { to: '/lesson-format', label: 'My Plan Format', mobileLabel: 'Plan Format', icon: FileSliders, mobileHidden: true },
  { to: '/students?module=PE%20%26%20Health', label: 'Classes & Rosters', mobileLabel: 'Classes', icon: Users2 },
  { to: '/participation', label: 'Participation', mobileLabel: 'Participation', icon: ClipboardCheck },
  { to: '/run-tracker', label: 'Run Tracker', mobileLabel: 'Run', icon: Timer },
  { to: '/coaching', label: 'Coaching & Tryouts', mobileLabel: 'Tryouts', icon: Trophy },
  { to: '/teacher-wellness', label: 'Teacher Wellness', mobileLabel: 'My Wellness', icon: HeartPulse },
  { to: '/staff-wellness', label: 'Staff Challenges', mobileLabel: 'Staff', icon: Users2 },
  { to: '/programs?module=PE%20%26%20Health', label: 'Student Challenges', mobileLabel: 'Challenges', icon: Award, mobileHidden: true },
  { to: '/pe-health/events', label: 'PE Events Studio', mobileLabel: 'Events', icon: Trophy, mobileHidden: true },
  { to: '/open-house?module=PE%20%26%20Health', label: 'Open House Planner', mobileLabel: 'Open House', icon: School, mobileHidden: true },
  { to: '/funding?module=PE%20%26%20Health', label: 'Funding & Grants', mobileLabel: 'Funding', icon: BadgeDollarSign, mobileHidden: true },
  { to: '/smart-goals?module=PE%20%26%20Health', label: 'SMART Goals', mobileLabel: 'Goals', icon: Target, mobileHidden: true },
  { to: '/curriculum-map', label: 'Year Plan', mobileLabel: 'Year', icon: CalendarRange, mobileHidden: true },
  { to: '/lessons?module=PE%20%26%20Health', label: 'PE Lesson Library', mobileLabel: 'Library', icon: BookOpen, mobileHidden: true },
  { to: '/schedule?module=PE%20%26%20Health', label: 'My Schedule', mobileLabel: 'Schedule', icon: CalendarDays, mobileHidden: true },
]

const PE_MOBILE_MORE_ITEMS = [
  PE_NAV_ITEMS[2],
  PE_NAV_ITEMS[3],
  PE_NAV_ITEMS[6],
  ...PE_NAV_ITEMS.slice(7),
  { to: '/adaptive-pe', label: 'Adaptive PE & IEP', icon: Accessibility },
  { to: '/assessments?module=PE%20%26%20Health', label: 'Assessment Bank', icon: BookCheck },
  { to: '/standards-tracker?module=PE%20%26%20Health', label: 'Standards Tracker', icon: BarChart3 },
  { to: '/pacing-guide?module=PE%20%26%20Health', label: 'Pacing Guide', icon: CalendarRange },
  { to: '/activity-bank?module=PE%20%26%20Health', label: 'Activity Bank', icon: PartyPopper },
  { to: '/warm-up-generator?module=PE%20%26%20Health', label: 'Warm-up Generator', icon: Flame },
  { to: '/field-day', label: 'Field Day Planner', icon: Trophy },
  { to: '/portfolio?module=PE%20%26%20Health', label: 'Portfolio Builder', icon: Briefcase },
  { to: '/sub-binder?subject=pe-health&module=PE%20%26%20Health', label: 'Sub Binder', icon: BookMarked },
  { to: '/import?subject=pe-health&module=PE%20%26%20Health', label: 'Import & Enhance', icon: FileInput },
  { to: '/build-unit?subject=pe-health&module=PE%20%26%20Health', label: 'Unit Builder', icon: Layers },
  { to: '/eoy-narrative?module=PE%20%26%20Health', label: 'EOY Narrative', icon: ScrollText },
]

const MODULE_TOOL_ITEMS = {
  programs: { to: '/programs', label: 'Challenges & Programs', icon: Award },
  assessments: { to: '/assessments', label: 'Assessment Bank', icon: BookCheck },
  standards: { to: '/standards-tracker', label: 'Standards Tracker', icon: BarChart3 },
  pacing: { to: '/pacing-guide', label: 'Pacing Guide', icon: CalendarRange },
  activity: { to: '/activity-bank', label: 'Activity Bank', icon: PartyPopper },
  warmup: { to: '/warm-up-generator', label: 'Warm-up Generator', icon: Flame },
  eoy: { to: '/eoy-narrative', label: 'EOY Narrative', icon: ScrollText },
  portfolio: { to: '/portfolio', label: 'Portfolio Builder', icon: FolderOpen },
  subbinder: { to: '/sub-binder', label: 'Sub Binder', icon: BookMarked, needsSubject: true },
  import: { to: '/import', label: 'Import & Enhance', icon: FileInput, needsSubject: true },
  unit: { to: '/build-unit', label: 'Unit Builder', icon: Layers, needsSubject: true },
}

function withModuleContext(to, config, slug, needsSubject = false) {
  const params = new URLSearchParams()
  if (needsSubject) params.set('subject', slug)
  params.set('module', config.moduleLabel)
  return `${to}?${params.toString()}`
}

function getModuleNavItems(slug, config) {
  const browseTo = config.browsePath ?? `/lessons?module=${encodeURIComponent(config.moduleLabel)}`
  const coreItems = [
    { to: `/${slug}`, label: `${config.title} Home`, mobileLabel: 'Home', icon: LayoutDashboard, end: true },
    { to: withModuleContext('/my-year', config, slug), label: 'My School Year', mobileLabel: 'My Year', icon: CalendarCheck2 },
    { to: '/lesson-format', label: 'My Plan Format', mobileLabel: 'Plan Format', icon: FileSliders },
    { to: config.generatePath, label: 'Create New', mobileLabel: 'Create', icon: Sparkles },
    { to: browseTo, label: 'My Lessons & Resources', mobileLabel: 'Lessons', icon: BookOpen },
    { to: withModuleContext('/smart-goals', config, slug), label: 'SMART Goals', mobileLabel: 'SMART Goal', icon: Target },
    { to: withModuleContext('/students', config, slug), label: 'Classes & Rosters', mobileLabel: 'Classes', icon: Users2 },
    { to: withModuleContext('/schedule', config, slug), label: 'My Schedule', mobileLabel: 'Schedule', icon: CalendarDays },
  ]

  const toolItems = (config.cards ?? [])
    .filter((key) => !['goals', 'schedule'].includes(key))
    .map((key) => {
      const item = MODULE_TOOL_ITEMS[key]
      if (!item) return null
      return { ...item, to: withModuleContext(item.to, config, slug, item.needsSubject) }
    })
    .filter(Boolean)

  const specialtyItems = (config.specialtyCards ?? []).map((item) => ({
    to: item.to,
    label: item.title,
    icon: item.Icon,
  }))

  const sharedItems = [
    { to: '/teacher-wellness', label: 'Teacher Health & Wellness', icon: HeartPulse },
    { to: withModuleContext('/open-house', config, slug), label: 'Open House Planner', icon: School },
    { to: withModuleContext('/funding', config, slug), label: 'Funding & Grants', icon: BadgeDollarSign },
  ]

  return { coreItems, toolItems: [...specialtyItems, ...sharedItems, ...toolItems] }
}

export default function AppShell() {
  const navigation = useNavigationContext()
  const showSidebar = navigation.type !== 'general'
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const requestedUsageModule = new URLSearchParams(search).get('module')
  const usageModuleLabel = navigation.type === 'pe' ? 'PE & Health' : navigation.type === 'module' ? navigation.config.moduleLabel : requestedUsageModule || 'Shared tools'

  useEffect(() => {
    const toolKey = trackedToolFor(pathname)
    if (toolKey) void trackToolUsage(toolKey, 'opened', { moduleLabel: usageModuleLabel })
    const isModuleHome = (navigation.type === 'pe' && pathname === '/pe-health')
      || (navigation.type === 'module' && pathname === `/${navigation.slug}`)
    if (isModuleHome) void trackToolUsage('module-home', 'opened', { moduleLabel: usageModuleLabel })
  }, [navigation.type, navigation.slug, pathname, search, usageModuleLabel])

  // React Router intentionally preserves document scroll. For a multi-page
  // teaching app that made a newly opened module appear halfway down the page.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  // Honor a pending "update card" redirect set by the dunning login gate. Needed for
  // the magic-link sign-in path, which lands the user at the site root rather than at
  // /update-card. Password sign-in keeps the URL, so it never reaches here. Flag is
  // one-shot and expires after 15 min to avoid a stale bounce on a later normal login.
  useEffect(() => {
    let raw = null
    try { raw = localStorage.getItem('cardUpdateRedirect') } catch { /* ignore */ }
    if (!raw) return
    try { localStorage.removeItem('cardUpdateRedirect') } catch { /* ignore */ }
    if (Date.now() - Number(raw) < 15 * 60 * 1000) navigate('/update-card', { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-screen bg-ink-950">
      {showSidebar && <Sidebar navigation={navigation} />}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar showSidebar={showSidebar} navigation={navigation} />
        <main className="flex-1 px-6 pt-8 pb-24 md:px-10 md:pb-8">
          <div className="mx-auto max-w-6xl">
            <SetPasswordBanner />
            <CustomerMilestone />
            <GettingStartedChecklist />
            {(pathname === '/' || pathname === '/pe-health') && <WhatsNewBanner />}
            <Outlet />
            <TrialWatermark />
            <SiteFooter />
          </div>
        </main>
      </div>
      <BottomTabBar key={pathname} navigation={navigation} />
      <PaywallModal />
    </div>
  )
}

function TrialBadge() {
  const { isTrial, isExpired, daysLeft, openPaywall } = useTrial()
  if (!isTrial && !isExpired) return null

  const label = isExpired
    ? 'Trial ended'
    : `Trial: ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`

  return (
    <button
      onClick={() => openPaywall(isExpired ? 'trial-expired' : 'gated-feature')}
      className="hidden sm:inline-flex items-center rounded-full bg-accent-500/10 px-3 py-1.5 text-xs font-semibold text-accent-700 transition-colors hover:bg-accent-500/20"
    >
      {label} · Upgrade
    </button>
  )
}

function DarkModeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-900 hover:text-ink-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
    >
      {dark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  )
}

function Sidebar({ navigation }) {
  const { isOwner } = useTrial()
  const isPE = navigation.type === 'pe'
  const moduleNavigation = navigation.type === 'module'
    ? getModuleNavItems(navigation.slug, navigation.config)
    : null
  const primaryItems = isPE ? PE_NAV_ITEMS : moduleNavigation.coreItems
  const ModuleIcon = navigation.type === 'module' ? navigation.config.Icon : null

  return (
    <aside className="hidden md:flex md:w-64 md:sticky md:top-0 md:h-screen flex-col overflow-y-auto border-r border-ink-900 bg-white dark:bg-ink-950 px-4 py-6">
      <Link to="/" className="flex items-center gap-2.5 px-2 mb-8">
        <PlansK12Logo />
      </Link>

      {navigation.type === 'module' && (
        <div className={`mb-5 rounded-xl border border-ink-800 p-3 ${navigation.config.accent.well}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-ink-950/60">
              <ModuleIcon size={19} className={navigation.config.accent.text} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-100">{navigation.config.title}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Specialty workspace</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {primaryItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-500/10 text-accent-700'
                  : 'text-ink-500 hover:bg-ink-950 hover:text-ink-100'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {moduleNavigation?.toolItems.length > 0 && (
        <div className="mt-6 border-t border-ink-900 pt-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">More tools</p>
          <nav className="flex flex-col gap-1">
            {moduleNavigation.toolItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={`${to}-${label}`}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-500/10 text-accent-700'
                      : 'text-ink-500 hover:bg-ink-950 hover:text-ink-100'
                  }`
                }
              >
                <Icon size={17} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <div className="mt-auto pt-6 space-y-1">
        {isOwner && <NavLink to="/owner" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-accent-500/10 text-accent-400' : 'text-ink-500 hover:bg-ink-900 hover:text-ink-100'}`}><LineChart size={18} /> Growth &amp; Retention</NavLink>}
        {isPE && <NavLink
          to="/assessments?module=PE%20%26%20Health"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-accent-500/10 text-accent-400'
                : 'text-ink-500 hover:bg-ink-900 hover:text-ink-100'
            }`
          }
        >
          <ClipboardList size={18} strokeWidth={2} />
          Assessment Bank
        </NavLink>}
        <NavLink
          to="/district-report"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-accent-500/10 text-accent-400'
                : 'text-ink-500 hover:bg-ink-900 hover:text-ink-100'
            }`
          }
        >
          <BarChart3 size={18} strokeWidth={2} />
          District Report
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-accent-500/10 text-accent-400'
                : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100'
            }`
          }
        >
          <Settings size={18} strokeWidth={2} />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}

function Topbar({ showSidebar, navigation }) {
  const { isOwner } = useTrial()
  const goalsPath = navigation.type === 'module'
    ? withModuleContext('/smart-goals', navigation.config, navigation.slug)
    : navigation.type === 'pe'
      ? '/smart-goals?module=PE%20%26%20Health'
      : '/smart-goals'
  return (
    <header className="flex items-center justify-between border-b border-ink-900 bg-white dark:bg-ink-950 px-6 py-4 md:px-10">
      {/* Logo shows on mobile always; on desktop only when the sidebar isn't
          carrying it (e.g. the home launcher and non-PE module pages), so every
          screen has a visible logo. */}
      <Link to="/" className={`flex items-center gap-2.5 ${showSidebar ? 'md:hidden' : ''}`}>
        <PlansK12Logo />
      </Link>
      {showSidebar && <div className="hidden md:block" />}
      <div className="flex items-center gap-2">
        <TrialBadge />
        <DarkModeToggle />
        {isOwner && (
          <NavLink
            to="/owner"
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
                isActive
                  ? 'bg-accent-500/10 text-accent-700'
                  : 'text-ink-500 hover:bg-ink-900 hover:text-ink-100'
              }`
            }
            aria-label="Growth & Retention"
            title="Growth & Retention"
          >
            <LineChart size={20} strokeWidth={2} />
          </NavLink>
        )}
        <NavLink
          to={goalsPath}
          className={({ isActive }) =>
            `flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
              isActive
                ? 'bg-accent-500/10 text-accent-700'
                : 'text-ink-500 hover:bg-ink-900 hover:text-ink-100'
            }`
          }
          aria-label="SMART Goals"
          title="SMART Goals"
        >
          <Target size={20} strokeWidth={2} />
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
              isActive
                ? 'bg-accent-500/10 text-accent-700'
                : 'text-ink-500 hover:bg-ink-900 hover:text-ink-100'
            }`
          }
          aria-label="Settings"
        >
          <Settings size={20} strokeWidth={2} />
        </NavLink>
        <div className="h-8 w-8 rounded-full bg-ink-900 flex items-center justify-center text-xs font-semibold text-ink-300">
          ST
        </div>
      </div>
    </header>
  )
}

function BottomTabBar({ navigation }) {
  const [toolsOpen, setToolsOpen] = useState(false)
  const isPERoute = navigation.type === 'pe'
  const moduleNavigation = navigation.type === 'module'
    ? getModuleNavItems(navigation.slug, navigation.config)
    : null
  const peTabs = [PE_NAV_ITEMS[0], PE_NAV_ITEMS[1], PE_NAV_ITEMS[3], PE_NAV_ITEMS[4]]
  const moduleTabs = moduleNavigation
    ? moduleNavigation.coreItems.slice(0, 4)
    : null
  const tabItems = isPERoute
    ? peTabs
    : moduleTabs
      ? moduleTabs
    : [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[3]]

  const moreItems = isPERoute
    ? PE_MOBILE_MORE_ITEMS
    : moduleNavigation
      ? [...moduleNavigation.coreItems.slice(4), ...moduleNavigation.toolItems]
      : []
  const hasMoreTools = moreItems.length > 0
  const workspaceName = isPERoute
    ? 'PE & Health'
    : navigation.type === 'module'
      ? navigation.config.title
      : null

  useEffect(() => {
    if (!toolsOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [toolsOpen])

  return (
    <>
      <nav aria-label={isPERoute ? 'PE tools' : navigation.type === 'module' ? `${navigation.config.title} tools` : 'Main navigation'} data-no-print className="bottom-nav md:hidden fixed bottom-0 inset-x-0 z-50 flex border-t border-ink-900 bg-white dark:bg-ink-950">
        {tabItems.map(({ to, label, mobileLabel, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium leading-none transition-colors ${
                isActive ? 'text-accent-700' : 'text-ink-400'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            {mobileLabel ?? label}
          </NavLink>
        ))}
        {hasMoreTools && (
          <button
            type="button"
            onClick={() => setToolsOpen(true)}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium leading-none transition-colors ${
              toolsOpen ? 'text-accent-700' : 'text-ink-400'
            }`}
            aria-label={`More ${workspaceName} tools`}
            aria-expanded={toolsOpen}
          >
            <span className="absolute right-[22%] top-2 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white dark:ring-ink-950" aria-hidden="true" />
            <MoreHorizontal size={20} strokeWidth={2} />
            More
          </button>
        )}
      </nav>

      {toolsOpen && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label={`${workspaceName} tools`}>
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setToolsOpen(false)}
            aria-label="Close tools menu"
          />
          <section className="absolute inset-x-0 bottom-0 max-h-[82vh] animate-[mobile-tools-slide-up_180ms_ease-out] overflow-y-auto rounded-t-3xl border-t border-ink-800 bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 shadow-2xl dark:bg-ink-950">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-700">Your specialty toolkit</p>
                <h2 className="mt-1 text-xl font-bold text-ink-100">All {workspaceName} tools</h2>
                <p className="mt-1 text-sm text-ink-500">Everything available in your workspace, all in one place.</p>
              </div>
              <button
                type="button"
                onClick={() => setToolsOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-ink-400"
                aria-label="Close tools menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {moreItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={`${to}-${label}`}
                  to={to}
                  onClick={() => setToolsOpen(false)}
                  className="flex min-h-24 flex-col justify-between rounded-2xl border border-ink-800 bg-ink-950 p-4 text-left transition-colors hover:border-accent-500/40 hover:bg-accent-500/5"
                >
                  <Icon size={22} className="text-accent-600" />
                  <span className="mt-4 text-sm font-semibold leading-snug text-ink-100">{label}</span>
                </NavLink>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function PlansK12Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Document icon */}
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Page body */}
        <path d="M2 2C2 0.895 2.895 0 4 0H18L26 8V30C26 31.105 25.105 32 24 32H4C2.895 32 2 31.105 2 30V2Z" fill="#4F7FFA" />
        {/* Dog-ear triangle */}
        <path d="M18 0L26 8H20C18.895 8 18 7.105 18 6V0Z" fill="#3b6de8" />
        {/* Text line 1 */}
        <rect x="6" y="14" width="14" height="2" rx="1" fill="white" fillOpacity="0.8" />
        {/* Text line 2 */}
        <rect x="6" y="19" width="10" height="2" rx="1" fill="white" fillOpacity="0.6" />
        {/* Check circle */}
        <circle cx="20" cy="26" r="7" fill="#0ea5e9" />
        <path d="M16.5 26L19 28.5L23.5 23.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Wordmark */}
      <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.01em' }}>
        <span className="text-ink-50">Plans</span><span style={{ color: '#4F7FFA' }}>K12</span>
      </span>
    </div>
  )
}
