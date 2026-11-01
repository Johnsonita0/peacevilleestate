import { ArrowUpRight, ClipboardList, UserRoundPlus, Users } from 'lucide-react'

function QuickActions({ onNavigate }) {
  return (
    <article className="panel actions-panel">
      <div className="panel-heading"><div><h2>Quick actions</h2><p>Common estate tasks</p></div></div>
      <div className="quick-actions">
        <button onClick={() => onNavigate('Residents')}><span className="action-icon action-green"><Users size={18} /></span><span><strong>Add resident</strong><small>Create a household record</small></span><ArrowUpRight size={16} /></button>
        <button onClick={() => onNavigate('Visitors')}><span className="action-icon action-orange"><UserRoundPlus size={18} /></span><span><strong>Register visitor</strong><small>Prepare a visitor pass</small></span><ArrowUpRight size={16} /></button>
        <button onClick={() => onNavigate('Messages')}><span className="action-icon action-blue"><ClipboardList size={18} /></span><span><strong>Post announcement</strong><small>Share an estate update</small></span><ArrowUpRight size={16} /></button>
      </div>
      <div className="support-note"><span className="support-mark">?</span><span><strong>Need a hand?</strong><small>Contact the platform team</small></span><ArrowUpRight size={15} /></div>
    </article>
  )
}

export default QuickActions
