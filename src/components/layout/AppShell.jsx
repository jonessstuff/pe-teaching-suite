import { useEffect } from 'react'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
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

// Only PE-owned routes receive the PE navigation. Shared areas such as the
// lesson library, schedule, rosters, and SMART goals belong to every specialty.
const PE_ROUTE_PREFIXES = [
  '/pe-health',
  '/generate',
  '/participation',
  '/run-tracker',
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
  { to: '/students?module=PE%20%26%20Health', label: 'Classes & Rosters', mobileLabel: 'Classes', icon: Users2 },
  { to: '/participation', label: 'Participation', mobileLabel: 'Participation', icon: ClipboardCheck },
  { to: '/run-tracker', label: 'Run Tracker', mobileLabel: 'Run', icon: Timer },
  { to: '/smart-goals?module=PE%20%26%20Health', label: 'SMART Goals', mobileLabel: 'Goals', icon: Target, mobileHidden: true },
  { to: '/curriculum-map', label: 'Year Plan', mobileLabel: 'Year', icon: CalendarRange, mobileHidden: true },
  { to: '/lessons?module=PE%20%26%20Health', label: 'PE Lesson Library', mobileLabel: 'Library', icon: BookOpen, mobileHidden: true },
  { to: '/schedule?module=PE%20%26%20Health', label: 'My Schedule', mobileLabel: 'Schedule', icon: CalendarDays, mobileHidden: true },
]

const MODULE_TOOL_ITEMS = {
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
    { to: config.generatePath, label: 'Create New', mobileLabel: 'Create', icon: Sparkles },
    { to: browseTo, label: 'My Lessons & Resources', mobileLabel: 'Lessons', icon: BookOpen },
    { to: withModuleContext('/smart-goals', config, slug), label: 'SMART Goals', mobileLabel: 'Goals', icon: Target },
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

  return { coreItems, toolItems: [...specialtyItems, ...toolItems] }
}

export default function AppShell() {
  const navigation = useNavigationContext()
  const showSidebar = navigation.type !== 'general'
  const { pathname } = useLocation()
  const navigate = useNavigate()

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
      <BottomTabBar navigation={navigation} />
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
  const isPERoute = navigation.type === 'pe'
  const moduleItems = navigation.type === 'module'
    ? getModuleNavItems(navigation.slug, navigation.config).coreItems.slice(0, 5)
    : null
  const tabItems = isPERoute
    ? PE_NAV_ITEMS.slice(0, 4)
    : moduleItems
      ? moduleItems
    : [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[3]]
  return (
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
    </nav>
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
