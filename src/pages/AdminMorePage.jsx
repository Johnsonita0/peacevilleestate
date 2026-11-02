import { Building2, CalendarDays, ClipboardList, CreditCard, Megaphone, MessageSquareText, Settings, Shield, UserRound, UserRoundPlus, UsersRound } from 'lucide-react'
import '../css/admin-dashboard.css'
import '../css/admin-workspace.css'

const moreDestinations = [
  { label: 'Visitors', detail: 'Visitor requests and gate activity', icon: UserRoundPlus },
  { label: 'Messages', detail: 'Estate and compound communications', icon: MessageSquareText },
  { label: 'Estate ads', detail: 'Partner promotions and campaigns', icon: Megaphone, section: 'Ads' },
  { label: 'Levies and fees', detail: 'Set amounts and due dates', icon: CreditCard },
  { label: 'Announcements', detail: 'Notices to residents', icon: MessageSquareText },
  { label: 'Meetings', detail: 'Schedule and attendance', icon: CalendarDays },
  { label: 'Compounds and units', detail: 'Blocks, houses, occupancy', icon: Building2 },
  { label: 'Staff and roles', detail: 'Admins, reps and guards', icon: UsersRound },
  { label: 'Businesses and institutions', detail: 'Schools, churches, shops and companies', icon: Building2 },
  { label: 'Commercial levy rates', detail: 'Rate per entity type and overrides', icon: CreditCard },
  { label: 'Reports', detail: 'Payments, visitors, incidents', icon: ClipboardList },
  { label: 'Audit log', detail: 'Who did what, and when', icon: Shield },
  { label: 'Settings', detail: 'Estate profile and security', icon: Settings },
  { label: 'Profile', detail: 'Administrator account and photo', icon: UserRound },
]

function AdminMorePage({ onNavigate }) {
  return (
    <section className="admin-workspace">
      <div className="admin-workspace-heading">
        <div><h1>More</h1><p>Additional estate tools</p></div>
      </div>
      <div className="admin-more-list">
        {moreDestinations.map(({ label, detail, icon: Icon, section = label }) => (
          <button className="admin-more-item" key={label} type="button" onClick={() => onNavigate(section)}>
            <span className="admin-attention-icon"><Icon size={20} /></span>
            <span className="admin-attention-copy"><strong>{label}</strong><small>{detail}</small></span>
            <span className="admin-more-arrow" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default AdminMorePage
