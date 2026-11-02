import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  FileText,
  House,
  LogOut,
  MessageCircle,
  Plus,
  Send,
  ShieldAlert,
  TicketCheck,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import ProfilePhotoUpload from '../components/ProfilePhotoUpload'
import '../css/resident-dashboard.css'

const navigation = [
  { label: 'Overview', icon: House },
  { label: 'Payments', icon: Wallet },
  { label: 'Visitors', icon: TicketCheck },
  { label: 'Security', icon: ShieldAlert },
  { label: 'More', icon: Building2 },
]

function relation(value) {
  return Array.isArray(value) ? value[0] : value
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return 'Date not set'
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function futureLocalDateTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function RoleDashboardPage() {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [units, setUnits] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [levies, setLevies] = useState([])
  const [payments, setPayments] = useState([])
  const [visitors, setVisitors] = useState([])
  const [incidents, setIncidents] = useState([])
  const [meetings, setMeetings] = useState([])
  const [chatRooms, setChatRooms] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState('')
  const [passDetails, setPassDetails] = useState(null)
  const [visitorForm, setVisitorForm] = useState({ visitor_name: '', visitor_phone: '', purpose: '', expected_at: futureLocalDateTime(), unit_id: '' })
  const [incidentForm, setIncidentForm] = useState({ incident_type: 'Safety concern', description: '' })
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'Resident'

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let active = true
    const reference = searchParams.get('reference')
    if (!reference || !session?.access_token) return undefined
    setActiveTab('Payments')
    api.get(`/resident/payments/verify/${encodeURIComponent(reference)}`, { accessToken: session.access_token })
      .then(({ data }) => {
        if (active) setToast(data.status === 'successful' ? 'Payment confirmed.' : 'Payment is still processing. Check your payment history shortly.')
      })
      .catch((error) => {
        console.error('Payment return verification failed:', error)
        if (active) setToast('We could not confirm that payment yet. Please check your payment history shortly.')
      })
      .finally(() => { if (active) setSearchParams({}, { replace: true }) })
    return () => { active = false }
  }, [searchParams, session?.access_token, setSearchParams])

  useEffect(() => {
    let active = true

    async function loadResidentData() {
      if (!profile?.id || !session?.access_token) {
        setToast('Your estate account could not be verified. Please sign in again.')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await api.get('/resident/dashboard', { accessToken: session.access_token })
        if (!active) return

        setUnits(data.units ?? [])
        setAnnouncements(data.announcements ?? [])
        setLevies(data.levies ?? [])
        setPayments(data.payments ?? [])
        setVisitors(data.visitors ?? [])
        setIncidents(data.incidents ?? [])
        setMeetings(data.meetings ?? [])
      } catch (error) {
        console.error('Resident dashboard load failed:', error)
        if (active) setToast('We could not load your latest information. Please refresh and try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadResidentData()
    return () => { active = false }
  }, [profile?.id, session?.access_token])

  useEffect(() => {
    let active = true
    async function loadChat() {
      if (activeTab !== 'Chat' || !session?.access_token) return
      let rooms
      try {
        ({ data: rooms } = await api.get('/resident/chat/rooms', { accessToken: session.access_token }))
      } catch (roomError) {
        console.error('Compound chat rooms could not be loaded:', roomError)
        setToast('We could not load the compound chat. Please try again.')
        return
      }
      if (!active) return
      setChatRooms(rooms ?? [])
      const roomId = selectedRoom || rooms?.[0]?.id || ''
      setSelectedRoom(roomId)
      if (!roomId) return
      try {
        const { data: roomMessages } = await api.get(`/resident/chat/rooms/${roomId}/messages`, { accessToken: session.access_token })
        if (active) setMessages(roomMessages ?? [])
      } catch (messageError) {
        console.error('Compound chat messages could not be loaded:', messageError)
        setToast('We could not load messages. Please try again.')
      }
    }
    void loadChat()
    return () => { active = false }
  }, [activeTab, selectedRoom, session?.access_token])

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Resident sign-out failed:', error)
      setToast('We could not sign you out. Please try again.')
    }
  }

  function openVisitorForm() {
    setPassDetails(null)
    setVisitorForm({ visitor_name: '', visitor_phone: '', purpose: '', expected_at: futureLocalDateTime(), unit_id: units[0]?.id ?? '' })
    setModal('visitor')
  }

  async function handleInviteVisitor(event) {
    event.preventDefault()
    if (!session?.access_token) {
      setToast('Please sign in again before inviting a visitor.')
      return
    }
    setBusy(true)
    try {
      const result = await api.post('/visitors', {
        ...visitorForm,
        unit_id: visitorForm.unit_id || units[0]?.id,
        expected_at: new Date(visitorForm.expected_at).toISOString(),
      }, { accessToken: session.access_token })
      const pass = { code: result.pass_code, expiresAt: result.expires_at, visitorName: visitorForm.visitor_name.trim() }
      setPassDetails(pass)
      setVisitors((current) => [{
        id: result.visitor_id,
        visitor_name: pass.visitorName,
        visitor_phone: visitorForm.visitor_phone,
        purpose: visitorForm.purpose,
        expected_at: visitorForm.expected_at,
        status: 'pending',
      }, ...current])
      setModal('')
      setActiveTab('Visitors')
      setToast('Visitor pass created. Save the code now; it cannot be shown again.')
    } catch (error) {
      console.error('Visitor invitation failed:', error)
      setToast('We could not create this visitor pass. Please check the details and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReportIncident(event) {
    event.preventDefault()
    if (!session?.access_token) {
      setToast('Please sign in again before submitting a report.')
      return
    }
    setBusy(true)
    try {
      const { data } = await api.post('/resident/incidents', {
        incident_type: incidentForm.incident_type,
        description: incidentForm.description.trim(),
      }, { accessToken: session.access_token })
      setIncidents((current) => [data, ...current])
      setIncidentForm({ incident_type: 'Safety concern', description: '' })
      setModal('')
      setToast('Your report has been sent to estate security.')
    } catch (error) {
      console.error('Incident report failed:', error)
      setToast('We could not send your report. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault()
    const body = messageDraft.trim()
    if (!body || !selectedRoom || !profile?.id || !session?.access_token) return
    setBusy(true)
    try {
      const { data } = await api.post(`/resident/chat/rooms/${selectedRoom}/messages`, { body }, { accessToken: session.access_token })
      setMessages((current) => [...current, data])
      setMessageDraft('')
    } catch (error) {
      console.error('Compound chat message failed:', error)
      setToast('Your message could not be sent. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePayLevy(levyId) {
    if (!session?.access_token) {
      setToast('Please sign in again before continuing.')
      return
    }
    setBusy(true)
    try {
      const result = await api.post(`/resident/payments/${levyId}/checkout`, {}, { accessToken: session.access_token })
      if (result.checkout_url) window.location.assign(result.checkout_url)
      else setToast('Online payments are not available yet. Please contact estate management.')
    } catch (error) {
      console.error('Payment checkout could not be started:', error)
      setToast('Online payments are not available yet. Please contact estate management.')
    } finally {
      setBusy(false)
    }
  }

  async function copyPassCode() {
    try {
      await navigator.clipboard.writeText(passDetails.code)
      setToast('Pass code copied.')
    } catch (error) {
      console.error('Visitor pass copy failed:', error)
      setToast('Copy is unavailable. Select and copy the pass code.')
    }
  }

  function renderOverview() {
    const notice = announcements[0]
    const home = units[0]
    return (
      <section className="resident-screen resident-screen-overview">
        <div className="resident-home-heading">
          <div>
            <span className="resident-label">Resident home</span>
            <h1>Welcome, {firstName}</h1>
            <p>{home ? `${home.compound_name} · ${home.unit_number}` : 'Your Peaceville community'}</p>
          </div>
          <span className="resident-home-mark"><House size={19} /></span>
        </div>

        <div className="resident-residence-card">
          <div className="resident-mini-icon"><Building2 size={16} /></div>
          <div><small>Your home</small><strong>{home?.unit_number ?? 'Account setup pending'}</strong></div>
          <span>{home?.occupancy_type ?? 'Resident'}</span>
        </div>

        <div className="resident-section-heading">
          <h2>Quick actions</h2>
        </div>
        <div className="resident-quick-actions">
          <button type="button" onClick={() => setActiveTab('Payments')}><Wallet size={17} /><span>Pay levy</span></button>
          <button type="button" onClick={openVisitorForm}><TicketCheck size={17} /><span>Invite visitor</span></button>
          <button type="button" onClick={() => setModal('incident')}><ShieldAlert size={17} /><span>Report issue</span></button>
        </div>

        <div className="resident-section-heading resident-notice-heading">
          <h2>Estate notices</h2>
          <span>{announcements.length} updates</span>
        </div>
        {notice ? (
          <article className="resident-announce-card">
            <div className="resident-announce-head">
              <span className="resident-mini-icon neutral"><Bell size={15} /></span>
              <strong>{notice.title}</strong>
            </div>
            <p>{notice.body}</p>
            <small className="resident-notice-date">{formatDate(notice.published_at)}</small>
          </article>
        ) : (
          <div className="resident-empty-state"><Bell size={18} /><span>No new estate notices.</span></div>
        )}
      </section>
    )
  }

  function renderPayments() {
    return (
      <section className="resident-screen resident-screen-block">
        <div className="resident-list-header compact">
          <div><span className="resident-label">Account</span><h1>Payments</h1></div>
          <span className="resident-total">{levies.length} active dues</span>
        </div>
        <div className="resident-section-heading"><h2>Current levies</h2></div>
        {levies.length ? <div className="resident-payment-list">
          {levies.map((levy) => (
            <article key={levy.id} className="resident-payment-row resident-levy-card">
              <span className="resident-payment-icon"><CircleDollarSign size={17} /></span>
              <div className="resident-payment-copy">
                <strong>{levy.title}</strong>
                <small>{levy.due_date ? `Due ${formatDate(levy.due_date)}` : levy.description || 'Estate charge'}</small>
              </div>
              <div className="resident-payment-meta">
                <span>{formatMoney(levy.amount)}</span>
                <button type="button" disabled={busy} onClick={() => handlePayLevy(levy.id)}>Pay</button>
              </div>
            </article>
          ))}
        </div> : <div className="resident-empty-state"><Check size={18} /><span>No active levies are due.</span></div>}

        <div className="resident-section-heading resident-history-heading"><h2>Payment history</h2></div>
        {payments.length ? <div className="resident-payment-list">
          {payments.map((payment) => (
            <article key={payment.id} className="resident-payment-row">
              <div className="resident-payment-copy">
                <strong>{relation(payment.levies)?.title ?? 'Estate payment'}</strong>
                <small>{formatDate(payment.paid_at || payment.created_at)}</small>
              </div>
              <div className="resident-payment-meta">
                <span>{formatMoney(payment.amount)}</span>
                <em className={`payment-status ${payment.status}`}>{payment.status.replaceAll('_', ' ')}</em>
              </div>
            </article>
          ))}
        </div> : <div className="resident-empty-state"><FileText size={18} /><span>Payment receipts will appear here.</span></div>}
      </section>
    )
  }

  function renderVisitors() {
    return (
      <section className="resident-screen resident-screen-block">
        <div className="resident-list-header compact">
          <div><span className="resident-label">Gate access</span><h1>Visitors</h1></div>
          <button type="button" className="resident-round-action" aria-label="Invite visitor" onClick={openVisitorForm}><Plus size={18} /></button>
        </div>
        {passDetails && <article className="resident-pass-card">
          <div className="resident-pass-heading"><TicketCheck size={17} /><span>Visitor pass ready</span><button type="button" onClick={() => setPassDetails(null)} aria-label="Dismiss visitor pass"><X size={16} /></button></div>
          <strong>{passDetails.visitorName}</strong>
          <div className="resident-pass-code">{passDetails.code}</div>
          <div className="resident-pass-footer"><span>Expires {formatDate(passDetails.expiresAt)}</span><button type="button" onClick={copyPassCode}><Copy size={14} />Copy code</button></div>
          <small>Save this code now. For security, it will not be shown again.</small>
        </article>}
        <button type="button" className="resident-primary-action" onClick={openVisitorForm}><Plus size={16} /> Invite a visitor</button>
        <div className="resident-section-heading resident-history-heading"><h2>Invitations</h2><span>{visitors.length}</span></div>
        {visitors.length ? <div className="resident-payment-list">
          {visitors.map((visitor) => (
            <article key={visitor.id} className="resident-payment-row">
              <div className="resident-payment-copy">
                <strong>{visitor.visitor_name}</strong>
                <small>{visitor.purpose || 'Guest'} · {formatDate(visitor.expected_at)}</small>
              </div>
              <em className={`payment-status ${visitor.status}`}>{visitor.status}</em>
            </article>
          ))}
        </div> : <div className="resident-empty-state"><UsersRound size={18} /><span>Your visitor invitations will appear here.</span></div>}
      </section>
    )
  }

  function renderSecurity() {
    return (
      <section className="resident-screen resident-screen-block">
        <div className="resident-list-header compact">
          <div><span className="resident-label">Safety</span><h1>Security</h1></div>
          <button type="button" className="resident-round-action" aria-label="Report an incident" onClick={() => setModal('incident')}><Plus size={18} /></button>
        </div>
        <article className="resident-security-callout">
          <ShieldAlert size={20} />
          <div><strong>Need help?</strong><small>Send a report to the estate security team.</small></div>
          <button type="button" onClick={() => setModal('incident')}>Report</button>
        </article>
        <div className="resident-section-heading resident-history-heading"><h2>Your reports</h2><span>{incidents.length}</span></div>
        {incidents.length ? <div className="resident-payment-list">
          {incidents.map((incident) => (
            <article key={incident.id} className="resident-payment-row">
              <div className="resident-payment-copy">
                <strong>{incident.incident_type}</strong>
                <small>{incident.description} · {formatDate(incident.created_at)}</small>
              </div>
              <em className={`payment-status ${incident.status}`}>{incident.status}</em>
            </article>
          ))}
        </div> : <div className="resident-empty-state"><ShieldAlert size={18} /><span>No reports submitted.</span></div>}
      </section>
    )
  }

  function renderChat() {
    return (
      <section className="resident-screen resident-screen-block resident-chat-screen">
        <div className="resident-list-header compact">
          <div><span className="resident-label">Community</span><h1>Compound chat</h1></div>
          <button type="button" className="resident-icon-button" aria-label="Back to more" onClick={() => setActiveTab('More')}><ChevronRight size={17} /></button>
        </div>
        {chatRooms.length ? <>
          <div className="resident-chat-room-name"><MessageCircle size={16} />{chatRooms.find((room) => room.id === selectedRoom)?.name ?? 'Compound chat'}</div>
          <div className="resident-chat-messages" aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`resident-chat-message${message.sender_id === profile?.id ? ' mine' : ''}`}><p>{message.body}</p><small>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>)}
            {!messages.length && <div className="resident-empty-state">No messages yet. Start the conversation.</div>}
          </div>
          <form className="resident-chat-form" onSubmit={handleSendMessage}>
            <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Write a message" maxLength={5000} aria-label="Write a message" />
            <button type="submit" disabled={busy || !messageDraft.trim()} aria-label="Send message"><Send size={17} /></button>
          </form>
        </> : <div className="resident-empty-state"><MessageCircle size={18} /><span>Compound chat has not been set up yet.</span></div>}
      </section>
    )
  }

  function renderMore() {
    return (
      <section className="resident-screen resident-screen-block">
        <div className="resident-list-header compact"><div><span className="resident-label">Community</span><h1>More</h1></div></div>
        <div className="resident-more-grid">
          <button type="button" className="resident-more-item" onClick={() => setActiveTab('Chat')}><MessageCircle size={18} />Compound chat<ChevronRight size={16} /></button>
          <button type="button" className="resident-more-item" onClick={() => setActiveTab('Visitors')}><TicketCheck size={18} />Visitor passes<ChevronRight size={16} /></button>
          <button type="button" className="resident-more-item" onClick={() => setActiveTab('Security')}><ShieldAlert size={18} />Incident reports<ChevronRight size={16} /></button>
          <button type="button" className="resident-more-item" onClick={() => setActiveTab('Payments')}><FileText size={18} />Receipts and payments<ChevronRight size={16} /></button>
          {meetings.map((meeting) => <article className="resident-more-item resident-meeting-item" key={meeting.id}><CalendarDays size={18} /><span><strong>{meeting.title}</strong><small>{formatDate(meeting.starts_at)}{meeting.description ? ` · ${meeting.description}` : ''}</small></span></article>)}
          {!meetings.length && <div className="resident-empty-state"><CalendarDays size={18} /><span>No upcoming meetings.</span></div>}
          <button type="button" className="resident-more-item signout" onClick={handleSignOut}><LogOut size={18} />Sign out</button>
        </div>
      </section>
    )
  }

  return (
    <main className="resident-stage">
      <div className="resident-shell">
        <header className="resident-header">
          <div className="resident-brand"><span className="resident-brand-mark"><House size={15} /></span><span>Peaceville</span></div>
          <div className="resident-header-actions">
            <button type="button" className="resident-icon-button" aria-label="Notifications" onClick={() => setToast('You are all caught up on notifications.')}><Bell size={16} /></button>
            <ProfilePhotoUpload compact />
          </div>
        </header>

        {loading ? <section className="resident-screen resident-loading"><span className="resident-loader" /><span>Loading your home…</span></section> : <>
          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Payments' && renderPayments()}
          {activeTab === 'Visitors' && renderVisitors()}
          {activeTab === 'Security' && renderSecurity()}
          {activeTab === 'More' && renderMore()}
          {activeTab === 'Chat' && renderChat()}
        </>}

        <nav className="resident-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} type="button" className={activeTab === label || (label === 'More' && activeTab === 'Chat') ? 'active' : ''} onClick={() => setActiveTab(label)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {modal && <div className="resident-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget && !busy) setModal('') }}>
        <form className="resident-modal" onSubmit={modal === 'visitor' ? handleInviteVisitor : handleReportIncident}>
          <div className="resident-modal-head">
            <div><span className="resident-label">Peaceville Estate</span><h2>{modal === 'visitor' ? 'Invite visitor' : 'Report incident'}</h2></div>
            <button type="button" className="resident-modal-close" onClick={() => setModal('')} aria-label="Close form" disabled={busy}><X size={18} /></button>
          </div>

          {modal === 'visitor' ? <>
            <label>Visitor name<input value={visitorForm.visitor_name} onChange={(event) => setVisitorForm({ ...visitorForm, visitor_name: event.target.value })} maxLength={100} autoComplete="name" required /></label>
            <label>Phone number <span className="resident-optional">Optional</span><input value={visitorForm.visitor_phone} onChange={(event) => setVisitorForm({ ...visitorForm, visitor_phone: event.target.value })} maxLength={40} inputMode="tel" /></label>
            <label>Purpose of visit<input value={visitorForm.purpose} onChange={(event) => setVisitorForm({ ...visitorForm, purpose: event.target.value })} maxLength={500} required /></label>
            {units.length > 1 && <label>Visiting home<select value={visitorForm.unit_id} onChange={(event) => setVisitorForm({ ...visitorForm, unit_id: event.target.value })}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.unit_number}</option>)}</select></label>}
            <label>Expected arrival<input type="datetime-local" value={visitorForm.expected_at} onChange={(event) => setVisitorForm({ ...visitorForm, expected_at: event.target.value })} min={futureLocalDateTime()} required /></label>
            <p className="resident-form-note"><Clock3 size={14} /> The pass expires two hours after the planned arrival.</p>
            <button type="submit" className="resident-submit-button" disabled={busy}>{busy ? 'Creating pass…' : 'Create visitor pass'}</button>
          </> : <>
            <label>Incident type<select value={incidentForm.incident_type} onChange={(event) => setIncidentForm({ ...incidentForm, incident_type: event.target.value })}><option>Safety concern</option><option>Suspicious activity</option><option>Fire or medical emergency</option><option>Property damage</option><option>Other</option></select></label>
            <label>What happened?<textarea value={incidentForm.description} onChange={(event) => setIncidentForm({ ...incidentForm, description: event.target.value })} minLength={5} maxLength={2000} placeholder="Describe what you saw" required /></label>
            <p className="resident-form-note"><ShieldAlert size={14} /> Your report is shared with authorized estate security staff.</p>
            <button type="submit" className="resident-submit-button" disabled={busy}>{busy ? 'Sending report…' : 'Send report'}</button>
          </>}
        </form>
      </div>}

      {toast && <div className="resident-toast" role="status">{toast}</div>}
    </main>
  )
}

export default RoleDashboardPage
