import { ArrowUpRight, MoreHorizontal } from 'lucide-react'

const activity = [
  { time: '09:42', title: 'Visitor pass approved', detail: 'Unit C-14 · Approved by A. Okafor', tone: 'green' },
  { time: '09:18', title: 'Incident reported', detail: 'North gate · Security team notified', tone: 'orange' },
  { time: '08:56', title: 'Levy payment received', detail: 'Unit A-06 · ₦25,000', tone: 'blue' },
  { time: '08:30', title: 'New resident registered', detail: 'Unit B-11 · Awaiting review', tone: 'gray' },
]

function ActivityPanel({ onNavigate }) {
  return (
    <article className="panel activity-panel">
      <div className="panel-heading">
        <div><h2>Recent activity</h2><p>Updates from across the estate</p></div>
        <button className="text-button" onClick={() => onNavigate('Incidents')}>View all <ArrowUpRight size={15} /></button>
      </div>
      <div className="activity-list">
        {activity.map((item) => (
          <div className="activity-row" key={`${item.time}-${item.title}`}>
            <span className={`activity-dot dot-${item.tone}`} />
            <span className="activity-time">{item.time}</span>
            <span className="activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
            <button className="row-more" aria-label={`More options for ${item.title}`}><MoreHorizontal size={17} /></button>
          </div>
        ))}
      </div>
    </article>
  )
}

export default ActivityPanel
