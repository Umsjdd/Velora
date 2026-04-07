import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Server,
  Mail,
  HardDrive,
  Globe,
  Database,
  BarChart3,
  Activity,
  CreditCard,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/servers', label: 'Servers', icon: Server },
  { to: '/email', label: 'Email', icon: Mail },
  { to: '/storage', label: 'Storage', icon: HardDrive },
  { to: '/domains', label: 'Domains', icon: Globe },
  { to: '/databases', label: 'Databases', icon: Database },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/monitoring', label: 'Monitoring', icon: Activity },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[240px] bg-[#0a0a12] border-r border-white/[0.06]
          flex flex-col transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4a6cf7] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L3 9L12 16L21 9L12 2Z"
                  fill="white"
                  fillOpacity="0.9"
                />
                <path
                  d="M3 14L12 21L21 14"
                  stroke="white"
                  strokeOpacity="0.5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[#eeeef0] font-semibold text-lg tracking-tight">
              Vestora
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-[#7a7a8e] hover:text-[#eeeef0] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#4a6cf7]/10 text-[#6b8aff]'
                      : 'text-[#7a7a8e] hover:text-[#eeeef0] hover:bg-white/[0.03]'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-white/[0.06] p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a6cf7] to-[#7c5cf7] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#eeeef0] truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-[#4a4a5e] truncate">
                {user?.email || ''}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-[#4a4a5e] hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
