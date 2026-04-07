import { useState, useEffect } from 'react'
import { CreditCard, Receipt, TrendingUp, Check, Zap } from 'lucide-react'
import api from '../lib/api'
import StatsCard from '../components/StatsCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
}

const STATUS_STYLES = {
  paid: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  overdue: 'bg-red-500/10 text-red-400',
  failed: 'bg-red-500/10 text-red-400',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-white/5 text-[#7a7a8e]'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    features: ['5 Servers', '10 Email Accounts', '50GB Storage', '5 Domains', 'Basic Support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 149,
    popular: true,
    features: ['20 Servers', '50 Email Accounts', '500GB Storage', '25 Domains', 'Priority Support', 'Custom DNS', 'SSL Certificates'],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 399,
    features: ['Unlimited Servers', 'Unlimited Email', '5TB Storage', 'Unlimited Domains', '24/7 Support', 'Custom DNS', 'SSL Certificates', 'Dedicated IP', 'SLA 99.99%'],
  },
]

export default function Billing() {
  const [plan, setPlan] = useState(null)
  const [usage, setUsage] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planData, usageData, invoiceData] = await Promise.allSettled([
          api.get('/api/billing/plan'),
          api.get('/api/billing/usage'),
          api.get('/api/billing/invoices'),
        ])

        if (planData.status === 'fulfilled') setPlan(planData.value)
        if (usageData.status === 'fulfilled') setUsage(usageData.value)
        if (invoiceData.status === 'fulfilled') setInvoices(Array.isArray(invoiceData.value) ? invoiceData.value : [])
      } catch (err) {
        setError(err.message || 'Failed to load billing data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleChangePlan = async (planId) => {
    setChangingPlan(true)
    try {
      const data = await api.put('/api/billing/plan', { plan: planId })
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setPlan(data?.plan || data)
      setShowUpgrade(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setChangingPlan(false)
    }
  }

  const currentPlanId = plan?.plan || plan?.name?.toLowerCase() || plan?.id || 'starter'
  const currentPlanInfo = PLANS.find((p) => p.id === currentPlanId) || PLANS[0]

  const usageItems = [
    { label: 'Servers', current: usage?.servers || 0, limit: usage?.serversLimit || currentPlanInfo.features.find((f) => f.includes('Server'))?.match(/\d+/)?.[0] || 5 },
    { label: 'Email Accounts', current: usage?.emails || 0, limit: usage?.emailsLimit || 10 },
    { label: 'Storage', current: usage?.storage || 0, limit: usage?.storageLimit || 50, unit: 'GB' },
    { label: 'Domains', current: usage?.domains || 0, limit: usage?.domainsLimit || 5 },
  ]

  const invoiceColumns = [
    { header: 'Invoice #', accessor: (row) => row.number || row.invoice_number || row.invoiceNumber || `INV-${row._id || row.id}`, render: (val) => <span className="font-medium text-[#eeeef0] font-mono text-sm">{val}</span> },
    { header: 'Period', accessor: (row) => row.period || `${formatDate(row.start_date || row.startDate)} - ${formatDate(row.end_date || row.endDate)}`, render: (val) => <span className="text-[#7a7a8e]">{val}</span> },
    { header: 'Amount', accessor: (row) => row.amount || row.total || 0, render: (val) => <span className="text-[#eeeef0] font-medium">{formatCurrency(val)}</span> },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
    { header: 'Date', accessor: (row) => row.date || row.created_at || row.createdAt, render: (val) => <span className="text-[#7a7a8e]">{formatDate(val)}</span> },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#7a7a8e]">Loading...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#eeeef0]">Billing</h1>
          <p className="text-[#7a7a8e] mt-1">Manage your subscription and invoices</p>
        </div>
        <button onClick={() => setShowUpgrade(true)} className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Change Plan
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-[#eeeef0]">Current Plan</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4a6cf7]/10 text-[#4a6cf7] capitalize">
                {currentPlanInfo.name}
              </span>
            </div>
            <p className="text-[#7a7a8e] text-sm">Your subscription renews monthly</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#eeeef0]">{formatCurrency(currentPlanInfo.price)}</p>
            <p className="text-[#4a4a5e] text-sm">per month</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {currentPlanInfo.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-[#7a7a8e]">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[#eeeef0] mb-6">Current Usage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {usageItems.map((item) => {
            const limit = typeof item.limit === 'string' ? parseInt(item.limit, 10) : item.limit
            const pct = limit > 0 ? Math.min((item.current / limit) * 100, 100) : 0
            const isHigh = pct > 80
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#eeeef0]">{item.label}</span>
                  <span className="text-sm text-[#7a7a8e]">
                    {item.current}{item.unit ? ` ${item.unit}` : ''} / {limit}{item.unit ? ` ${item.unit}` : ''}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-yellow-400' : 'bg-[#4a6cf7]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-[#4a4a5e] mt-1">{pct.toFixed(0)}% used</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl">
        <div className="px-6 pt-6 pb-3">
          <h2 className="text-lg font-semibold text-[#eeeef0]">Invoice History</h2>
          <p className="text-[#7a7a8e] text-sm mt-0.5">Your past invoices and payments</p>
        </div>
        <DataTable
          columns={invoiceColumns}
          data={invoices}
          emptyMessage="No invoices yet."
        />
      </div>

      <Modal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} title="Change Plan" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const isCurrent = p.id === currentPlanId
            return (
              <div
                key={p.id}
                className={`relative rounded-xl border p-6 transition-colors ${
                  p.popular
                    ? 'border-[#4a6cf7]/50 bg-[#4a6cf7]/5'
                    : 'border-white/[0.06] bg-[#05050a]'
                } ${isCurrent ? 'ring-2 ring-[#4a6cf7]/30' : ''}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium bg-[#4a6cf7] text-white">
                      <Zap className="w-3 h-3" /> Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-[#eeeef0] mb-1">{p.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#eeeef0]">${p.price}</span>
                  <span className="text-[#4a4a5e] text-sm">/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#7a7a8e]">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleChangePlan(p.id)}
                  disabled={isCurrent || changingPlan}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrent
                      ? 'bg-white/5 text-[#4a4a5e] cursor-not-allowed'
                      : p.popular
                      ? 'bg-[#4a6cf7] hover:bg-[#3a56d4] text-white'
                      : 'border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2]'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : changingPlan ? 'Updating...' : 'Select Plan'}
                </button>
              </div>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
