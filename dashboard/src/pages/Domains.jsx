import { useState, useEffect, useCallback } from 'react'
import { Globe, Plus, Trash2, Lock, Unlock, ChevronDown, ChevronRight, Shield, Layers } from 'lucide-react'
import api from '../lib/api'
import StatsCard from '../components/StatsCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 text-emerald-400',
  inactive: 'bg-red-500/10 text-red-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  propagating: 'bg-yellow-500/10 text-yellow-400',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-white/5 text-[#7a7a8e]'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}

export default function Domains() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const [showDns, setShowDns] = useState(null)
  const [showAddDns, setShowAddDns] = useState(null)
  const [creating, setCreating] = useState(false)
  const [expandedDomain, setExpandedDomain] = useState(null)
  const [dnsRecords, setDnsRecords] = useState({})
  const [domainName, setDomainName] = useState('')
  const [dnsForm, setDnsForm] = useState({ type: 'A', name: '', value: '', ttl: '3600' })
  const [addingDns, setAddingDns] = useState(false)

  const fetchDomains = useCallback(async () => {
    try {
      const data = await api.get('/api/domains')
      setDomains(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load domains.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDomains() }, [fetchDomains])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!domainName.trim()) return
    setCreating(true)
    try {
      await api.post('/api/domains', { name: domainName })
      setShowCreate(false)
      setDomainName('')
      await fetchDomains()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    try {
      await api.delete(`/api/domains/${showDelete}`)
      setShowDelete(null)
      await fetchDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleExpand = async (domainItem) => {
    const id = domainItem._id || domainItem.id
    if (expandedDomain === id) {
      setExpandedDomain(null)
      return
    }
    setExpandedDomain(id)
    if (!dnsRecords[id]) {
      try {
        const records = domainItem.dnsRecords || domainItem.dns_records || domainItem.records || []
        setDnsRecords((prev) => ({ ...prev, [id]: records }))
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleAddDns = async (e) => {
    e.preventDefault()
    if (!showAddDns || !dnsForm.name.trim() || !dnsForm.value.trim()) return
    setAddingDns(true)
    try {
      await api.post(`/api/domains/${showAddDns}/dns`, {
        type: dnsForm.type,
        name: dnsForm.name,
        value: dnsForm.value,
        ttl: parseInt(dnsForm.ttl, 10),
      })
      setShowAddDns(null)
      setDnsForm({ type: 'A', name: '', value: '', ttl: '3600' })
      setDnsRecords({})
      setExpandedDomain(null)
      await fetchDomains()
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingDns(false)
    }
  }

  const handleDeleteDns = async (domainId, recordId) => {
    try {
      await api.delete(`/api/domains/${domainId}/dns/${recordId}`)
      setDnsRecords((prev) => ({
        ...prev,
        [domainId]: (prev[domainId] || []).filter((r) => (r._id || r.id) !== recordId),
      }))
      await fetchDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const active = domains.filter((d) => d.status === 'active').length
  const sslActive = domains.filter((d) => d.ssl || d.sslActive || d.ssl_active).length
  const totalDns = domains.reduce((sum, d) => sum + (d.dnsRecords?.length || d.dns_records?.length || d.records?.length || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#7a7a8e]">Loading...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#eeeef0]">Domains</h1>
          <p className="text-[#7a7a8e] mt-1">Manage your domain names and DNS</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Domain
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Domains" value={domains.length} subtitle="Registered domains" icon={Globe} />
        <StatsCard title="Active" value={active} subtitle="Live domains" icon={Globe} />
        <StatsCard title="SSL Active" value={sslActive} subtitle="Secured with SSL" icon={Shield} />
        <StatsCard title="DNS Records" value={totalDns} subtitle="Total records" icon={Layers} />
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.06]">
        {domains.length > 0 ? (
          domains.map((domain) => {
            const id = domain._id || domain.id
            const isExpanded = expandedDomain === id
            const records = dnsRecords[id] || domain.dnsRecords || domain.dns_records || domain.records || []
            const hasSsl = domain.ssl || domain.sslActive || domain.ssl_active
            return (
              <div key={id}>
                <div
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => toggleExpand(domain)}
                >
                  <button className="text-[#4a4a5e] hover:text-[#7a7a8e] transition-colors flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-[#4a6cf7]/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-[#4a6cf7]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-[#eeeef0]">{domain.name || domain.domain}</span>
                  </div>
                  <StatusBadge status={domain.status} />
                  <div className="flex items-center gap-1 flex-shrink-0" title={hasSsl ? 'SSL Active' : 'SSL Inactive'}>
                    {hasSsl ? (
                      <Lock className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <span className="text-[#4a4a5e] text-sm hidden sm:block flex-shrink-0">
                    {domain.nameservers ? (Array.isArray(domain.nameservers) ? domain.nameservers.join(', ') : domain.nameservers) : '-'}
                  </span>
                  <span className="text-[#4a4a5e] text-sm flex-shrink-0">
                    {formatDate(domain.created_at || domain.createdAt)}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setShowAddDns(id); setDnsForm({ type: 'A', name: '', value: '', ttl: '3600' }) }}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-[#4a6cf7] transition-colors"
                      title="Add DNS Record"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDelete(id)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-[#7a7a8e] hover:text-red-400 transition-colors"
                      title="Delete Domain"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 pl-16">
                    <div className="bg-[#05050a] rounded-xl border border-white/[0.06] overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <h4 className="text-sm font-medium text-[#7a7a8e]">DNS Records</h4>
                      </div>
                      {records.length > 0 ? (
                        <div className="divide-y divide-white/[0.06]">
                          {records.map((record, i) => {
                            const rid = record._id || record.id || i
                            return (
                              <div key={rid} className="flex items-center gap-4 px-4 py-3 text-sm">
                                <span className="w-16 flex-shrink-0 text-[#4a6cf7] font-mono text-xs font-medium bg-[#4a6cf7]/10 px-2 py-0.5 rounded text-center">
                                  {record.type}
                                </span>
                                <span className="flex-1 text-[#eeeef0] font-mono text-xs truncate">{record.name}</span>
                                <span className="flex-1 text-[#7a7a8e] font-mono text-xs truncate">{record.value}</span>
                                <span className="text-[#4a4a5e] text-xs flex-shrink-0">TTL: {record.ttl || '-'}</span>
                                <button
                                  onClick={() => handleDeleteDns(id, rid)}
                                  className="p-1 rounded hover:bg-white/5 text-[#4a4a5e] hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center text-[#4a4a5e] text-sm">
                          No DNS records configured
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="p-12 text-center">
            <Globe className="w-12 h-12 text-[#4a4a5e] mx-auto mb-4 opacity-50" />
            <p className="text-[#7a7a8e] mb-1">No domains added yet</p>
            <p className="text-[#4a4a5e] text-sm">Add your first domain to get started.</p>
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Domain" size="md">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Domain Name</label>
            <input
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              placeholder="example.com"
              required
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {creating ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showAddDns} onClose={() => setShowAddDns(null)} title="Add DNS Record" size="md">
        <form onSubmit={handleAddDns} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Record Type</label>
            <select
              value={dnsForm.type}
              onChange={(e) => setDnsForm({ ...dnsForm, type: e.target.value })}
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            >
              <option value="A">A</option>
              <option value="AAAA">AAAA</option>
              <option value="CNAME">CNAME</option>
              <option value="MX">MX</option>
              <option value="TXT">TXT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Name</label>
            <input
              type="text"
              value={dnsForm.name}
              onChange={(e) => setDnsForm({ ...dnsForm, name: e.target.value })}
              placeholder="@ or subdomain"
              required
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">Value</label>
            <input
              type="text"
              value={dnsForm.value}
              onChange={(e) => setDnsForm({ ...dnsForm, value: e.target.value })}
              placeholder="IP address or target"
              required
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7a7a8e] mb-2">TTL (seconds)</label>
            <input
              type="number"
              value={dnsForm.ttl}
              onChange={(e) => setDnsForm({ ...dnsForm, ttl: e.target.value })}
              placeholder="3600"
              min="60"
              className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-[#4a4a5e] focus:outline-none focus:border-[#4a6cf7]/50 focus:ring-1 focus:ring-[#4a6cf7]/50 transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddDns(null)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={addingDns} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {addingDns ? 'Adding...' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Domain" size="sm">
        <p className="text-[#7a7a8e] mb-6">Are you sure you want to delete this domain? All DNS records will be permanently removed.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDelete(null)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-red-500/20">
            Delete Domain
          </button>
        </div>
      </Modal>
    </div>
  )
}
