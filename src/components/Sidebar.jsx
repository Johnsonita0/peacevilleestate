import {
  Building2,
  CircleHelp,
  ChevronDown,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  ShieldCheck,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react'
import ProfilePhotoUpload from './ProfilePhotoUpload'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Residents', icon: UsersRound },
  { label: 'Visitors', icon: UserRoundPlus },
  { label: 'Payments', icon: CreditCard },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Messages', icon: MessageSquareText },
  { label: 'Ads', icon: Megaphone },
  { label: 'Compounds and units', icon: Building2 },
  { label: 'Staff and roles', icon: UsersRound },
  { label: 'Reports', icon: ClipboardList },
  { label: 'More', icon: CircleHelp },
]

function Sidebar({ activeSection, onNavigate, onSignOut }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={() => onNavigate('Overview')}>
        <span className="brand-mark"><ShieldCheck size={21} strokeWidth={2.2} /></span>
        <span className="brand-copy"><strong>Peaceville</strong><small>ESTATE PORTAL</small></span>
      </a>
      <div className="estate-switcher">
        <span className="estate-avatar">P</span>
        <span className="estate-name"><strong>Peaceville Estate</strong><small>Estate administration</small></span>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
      <p className="nav-caption">WORKSPACE</p>
      <nav className="primary-nav" aria-label="Main navigation">
        {navigation.map(({ label, icon: Icon }) => (
          <button
            className={`nav-item${activeSection === label ? ' active' : ''}`}
            key={label}
            onClick={() => onNavigate(label)}
            aria-current={activeSection === label ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {label === 'Security' && <span className="nav-count">2</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item"><CircleHelp size={18} strokeWidth={1.8} /><span>Help centre</span></button>
        <button className="nav-item" onClick={onSignOut}><LogOut size={18} strokeWidth={1.8} /><span>Sign out</span></button>
        <div className="sidebar-rule" />
        <ProfilePhotoUpload />
      </div>
    </aside>
  )
}

export default Sidebar
