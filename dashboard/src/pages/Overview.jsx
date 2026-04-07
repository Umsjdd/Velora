import { useState, useEffect } from 'react'
import { Server, Mail, HardDrive, Globe, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api'
import StatsCard from '../components/StatsCard'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0c0c18] border border-white/[0.06] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[#7a7a8e] text-xs mb-1">{label}</p>
      <p className="text-[#eeeef0] text-sm font-medium">{payload[0].value.toLocaleString()} requests</p>
    </div>
  )
}

export default function Overview() {
  const [overview, setOverview] = useState(null)
  const [traffic, setTraffic] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, trafficData] = await Promise.all([
          api.get('/api/analytics/overview'),
          api.get('/api/analytics/traffic'),
        ])
        setOverview(overviewData)
        setTraffic(Array.isArray(trafficData) ? trafficData : trafficData?.points || [])
      } catch (err) {
        setError(err.message || 'Failed to load overview data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#7a7a8e]">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  const stats = overview || {}
  const activities = stats.recentActivity || stats.recent_activity || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#eeeef0]">Overview</h1>
        <p className="text-[#7a7a8e] mt-1">Welcome to your Vestora dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Servers"
          value={stats.activeServers ?? stats.active_servers ?? 0}
          subtitle="Compute instances"
          icon={Server}
          trend={stats.serversTrend}
        />
        <StatsCard
          title="Email Accounts"
          value={stats.emailAccounts ?? stats.email_accounts ?? 0}
          subtitle="Mailboxes configured"
          icon={Mail}
          trend={stats.emailsTrend}
        />
        <StatsCard
          title="Storage Used"
          value={formatBytes(stats.storageUsed ?? stats.storage_used ?? 0)}
          subtitle="Across all services"
          icon={HardDrive}
          trend={stats.storageTrend}
        />
        <StatsCard
          title="Active Domains"
          value={stats.activeDomains ?? stats.active_domains ?? 0}
          subtitle="Connected domains"
          icon={Globe}
          trend={stats.domainsTrend}
        />
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#eeeef0]">Traffic Overview</h2>
            <p className="text-[#7a7a8e] text-sm mt-0.5">Requests over the past 30 days</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#7a7a8e]">
            <Activity className="w-4 h-4" />
            <span>Live</span>
          </div>
        </div>
        {traffic.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={traffic} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a6cf7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4a6cf7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a4a5e', fontSize: 12 }}
                tickFormatter={(val) => {
                  const d = new Date(val)
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a4a5e', fontSize: 12 }}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#4a6cf7"
                strokeWidth={2}
                fill="url(#trafficGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-[#4a4a5e]">
            No traffic data available
          </div>
        )}
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[#eeeef0] mb-4">Recent Activity</h2>
        {activities.length > 0 ? (
          <div className="space-y-1">
            {activities.map((item, i) => (
              <div
                key={item.id || i}
                className="flex items-start gap-4 py-3 border-b border-white/[0.06] last:border-0"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#4a6cf7]/10 flex items-center justify-center mt-0.5">
                  <Activity className="w-4 h-4 text-[#4a6cf7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#eeeef0]">{item.description || item.message || item.action}</p>
                  <p className="text-xs text-[#4a4a5e] mt-1">
                    {item.timestamp || item.created_at
                      ? `${formatDate(item.timestamp || item.created_at)} at ${formatTime(item.timestamp || item.created_at)}`
                      : ''}
                  </p>
                </div>
                {item.type === 'increase' || item.change > 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                ) : item.type === 'decrease' || item.change < 0 ? (
                  <ArrowDownRight className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#4a4a5e]">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  )
}
