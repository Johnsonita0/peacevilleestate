import { CalendarDays, Plus } from 'lucide-react'

function PageHeading({ title, description, actionLabel, onAction }) {
  const formattedDate = new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="page-heading">
      <div>
        <div className="date-line"><CalendarDays size={14} />{formattedDate}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">
        <span className="preview-badge"><span />Preview data</span>
        {actionLabel && <button className="button button-primary" onClick={onAction}><Plus size={17} />{actionLabel}</button>}
      </div>
    </div>
  )
}

export default PageHeading
