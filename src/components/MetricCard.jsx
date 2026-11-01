import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from 'lucide-react'

function MetricCard({ label, value, change, trend, index }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight
  return (
    <article className={`metric-card metric-${index}`}>
      <div className="metric-top"><span>{label}</span><button aria-label={`More about ${label}`}><MoreHorizontal size={18} /></button></div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-foot"><span className={`trend trend-${trend}`}><TrendIcon size={14} />{change}</span></div>
    </article>
  )
}

export default MetricCard
