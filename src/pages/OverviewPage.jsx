import ActivityPanel from '../components/ActivityPanel'
import MetricCard from '../components/MetricCard'
import PageHeading from '../components/PageHeading'
import QuickActions from '../components/QuickActions'

const metrics = [
  { label: 'Registered residents', value: '248', change: '+12 this month', trend: 'up' },
  { label: 'Visitors today', value: '18', change: '6 awaiting arrival', trend: 'down' },
  { label: 'Open incidents', value: '02', change: '1 needs attention', trend: 'down' },
  { label: 'Levy collection', value: '78%', change: 'For the current period', trend: 'up' },
]

function OverviewPage({ onNavigate }) {
  return (
    <>
      <PageHeading
        title="Good morning, Amara"
        description="A clear view of what is happening across Peaceville today."
        actionLabel="Register visitor"
        onAction={() => onNavigate('Visitors')}
      />
      <section className="metrics-grid" aria-label="Estate metrics">
        {metrics.map((metric, index) => <MetricCard key={metric.label} {...metric} index={index + 1} />)}
      </section>
      <section className="dashboard-grid">
        <ActivityPanel onNavigate={onNavigate} />
        <QuickActions onNavigate={onNavigate} />
      </section>
      <p className="preview-note">Illustrative preview only. Live records will appear after the API and Supabase environment are connected.</p>
    </>
  )
}

export default OverviewPage
