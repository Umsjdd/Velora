import { useState, useEffect, useCallback } from 'react'
import { Mail, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, AtSign, Inbox } from 'lucide-react'
import api from '../lib/api'
import StatsCard from '../components/StatsCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 text-emerald-400',
  inactive: 'bg-red-500/10 text-red-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-white/5 text-[#7a7a8e]'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}

export default function Email() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [showDelete, setShowDelete] = useState(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ address: '', domain: 'vestora.io' })
  const [editForm, setEditForm] = useState({ forwardTo: '' })

  const fetchEmails = useCallback(async () => {
    try {
      const data = await api.get('/api/emails')
      setEmails(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load email accounts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.address.trim()) return
    setCreating(true)
    try {
      await api.post('/api/emails', { address: form.address, domain: form.domain })
      setShowCreate(false)
      setForm({ address: '', domain: 'vestora.io' })
      await fetchEmails()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (emailItem) => {
    const id = emailItem._id || emailItem.id
    const newStatus = emailItem.status === 'active' ? 'inactive' : 'active'
    try {
      await api.put(`/api/emails/${id}`, { status: newStatus })
      await fetchEmails()
    } catch (err) {
      setError(err.message)
    }
  }

  const openEdit = (emailItem) => {
    setEditForm({ forwardTo: emailItem.forwardTo || emailItem.forward_to || '' })
    setShowEdit(emailItem._id || emailItem.id)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/api/emails/${showEdit}`, { forwardTo: editForm.forwardTo })
      setShowEdit(null)
      await fetchEmails()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    try {
      await api.delete(`/api/emails/${showDelete}`)
      setShowDelete(null)
      await fetchEmails()
    } catch (err) {
      setError(err.message)
    }
  }

  const active = emails.filter((e) => e.status === 'active').length
  const inactive = emails.filter((e) => e.status === 'inactive').length
  const totalStorage = emails.reduce((sum, e) => sum + (e.storageUsed || e.storage_used || e.storage || 0), 0)

  const columns = [
    {
      header: 'Email Address',
      accessor: (row) => row.address || row.email,
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4a6cf7]/10 flex items-center justify-center flex-shrink-0">
            <AtSign className="w-4 h-4 text-[#4a6cf7]" />
          </div>
          <span className="font-medium text-[#eeeef0]">{val}</span>
        </div>
      ),
    },
    { header: 'Domain', accessor: 'domain', render: (val) => <span className="text-[#7a7a8e]">{val}</span> },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
    { header: 'Storage', accessor: (row) => row.storageUsed || row.storage_used || row.storage || 0, render: (val) => <span className="text-[#7a7a8e]">{formatBytes(val)}</span> },
    { header: 'Forward To', accessor: (row) => row.forwardTo || row.forward_to || '-', render: (val) => <span className="text-[#7a7a8e]">{val}</span> },
    { header: 'Created', accessor: (row) => row.created_at || row.createdAt, render: (val) => <span className="text-[#7a7a8e]">{formatDate(val)}</span> },
    {
      header: 'Actions',
      accessor: '_id',
      render: (_, row) => {
        const id = row._id || row.id
        const isActive = row.status === 'active'
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleToggle(row) }}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${isActive ? 'text-emerald-400' : 'text-[#4a4a5e]'}`}
              title={isActive ? 'Deactivate' : 'Activate'}
            >
              {isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(row) }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-[#4a6cf7] transition-colors"
              title="Edit Forward"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDelete(id) }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#7a7a8e]">Loading...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#eeeef0]">Email</h1>
          <p className="text-[#7a7a8e] mt-1">Manage your email accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Email
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Accounts" value={emails.length} subtitle="Email accounts" icon={Mail} />
        <StatsCard title="Active" value={active} subtitle="Receiving mail" icon={Inbox} />
        <StatsCard title="Inactive" value={inactive} subtitle="Paused accounts" icon={Mail} />
        <StatsCard title="Storage Used" value={formatBytes(totalStorage)} subtitle="Total mailbox size" icon={Mail} />
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl">
        <DataTable columns={columns} data={emails} emptyMessage="No email accounts yet. Create your first email to get started." />
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Email Account" size="md">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Email Address</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="username"
                required
                className="flex-1 bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
              />
              <div className="flex items-center px-4 bg-[#0a0a12] border border-white/[0.06] rounded-lg text-[#7a7a8e] text-sm">
                @
              </div>
              <input
                type="text"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="vestora.io"
                className="flex-1 bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Email'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Forwarding" size="md">
        <form onSubmit={handleEdit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Forward emails to</label>
            <input
              type="email"
              value={editForm.forwardTo}
              onChange={(e) => setEditForm({ forwardTo: e.target.value })}
              placeholder="forward@example.com"
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
            <p className="text-xs text-[#4a4a5e] mt-2">Leave empty to disable forwarding.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEdit(null)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Email Account" size="sm">
        <p className="text-[#7a7a8e] mb-6">Are you sure you want to delete this email account? All associated data will be permanently removed.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDelete(null)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-red-500/20">
            Delete Account
          </button>
        </div>
      </Modal>
    </div>
  )
}
