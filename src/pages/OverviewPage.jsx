import { useEffect, useState } from 'react'
import { AlertTriangle, CreditCard, Megaphone, Shield, UsersRound, UserRoundCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { formatNaira, loadAdminOverview } from '../lib/adminOverview'
import '../css/admin-dashboard.css'

const metricDefinitions = [
  { label: 'Residents', key: 'residents', icon: UsersRound },
  { label: 'Levy collected', key: 'levyPercent', suffix: '%', icon: CreditCard },
  { label: 'Visitors inside', key: 'visitorsInside', icon: Shield },
  { label: 'Open incidents', key: 'openIncidents', icon: AlertTriangle, alert: true },
]

function MetricCard({ label, value, icon: Icon, alert }) {
  return (
    <article className={`admin-stat-card${alert ? ' admin-stat-alert' : ''}`}>
      <span className="admin-stat-icon"><Icon size={24} strokeWidth={1.8} /></span>
      <strong className="admin-stat-value">{value}</strong>
      <span className="admin-stat-label">{label}</span>
    </article>
  )
}

function OverviewPage({ onNavigate }) {
  const { session } = useAuth()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    loadAdminOverview(session?.access_token)
      .then((overview) => { if (active) setData(overview) })
      .catch((error) => {
        console.error('Admin overview could not be loaded:', error)
        if (active) setLoadError(true)
      })
    return () => { active = false }
  }, [session?.access_token])

  const overview = data
  const attentionItems = overview ? [
    { title: 'Verify payments', detail: `${overview.pendingPayments} waiting for review`, count: overview.pendingPayments, icon: CreditCard, section: 'Payments', tone: 'gold' },
    { title: 'Approve registrations', detail: `${overview.pendingRegistrations} new residents`, count: overview.pendingRegistrations, icon: UsersRound, section: 'Residents', tone: 'gold' },
    { title: 'Open incidents', detail: `${overview.openIncidents} need action`, count: overview.openIncidents, icon: AlertTriangle, section: 'Security', tone: 'red' },
    ...(overview.expiringAd ? [{ title: 'Ad ending soon', detail: `${overview.expiringAd} · ${overview.expiringDays} days`, icon: Megaphone, section: 'Ads', tone: 'neutral' }] : []),
  ] : []

  const today = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())

  return (
    <main className="admin-overview">
      <header className="admin-overview-heading">
        <h1>Estate overview</h1>
        <time className="admin-overview-date">{today}</time>
      </header>
      {loadError && <p className="admin-empty-state" role="alert">Estate data could not be loaded. Check the connection and try again.</p>}

      <section className="admin-stats-grid" aria-label="Estate overview metrics">
        {metricDefinitions.map(({ label, key, suffix = '', icon, alert }) => (
          <MetricCard key={key} label={label} value={overview ? `${overview[key]}${suffix}` : '—'} icon={icon} alert={alert} />
        ))}
      </section>

      {overview && (
        <>
          <section className="admin-panel admin-levy-panel" aria-labelledby="levy-collection-title">
            <div className="admin-panel-heading"><h2 id="levy-collection-title">Levy collection</h2><span className="admin-panel-meta">2026</span></div>
            <div className="admin-levy-amount-row"><strong className="admin-levy-collected">{formatNaira(overview.collected)}</strong><span className="admin-levy-total">of {formatNaira(overview.expected)}</span></div>
            <div className="admin-progress-track" role="progressbar" aria-label="Levy collection" aria-valuemin="0" aria-valuemax="100" aria-valuenow={overview.levyPercent}><span className="admin-progress-fill" style={{ width: `${overview.levyPercent}%` }} /></div>
            <p className="admin-levy-outstanding">{formatNaira(Math.max(0, overview.expected - overview.collected))} outstanding</p>
          </section>

          <section className="admin-overview-columns">
            <div className="admin-overview-main">
              <section aria-labelledby="attention-title">
                <h2 className="admin-section-title" id="attention-title">Needs your attention</h2>
                <div className="admin-attention-list">
                  {attentionItems.map(({ title, detail, count, icon: Icon, section, tone }) => (
                    <button className="admin-attention-item" key={title} type="button" onClick={() => onNavigate(section)}>
                      <span className="admin-attention-icon"><Icon size={21} strokeWidth={1.8} /></span>
                      <span className="admin-attention-copy"><strong>{title}</strong><small>{detail}</small></span>
                      {count !== undefined && <span className={`admin-count-pill${tone === 'red' ? ' admin-count-danger' : ''}`}>{count}</span>}
                      {count === undefined && <span className="admin-attention-arrow">›</span>}
                    </button>
                  ))}
                </div>
              </section>

              <section className="admin-panel admin-ads-panel">
                <div className="admin-panel-heading"><h2>Estate ads</h2><span className="admin-count-pill">{overview.activeAds} live</span></div>
                <p className="admin-ads-description">{overview.scheduledAds} scheduled · {overview.expiringAd ? `1 ends soon` : 'Manage partner promotions'}</p>
                <div className="admin-ad-actions">
                  <button className="admin-primary-button" type="button" onClick={() => onNavigate('Ads')}>Create ad</button>
                  <button className="admin-secondary-button" type="button" onClick={() => onNavigate('Ads')}>Manage</button>
                </div>
              </section>

              <section className="admin-panel admin-activity-panel">
                <div className="admin-panel-heading"><h2>Recent activity</h2><button className="admin-attention-action" type="button" onClick={() => onNavigate('Incidents')}>View all</button></div>
                {overview.activity.length ? (
                  <div className="admin-activity-list">{overview.activity.map((item, index) => <div className="admin-activity-row" key={`${item.label}-${index}`}><span className="admin-activity-dot" /><span>{item.label} · {item.when}</span></div>)}</div>
                ) : <p className="admin-empty-state">No recent activity.</p>}
              </section>
            </div>

            <aside className="admin-overview-aside">
              <section className="admin-panel admin-compound-panel">
                <div className="admin-panel-heading"><h2>Compound levy status</h2></div>
                <div className="admin-compound-list">
                  {overview.compounds.map((compound) => (
                    <div className="admin-compound-row" key={compound.name}>
                      <div className="admin-compound-head"><span>{compound.name} · {compound.label}</span><span>{compound.percent}%</span></div>
                      <div className="admin-compound-track"><span className={`admin-compound-fill${compound.percent === 100 ? ' complete' : ''}`} style={{ width: `${compound.percent}%` }} /></div>
                    </div>
                  ))}
                  {!overview.compounds.length && <p className="admin-empty-state">No compound payment records yet.</p>}
                </div>
              </section>

              <section className="admin-panel admin-notice-panel">
                <div className="admin-panel-heading"><h2>Estate notice</h2><button className="admin-attention-action" type="button" onClick={() => onNavigate('Messages')}>Manage</button></div>
                <p>{overview.announcement}</p>
              </section>
            </aside>
          </section>
        </>
      )}
    </main>
  )
}

export default OverviewPage
