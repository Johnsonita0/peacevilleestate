import { CreditCard, MessageSquareText, ShieldCheck, UsersRound } from 'lucide-react'

const icons = {
  Residents: UsersRound,
  Visitors: UsersRound,
  Payments: CreditCard,
  Incidents: ShieldCheck,
  Messages: MessageSquareText,
}

function WorkspaceEmptyState({ section, description, onBack }) {
  const Icon = icons[section] ?? UsersRound
  return (
    <section className="panel empty-panel">
      <div className="empty-icon"><Icon size={24} /></div>
      <h2>{section} workspace</h2>
      <p>{description}</p>
      <button className="button button-secondary" onClick={onBack}>Back to overview</button>
    </section>
  )
}

export default WorkspaceEmptyState
