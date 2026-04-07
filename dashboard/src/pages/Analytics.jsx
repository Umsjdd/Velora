import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Clock, AlertTriangle, Wifi } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../lib/api'
import StatsCard from '../components/StatsCard'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0c0c18] border border-white/[0.06] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[#7a7a8e] text-xs mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

const topPages = [
  { path: '/', views: 12847, unique: 8932, bounceRate: '32%' },
  { path: '/about', views: 5621, unique: 4102, bounceRate: '45%' },
  { path: '/products', views: 8234, unique: 6018, bounceRate: '28%' },
  { path: '/contact', views: 3156, unique: 2341, bounceRate: '52%' },
  { path: '/blog', views: 6789, unique: 4567, bounceRate: '38%' },
]

const emailStats = [
  { label: 'Sent', value: 15420, pct: 100, color: 'bg-[#4a6cf7]' },
  { label: 'Delivered', value: 14896, pct: 96.6, color: 'bg-emerald-400' },
  { label: 'Opened', value: 8247, pct: 55.4, color: 'bg-yellow-400' },
  { label: 'Clicked', value: 3102, pct: 20.8, color: 'bg-purple-400' },
]

export default function Analytics() {
  const [traffic, setTraffic] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trafficData, overviewData] = await Promise.all([
          api.get('/api/analytics/traffic'),
          api.get('/api/analytics/overview'),
        ])
        setTraffic(Array.isArray(trafficData) ? trafficData : trafficData?.points || [])
        setOverview(overviewData)
      } catch (err) {
        setError(err.message || 'Failed to load analytics data.')
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

  const totalRequests = traffic.reduce((sum, t) => sum + (t.requests || t.value || 0), 0)
  const avgResponseTime = overview?.avgResponseTime || overview?.avg_response_time || '142ms'
  const bandwidth = overview?.bandwidth || overview?.bandwidthUsed || overview?.bandwidth_used || 0
  const errorRate = overview?.errorRate || overview?.error_rate || '0.8%'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#eeeef0]">Analytics</h1>
        <p className="text-[#7a7a8e] mt-1">Traffic insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Requests" value={totalRequests.toLocaleString()} subtitle="Last 30 days" icon={TrendingUp} />
        <StatsCard title="Avg Response Time" value={typeof avgResponseTime === 'number' ? `${avgResponseTime}ms` : avgResponseTime} subtitle="Server latency" icon={Clock} />
        <StatsCard title="Bandwidth Used" value={typeof bandwidth === 'number' ? formatBytes(bandwidth) : bandwidth} subtitle="Data transferred" icon={Wifi} />
        <StatsCard title="Error Rate" value={typeof errorRate === 'number' ? `${errorRate}%` : errorRate} subtitle="Failed requests" icon={AlertTriangle} />
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#eeeef0]">Traffic Over Time</h2>
          <p className="text-[#7a7a8e] text-sm mt-0.5">Requests per day over the past 30 days</p>
        </div>
        {traffic.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={traffic} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a6cf7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4a6cf7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a4a5e', fontSize: 12 }}
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                fill="url(#analyticsGradient)"
                name="Requests"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-[#4a4a5e]">No traffic data available</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#eeeef0]">Top Pages</h2>
            <p className="text-[#7a7a8e] text-sm mt-0.5">Most visited pages</p>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-4 px-3 py-2 text-xs font-medium text-[#4a4a5e] uppercase tracking-wider">
              <span>Path</span>
              <span className="text-right">Views</span>
              <span className="text-right">Unique</span>
              <span className="text-right">Bounce</span>
            </div>
            {topPages.map((page) => (
              <div key={page.path} className="grid grid-cols-4 gap-4 px-3 py-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <code className="text-sm text-[#eeeef0] font-mono">{page.path}</code>
                <span className="text-sm text-[#7a7a8e] text-right">{page.views.toLocaleString()}</span>
                <span className="text-sm text-[#7a7a8e] text-right">{page.unique.toLocaleString()}</span>
                <span className="text-sm text-[#7a7a8e] text-right">{page.bounceRate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#eeeef0]">Email Delivery</h2>
            <p className="text-[#7a7a8e] text-sm mt-0.5">Email campaign performance</p>
          </div>
          <div className="space-y-5">
            {emailStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#eeeef0]">{stat.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#7a7a8e]">{stat.value.toLocaleString()}</span>
                    <span className="text-xs text-[#4a4a5e] w-12 text-right">{stat.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stat.color} transition-all duration-500`}
                    style={{ width: `${stat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-[#7a7a8e] mb-4">Delivery by Day</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[
                  { day: 'Mon', sent: 2200 }, { day: 'Tue', sent: 2800 },
                  { day: 'Wed', sent: 2500 }, { day: 'Thu', sent: 3100 },
                  { day: 'Fri', sent: 2700 }, { day: 'Sat', sent: 1200 },
                  { day: 'Sun', sent: 920 },
                ]}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#4a4a5e', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4a4a5e', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sent" fill="#4a6cf7" radius={[4, 4, 0, 0]} name="Sent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
