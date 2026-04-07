import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Overview from './pages/Overview'
import Servers from './pages/Servers'
import Email from './pages/Email'
import Storage from './pages/Storage'
import Domains from './pages/Domains'
import Databases from './pages/Databases'
import Analytics from './pages/Analytics'
import Monitoring from './pages/Monitoring'
import Billing from './pages/Billing'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return children
}

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#4a6cf7] flex items-center justify-center animate-pulse">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 9L12 16L21 9L12 2Z" fill="white" fillOpacity="0.9" />
              <path d="M3 14L12 21L21 14" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[#4a4a5e] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="servers" element={<Servers />} />
        <Route path="email" element={<Email />} />
        <Route path="storage" element={<Storage />} />
        <Route path="domains" element={<Domains />} />
        <Route path="databases" element={<Databases />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="billing" element={<Billing />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
