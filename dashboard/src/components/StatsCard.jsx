export default function StatsCard({ title, value, subtitle, icon: Icon, trend, className = '' }) {
  const isPositive = trend && !trend.startsWith('-')
  const isNegative = trend && trend.startsWith('-')

  // Support icon as either a component reference (function or forwardRef) or a rendered element
  const isComponent = Icon && (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof))

  return (
    <div
      className={`bg-[#0c0c18] border border-white/[0.06] rounded-xl p-5 transition-colors hover:border-white/[0.12] ${className}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[#4a6cf7]/10 flex items-center justify-center text-[#4a6cf7]">
            {isComponent ? <Icon size={20} strokeWidth={1.8} /> : Icon}
          </div>
        )}
        {trend && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : isNegative
                ? 'bg-red-500/10 text-red-400'
                : 'bg-white/[0.06] text-[#7a7a8e]'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-[#eeeef0] tracking-tight">
        {value}
      </div>

      {/* Title */}
      <div className="text-sm text-[#7a7a8e] mt-1">{title}</div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-xs text-[#4a4a5e] mt-1">{subtitle}</div>
      )}
    </div>
  )
}
