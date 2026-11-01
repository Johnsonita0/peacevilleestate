import { Bell, ChevronDown, Search, ShieldCheck } from 'lucide-react'
import ApiConnectionStatus from './ApiConnectionStatus'

function Topbar({ activeSection }) {
  return (
    <header className="topbar">
      <div className="mobile-brand"><span className="brand-mark"><ShieldCheck size={19} /></span><strong>Peaceville</strong></div>
      <div className="breadcrumb"><span>Peaceville Estate</span><span className="breadcrumb-divider">/</span><strong>{activeSection}</strong></div>
      <div className="topbar-actions">
        <ApiConnectionStatus />
        <label className="search-box">
          <Search size={16} />
          <input aria-label="Search" placeholder="Search anything" />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
        <button className="topbar-profile" aria-label="Account menu"><span className="account-avatar">AO</span><ChevronDown size={14} /></button>
      </div>
    </header>
  )
}

export default Topbar
