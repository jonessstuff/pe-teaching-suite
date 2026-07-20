import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
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
  BarChart3,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useTrial } from '../../context/TrialContext'
import PaywallModal from '../PaywallModal'
import TrialWatermark from '../TrialWatermark'

const PE_ROUTE_PREFIXES = [
  '/pe-health',
  '/generate',
  '/lessons',
  '/schedule',
  '/students',
  '/curriculum-map',
  '/adaptive-pe',
]

function usePERoute() {
  const { pathname } = useLocation()
  return PE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', mobileLabel: 'Home', icon: LayoutDashboard },
  { to: '/lessons', label: 'Lesson Library', mobileLabel: 'Library', icon: BookOpen },
  { to: '/schedule', label: 'My Schedule', mobileLabel: 'Schedule', icon: CalendarDays },
  { to: '/students', label: 'My Students', mobileLabel: 'Students', icon: Users2 },
  { to: '/curriculum-map', label: 'Year Plan', mobileLabel: 'Year', icon: CalendarRange, mobileHidden: true },
]

export default function AppShell() {
  const showSidebar = usePERoute()

  return (
    <div className="flex min-h-screen bg-ink-950">
      {showSidebar && <Sidebar />}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-6 pt-8 pb-24 md:px-10 md:pb-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomTabBar />
      <TrialWatermark />
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
      className="flex items-center justify-center rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-900 hover:text-ink-200"
    >
      {dark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  )
}

function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 flex-col border-r border-ink-900 bg-white dark:bg-ink-950 px-4 py-6">
      <Link to="/" className="flex items-center gap-2.5 px-2 mb-8">
        <PlansK12Logo />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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

      <div className="mt-auto pt-6 space-y-1">
        <NavLink
          to="/assessments"
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
        </NavLink>
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

function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-ink-900 bg-white dark:bg-ink-950 px-6 py-4 md:px-10">
      <Link to="/" className="flex items-center gap-2.5 md:hidden">
        <PlansK12Logo />
      </Link>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2">
        <TrialBadge />
        <DarkModeToggle />
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center justify-center rounded-lg p-2 transition-colors ${
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

function BottomTabBar() {
  const tabItems = NAV_ITEMS.filter(({ mobileHidden }) => !mobileHidden)
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex border-t border-ink-900 bg-white dark:bg-ink-950">
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
        <span style={{ color: '#1a1a2e' }}>Plans</span><span style={{ color: '#4F7FFA' }}>K12</span>
      </span>
    </div>
  )
}
