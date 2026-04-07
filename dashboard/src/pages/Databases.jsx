import { useState, useEffect, useCallback } from 'react'
import { Database, Plus, Play, Square, Trash2, ChevronDown, ChevronRight, HardDrive, MapPin, Copy, Check } from 'lucide-react'
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
  running: 'bg-emerald-500/10 text-emerald-400',
  active: 'bg-emerald-500/10 text-emerald-400',
  stopped: 'bg-red-500/10 text-red-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  provisioning: 'bg-yellow-500/10 text-yellow-400',
}

const DB_TYPE_COLORS = {
  postgresql: 'text-blue-400 bg-blue-500/10',
  mysql: 'text-orange-400 bg-orange-500/10',
  redis: 'text-red-400 bg-red-500/10',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-white/5 text-[#7a7a8e]'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-white/5 text-[#4a4a5e] hover:text-[#7a7a8e] transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function Databases() {
  const [databases, setDatabases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const [creating, setCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [expandedDb, setExpandedDb] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'postgresql', region: 'us-east-1' })

  const regions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU West (Ireland)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  ]

  const dbTypes = [
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'redis', label: 'Redis' },
  ]

  const fetchDatabases = useCallback(async () => {
    try {
      const data = await api.get('/api/databases')
      setDatabases(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load databases.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDatabases() }, [fetchDatabases])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await api.post('/api/databases', form)
      setShowCreate(false)
      setForm({ name: '', type: 'postgresql', region: 'us-east-1' })
      await fetchDatabases()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleAction = async (id, action) => {
    setActionLoading(id)
    try {
      await api.put(`/api/databases/${id}`, { action })
      await fetchDatabases()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    setActionLoading(showDelete)
    try {
      await api.delete(`/api/databases/${showDelete}`)
      setShowDelete(null)
      await fetchDatabases()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const running = databases.filter((d) => d.status === 'running' || d.status === 'active').length
  const totalStorage = databases.reduce((sum, d) => sum + (d.size || d.storageUsed || d.storage_used || 0), 0)
  const uniqueRegions = new Set(databases.map((d) => d.region)).size

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (val, row) => {
        const id = row._id || row.id
        const isExpanded = expandedDb === id
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setExpandedDb(isExpanded ? null : id) }}
              className="text-[#4a4a5e] hover:text-[#7a7a8e] transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <span className="font-medium text-[#eeeef0]">{val}</span>
          </div>
        )
      },
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (val) => {
        const color = DB_TYPE_COLORS[val] || 'text-[#7a7a8e] bg-white/5'
        const label = val === 'postgresql' ? 'PostgreSQL' : val === 'mysql' ? 'MySQL' : val === 'redis' ? 'Redis' : val
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
      },
    },
    { header: 'Region', accessor: 'region', render: (val) => <span className="text-[#7a7a8e]">{val}</span> },
    { header: 'Size', accessor: (row) => row.size || row.storageUsed || row.storage_used || 0, render: (val) => <span className="text-[#7a7a8e]">{formatBytes(val)}</span> },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
    { header: 'Created', accessor: (row) => row.created_at || row.createdAt, render: (val) => <span className="text-[#7a7a8e]">{formatDate(val)}</span> },
    {
      header: 'Actions',
      accessor: '_id',
      render: (_, row) => {
        const id = row._id || row.id
        const isRunning = row.status === 'running' || row.status === 'active'
        const isLoading = actionLoading === id
        return (
          <div className="flex items-center gap-1">
            {isRunning ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleAction(id, 'stop') }}
                disabled={isLoading}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-yellow-400 transition-colors disabled:opacity-50"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handleAction(id, 'start') }}
                disabled={isLoading}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-emerald-400 transition-colors disabled:opacity-50"
                title="Start"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDelete(id) }}
              disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-red-400 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
    },
  ]

  const renderExpandedRow = (row) => {
    const id = row._id || row.id
    if (expandedDb !== id) return null
    const conn = row.connection || row.connectionDetails || row.connection_details || {}
    return (
      <tr key={`${id}-details`}>
        <td colSpan={7} className="px-6 pb-4">
          <div className="bg-[#05050a] rounded-xl border border-white/[0.06] p-4">
            <h4 className="text-sm font-medium text-[#7a7a8e] mb-3">Connection Details</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Host', value: conn.host || `${row.name || 'db'}.vestora.io` },
                { label: 'Port', value: conn.port || (row.type === 'postgresql' ? '5432' : row.type === 'mysql' ? '3306' : '6379') },
                { label: 'Database', value: conn.dbName || conn.database || row.name || 'default' },
                { label: 'Username', value: conn.username || conn.user || 'admin' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-[#4a4a5e] mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-[#eeeef0] bg-white/5 px-2 py-1 rounded font-mono truncate flex-1">{value}</code>
                    <CopyButton text={value} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#7a7a8e]">Loading...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#eeeef0]">Databases</h1>
          <p className="text-[#7a7a8e] mt-1">Manage your database instances</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Database
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Databases" value={databases.length} subtitle="Database instances" icon={Database} />
        <StatsCard title="Running" value={running} subtitle="Active instances" icon={Play} />
        <StatsCard title="Storage Used" value={formatBytes(totalStorage)} subtitle="Total size" icon={HardDrive} />
        <StatsCard title="Regions" value={uniqueRegions} subtitle="Deployment regions" icon={MapPin} />
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl">
        <DataTable
          columns={columns}
          data={databases}
          renderExpandedRow={renderExpandedRow}
          emptyMessage="No databases yet. Create your first database to get started."
        />
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Database" size="md">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Database Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="my-database"
              required
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Database Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            >
              {dbTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            >
              {regions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Database'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Database" size="sm">
        <p className="text-[#7a7a8e] mb-6">Are you sure you want to delete this database? All data will be permanently lost.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDelete(null)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={!!actionLoading} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-red-500/20 disabled:opacity-50">
            {actionLoading ? 'Deleting...' : 'Delete Database'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
