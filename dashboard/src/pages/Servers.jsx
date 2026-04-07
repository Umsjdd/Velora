import { useState, useEffect, useCallback } from 'react'
import { Server, Play, Square, RotateCw, Trash2, Plus, Cpu } from 'lucide-react'
import api from '../lib/api'
import StatsCard from '../components/StatsCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLES = {
  running: 'bg-emerald-500/10 text-emerald-400',
  active: 'bg-emerald-500/10 text-emerald-400',
  stopped: 'bg-red-500/10 text-red-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  provisioning: 'bg-yellow-500/10 text-yellow-400',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-white/5 text-[#7a7a8e]'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}

export default function Servers() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const [creating, setCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [form, setForm] = useState({ name: '', region: 'us-east-1', type: 'basic' })

  const regions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU West (Ireland)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  ]

  const types = [
    { value: 'basic', label: 'Basic (1 vCPU, 1GB RAM)' },
    { value: 'standard', label: 'Standard (2 vCPU, 4GB RAM)' },
    { value: 'performance', label: 'Performance (4 vCPU, 8GB RAM)' },
    { value: 'enterprise', label: 'Enterprise (8 vCPU, 32GB RAM)' },
  ]

  const fetchServers = useCallback(async () => {
    try {
      const data = await api.get('/api/servers')
      setServers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load servers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await api.post('/api/servers', form)
      setShowCreate(false)
      setForm({ name: '', region: 'us-east-1', type: 'basic' })
      await fetchServers()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleAction = async (id, action) => {
    setActionLoading(id)
    try {
      await api.post(`/api/servers/${id}/action`, { action })
      await fetchServers()
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
      await api.delete(`/api/servers/${showDelete}`)
      setShowDelete(null)
      await fetchServers()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const running = servers.filter((s) => s.status === 'running' || s.status === 'active').length
  const stopped = servers.filter((s) => s.status === 'stopped').length
  const totalCores = servers.reduce((sum, s) => sum + (s.cpu || s.cores || 0), 0)

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (val) => <span className="font-medium text-[#eeeef0]">{val}</span>,
    },
    {
      header: 'Region',
      accessor: 'region',
      render: (val) => <span className="text-[#7a7a8e]">{val}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'IP Address',
      accessor: (row) => row.ip || row.ipAddress || row.ip_address || '-',
      render: (val) => (
        <code className="text-[#7a7a8e] text-xs bg-white/5 px-2 py-0.5 rounded">{val}</code>
      ),
    },
    {
      header: 'CPU / RAM',
      accessor: (row) => `${row.cpu || row.cores || '-'} vCPU / ${row.ram || row.memory || '-'}`,
      render: (val) => <span className="text-[#7a7a8e]">{val}</span>,
    },
    {
      header: 'Created',
      accessor: (row) => row.created_at || row.createdAt,
      render: (val) => <span className="text-[#7a7a8e]">{formatDate(val)}</span>,
    },
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(id, 'stop')
                }}
                disabled={isLoading}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-yellow-400 transition-colors disabled:opacity-50"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(id, 'start')
                }}
                disabled={isLoading}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-emerald-400 transition-colors disabled:opacity-50"
                title="Start"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleAction(id, 'restart')
              }}
              disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-[#4a6cf7] transition-colors disabled:opacity-50"
              title="Restart"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDelete(id)
              }}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#7a7a8e]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#eeeef0]">Servers</h1>
          <p className="text-[#7a7a8e] mt-1">Manage your compute instances</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Server
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Servers" value={servers.length} subtitle="Compute instances" icon={Server} />
        <StatsCard title="Running" value={running} subtitle="Active instances" icon={Play} />
        <StatsCard title="Stopped" value={stopped} subtitle="Inactive instances" icon={Square} />
        <StatsCard title="Total CPU Cores" value={totalCores} subtitle="Combined vCPUs" icon={Cpu} />
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl">
        <DataTable
          columns={columns}
          data={servers}
          emptyMessage="No servers yet. Create your first server to get started."
        />
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Server" size="md">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Server Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="my-server"
              required
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            >
              {regions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Server Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Server" size="sm">
        <p className="text-[#7a7a8e] mb-6">
          Are you sure you want to delete this server? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDelete(null)}
            className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!!actionLoading}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-red-500/20 disabled:opacity-50"
          >
            {actionLoading ? 'Deleting...' : 'Delete Server'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
