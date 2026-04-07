import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'

const routeTitles = {
  '/': 'Overview',
  '/servers': 'Servers',
  '/email': 'Email',
  '/storage': 'Storage',
  '/domains': 'Domains',
  '/databases': 'Databases',
  '/analytics': 'Analytics',
  '/monitoring': 'Monitoring',
  '/billing': 'Billing',
  '/settings': 'Settings',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  const pageTitle = routeTitles[location.pathname] || 'Dashboard'

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className="flex h-screen bg-[#05050a] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="h-16 border-b border-white/[0.06] bg-[#05050a]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#7a7a8e] hover:text-[#eeeef0] hover:bg-white/[0.03] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-[#eeeef0]">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-[#7a7a8e] hover:text-[#eeeef0] hover:bg-white/[0.03] transition-colors">
              <Bell size={19} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4a6cf7] rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a6cf7] to-[#7c5cf7] flex items-center justify-center text-white text-xs font-semibold ml-1 cursor-pointer">
              {initials}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
