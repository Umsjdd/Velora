import { useState } from 'react'
import { User, Lock, Key, Bell, AlertTriangle, Copy, Check, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function Settings() {
  const { user } = useAuth()

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    securityAlerts: true,
    usageAlerts: false,
    newsletter: false,
  })

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const mockApiKey = 'vst_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')
    setProfileSuccess(false)
    try {
      await api.put('/api/auth/me', { name: profile.name, email: profile.email })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (passwords.new.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      await api.put('/api/auth/password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      })
      setPasswords({ current: '', new: '', confirm: '' })
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(mockApiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#eeeef0]">Settings</h1>
        <p className="text-[#7a7a8e] mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#4a6cf7]/10 flex items-center justify-center">
            <User className="w-5 h-5 text-[#4a6cf7]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#eeeef0]">Profile</h2>
            <p className="text-[#7a7a8e] text-sm">Update your personal information</p>
          </div>
        </div>

        {profileError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{profileError}</div>
        )}
        {profileSuccess && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">Profile updated successfully.</div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Full name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Email address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#eeeef0]">Password</h2>
            <p className="text-[#7a7a8e] text-sm">Change your account password</p>
          </div>
        </div>

        {passwordError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{passwordError}</div>
        )}
        {passwordSuccess && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">Password updated successfully.</div>
        )}

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Current password</label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              placeholder="Enter current password"
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">New password</label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              placeholder="At least 8 characters"
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Confirm new password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              placeholder="Re-enter new password"
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* API Keys Section */}
      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#eeeef0]">API Keys</h2>
            <p className="text-[#7a7a8e] text-sm">Manage your API access keys</p>
          </div>
        </div>

        <div className="bg-[#05050a] rounded-xl border border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#eeeef0]">Live API Key</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">Active</span>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white/5 rounded-lg px-4 py-2.5 text-sm text-[#7a7a8e] font-mono truncate">
              {mockApiKey}
            </code>
            <button
              onClick={handleCopyApiKey}
              className="flex-shrink-0 p-2.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] text-[#7a7a8e] hover:text-white transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-[#4a4a5e] mt-2">Keep this key secret. Do not share it publicly.</p>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#eeeef0]">Notifications</h2>
            <p className="text-[#7a7a8e] text-sm">Configure how you receive notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates about your account via email' },
            { key: 'securityAlerts', label: 'Security Alerts', desc: 'Get notified about security-related events' },
            { key: 'usageAlerts', label: 'Usage Alerts', desc: 'Alerts when approaching resource limits' },
            { key: 'newsletter', label: 'Newsletter', desc: 'Receive product updates and news' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#eeeef0]">{item.label}</p>
                <p className="text-xs text-[#4a4a5e] mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[item.key] ? 'bg-[#4a6cf7]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#0a0a12] border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
            <p className="text-[#7a7a8e] text-sm">Irreversible actions</p>
          </div>
        </div>
        <p className="text-[#7a7a8e] text-sm mb-4">
          Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
        </p>
        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-red-500/20">
          Delete Account
        </button>
      </div>
    </div>
  )
}
