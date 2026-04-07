import { useState, useEffect } from 'react'
import { Activity, Server, Mail, Globe, Database, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const SERVICE_ICONS = {
  servers: Server,
  email: Mail,
  cdn: Globe,
  databases: Database,
}

const STATUS_CONFIG = {
  operational: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle, label: 'Operational' },
  degraded: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle, label: 'Degraded' },
  down: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Down' },
}

const SEVERITY_STYLES = {
  low: 'bg-blue-500/10 text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-orange-500/10 text-orange-400',
  critical: 'bg-red-500/10 text-red-400',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0c0c18] border border-white/[0.06] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[#7a7a8e] text-xs mb-1">{label}</p>
      <p className="text-[#eeeef0] text-sm font-medium">{payload[0].value}% uptime</p>
    </div>
  )
}

export default function Monitoring() {
  const [status, setStatus] = useState(null)
  const [uptime, setUptime] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusData, uptimeData, incidentData] = await Promise.allSettled([
          api.get('/api/monitoring/status'),
          api.get('/api/monitoring/uptime'),
          api.get('/api/monitoring/incidents'),
        ])

        if (statusData.status === 'fulfilled') {
          setStatus(statusData.value)
        }
        if (uptimeData.status === 'fulfilled') {
          const ud = uptimeData.value
          setUptime(Array.isArray(ud) ? ud : ud?.points || [])
        }
        if (incidentData.status === 'fulfilled') {
          setIncidents(Array.isArray(incidentData.value) ? incidentData.value : [])
        }
      } catch (err) {
        setError(err.message || 'Failed to load monitoring data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#7a7a8e]">Loading...</div></div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-64"><div className="text-red-400">{error}</div></div>
  }

  const services = status?.services || [
    { name: 'Servers', key: 'servers', status: 'operational', uptime: 99.98 },
    { name: 'Email', key: 'email', status: 'operational', uptime: 99.95 },
    { name: 'CDN', key: 'cdn', status: 'operational', uptime: 99.99 },
    { name: 'Databases', key: 'databases', status: 'operational', uptime: 99.97 },
  ]

  const allOperational = services.every((s) => s.status === 'operational')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#eeeef0]">Monitoring</h1>
        <p className="text-[#7a7a8e] mt-1">System status and uptime monitoring</p>
      </div>

      <div className={`rounded-2xl p-6 border ${allOperational ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
        <div className="flex items-center gap-3">
          {allOperational ? (
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          )}
          <div>
            <h2 className={`text-lg font-semibold ${allOperational ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {allOperational ? 'All Systems Operational' : 'Some Systems Degraded'}
            </h2>
            <p className="text-[#7a7a8e] text-sm mt-0.5">
              Last checked {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => {
          const config = STATUS_CONFIG[service.status] || STATUS_CONFIG.operational
          const ServiceIcon = SERVICE_ICONS[service.key] || SERVICE_ICONS[service.name?.toLowerCase()] || Activity
          const StatusIcon = config.icon
          return (
            <div
              key={service.key || service.name}
              className={`bg-[#0a0a12] border ${config.border} rounded-2xl p-6 transition-colors`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <ServiceIcon className={`w-5 h-5 ${config.color}`} />
                </div>
                <StatusIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <h3 className="text-[#eeeef0] font-medium mb-1">{service.name}</h3>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${config.color}`}>{config.label}</span>
                <span className="text-sm text-[#7a7a8e]">{service.uptime}%</span>
              </div>
              <div className="mt-3 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    service.status === 'operational' ? 'bg-emerald-400' :
                    service.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${service.uptime}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#eeeef0]">Uptime History</h2>
          <p className="text-[#7a7a8e] text-sm mt-0.5">Platform uptime over the past 30 days</p>
        </div>
        {uptime.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={uptime} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a4a5e', fontSize: 12 }}
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                domain={[99, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a4a5e', fontSize: 12 }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-[#4a4a5e]">No uptime data available</div>
        )}
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[#eeeef0] mb-4">Incident History</h2>
        {incidents.length > 0 ? (
          <div className="space-y-1">
            {incidents.map((incident, i) => {
              const severity = incident.severity || 'medium'
              const severityStyle = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium
              return (
                <div
                  key={incident._id || incident.id || i}
                  className="flex items-start gap-4 py-4 border-b border-white/[0.06] last:border-0"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mt-0.5">
                    <Clock className="w-4 h-4 text-[#4a4a5e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm text-[#eeeef0] font-medium">{incident.title || incident.description || incident.message}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${severityStyle}`}>
                        {severity}
                      </span>
                    </div>
                    {incident.description && incident.title && (
                      <p className="text-sm text-[#7a7a8e] mb-1">{incident.description}</p>
                    )}
                    <p className="text-xs text-[#4a4a5e]">
                      {incident.timestamp || incident.created_at || incident.createdAt
                        ? `${formatDate(incident.timestamp || incident.created_at || incident.createdAt)} at ${formatTime(incident.timestamp || incident.created_at || incident.createdAt)}`
                        : ''}
                      {incident.duration ? ` - Duration: ${incident.duration}` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[#4a4a5e]">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No incidents recorded</p>
          </div>
        )}
      </div>
    </div>
  )
}
