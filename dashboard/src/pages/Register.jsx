import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#4a6cf7] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 9L12 16L21 9L12 2Z" fill="white" fillOpacity="0.9" />
              <path d="M3 14L12 21L21 14" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[#eeeef0] font-bold text-2xl tracking-tight">Vestora</span>
        </div>

        {/* Card */}
        <div className="bg-[#0c0c18] border border-white/[0.06] rounded-xl p-6">
          <h1 className="text-xl font-semibold text-[#eeeef0] mb-1">Create account</h1>
          <p className="text-sm text-[#7a7a8e] mb-6">Get started with Vestora infrastructure</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#7a7a8e] mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a5e]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a12] border border-white/[0.06] rounded-lg text-sm text-[#eeeef0] placeholder:text-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7a7a8e] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a5e]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a12] border border-white/[0.06] rounded-lg text-sm text-[#eeeef0] placeholder:text-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7a7a8e] mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a5e]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0a0a12] border border-white/[0.06] rounded-lg text-sm text-[#eeeef0] placeholder:text-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a5e] hover:text-[#7a7a8e] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#4a6cf7] hover:bg-[#3a56d4] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#4a4a5e] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[#4a6cf7] hover:text-[#6b8aff] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
