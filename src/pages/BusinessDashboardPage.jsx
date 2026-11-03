import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  FileText,
  House,
  ImagePlus,
  LogOut,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Store,
  UsersRound,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import '../css/business-dashboard.css'

const navigation = [
  { id: 'Home', icon: House },
  { id: 'Visitors', icon: UsersRound },
  { id: 'Payments', icon: CreditCard },
  { id: 'Chat', icon: MessageCircle },
  { id: 'Alerts', icon: Bell },
]
const incidentTypes = ['Fire', 'Suspicious person', 'Theft', 'Medical emergency']
const requestTypes = ['Text', 'Image', 'Dates', 'New ad']

function money(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))
}

function dateLabel(value, options = { day: 'numeric', month: 'short' }) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-NG', options).format(new Date(value))
}

function initials(value = '') {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'PV'
}

function passFor(visitor) {
  return Array.isArray(visitor.visitor_passes) ? visitor.visitor_passes[0] : visitor.visitor_passes
}

function BusinessDashboardPage() {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const logoInput = useRef(null)
  const [dashboard, setDashboard] = useState(null)
  const [activeTab, setActiveTab] = useState('Home')
  const [screen, setScreen] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState('')
  const [selectedPass, setSelectedPass] = useState(null)
  const [visitorFilter, setVisitorFilter] = useState('Active')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [alertFilter, setAlertFilter] = useState('All')
  const [paymentMonths, setPaymentMonths] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [visitorForm, setVisitorForm] = useState({ visitor_name: '', visitor_phone: '', purpose: 'Guest', expected_at: '' })
  const [incidentForm, setIncidentForm] = useState({ incident_type: incidentTypes[0], location: '', description: '' })
  const [incidentPhoto, setIncidentPhoto] = useState(null)
  const [adForm, setAdForm] = useState({ change_type: 'text', details: '' })
  const [adImage, setAdImage] = useState(null)
  const [profileForm, setProfileForm] = useState(null)
  const [chatRooms, setChatRooms] = useState([])
  const [chatRoomId, setChatRoomId] = useState('')
  const [messages, setMessages] = useState([])
  const [messageDraft, setMessageDraft] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  function notify(message) {
    setToast(message)
  }

  async function loadDashboard(showLoading = false) {
    if (!session?.access_token) return
    if (showLoading) setLoading(true)
    setError('')
    try {
      const data = await api.get('/business/dashboard', { accessToken: session.access_token })
      setDashboard(data)
      setProfileForm({
        name: data.business.name || '',
        location: data.business.location || '',
        contact_person: data.business.contact_person || '',
        phone: data.business.phone || '',
        website: data.business.website || '',
      })
    } catch (loadError) {
      console.error('Business dashboard could not be loaded:', loadError)
      setError(loadError.message || 'Business information could not be loaded. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadDashboard(true) }, [session?.access_token])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const reference = new URLSearchParams(location.search).get('reference')
    if (!reference?.startsWith('PV-BIZ-') || !session?.access_token) return
    api.get(`/business/payments/verify/${encodeURIComponent(reference)}`, { accessToken: session.access_token })
      .then(({ data }) => {
        notify(data.status === 'successful' ? 'Payment verified. Your receipt is ready.' : 'Payment is still processing. Refresh in a moment.')
        void loadDashboard()
      })
      .catch((verifyError) => notify(verifyError.message || 'Payment verification is still pending.'))
      .finally(() => navigate(location.pathname, { replace: true }))
  }, [location.search, location.pathname, navigate, session?.access_token])

  useEffect(() => {
    if (!dashboard) return
    setProfileForm({
      name: dashboard.business.name || '',
      location: dashboard.business.location || '',
      contact_person: dashboard.business.contact_person || '',
      phone: dashboard.business.phone || '',
      website: dashboard.business.website || '',
    })
  }, [dashboard?.business?.id])

  const business = dashboard?.business
  const currentRate = dashboard?.levy_rates?.find((rate) => rate.cycle === (business?.billing_cycle || 'monthly'))
  const currentMonth = new Date().toISOString().slice(0, 7)
  const activeVisitors = useMemo(() => (dashboard?.visitors ?? []).filter((visitor) => {
    const pass = passFor(visitor)
    if (visitorFilter === 'Used') return visitor.status === 'arrived' || visitor.status === 'departed' || pass?.status === 'used'
    if (visitorFilter === 'Expired') return visitor.status === 'expired' || (pass?.expires_at && new Date(pass.expires_at) < new Date())
    return ['pending', 'approved'].includes(visitor.status) && (!pass?.expires_at || new Date(pass.expires_at) >= new Date())
  }), [dashboard?.visitors, visitorFilter])
  const visiblePayments = useMemo(() => (dashboard?.payments ?? []).filter((payment) => {
    if (paymentFilter === 'Verified') return payment.status === 'successful'
    if (paymentFilter === 'Pending') return payment.status === 'pending'
    return true
  }), [dashboard?.payments, paymentFilter])
  const visibleAlerts = useMemo(() => (dashboard?.notifications ?? []).filter((alert) => {
    if (alertFilter === 'All') return true
    const type = String(alert.data?.type || '').toLowerCase()
    if (alertFilter === 'Payments') return type.includes('payment') || type.includes('levy')
    if (alertFilter === 'Security') return type.includes('incident') || type.includes('visitor') || type.includes('clearance')
    return !type.includes('payment') && !type.includes('levy') && !type.includes('incident') && !type.includes('visitor') && !type.includes('clearance')
  }), [dashboard?.notifications, alertFilter])

  async function uploadImage(file, endpoint, pathPrefix) {
    if (!file) return ''
    if (!supabase) throw new Error('Image uploads are not configured.')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      throw new Error('Choose a JPG, PNG or WebP image smaller than 8 MB.')
    }
    const upload = await api.post(endpoint, { content_type: file.type }, { accessToken: session.access_token })
    if (pathPrefix && !upload.path.startsWith(pathPrefix)) throw new Error('The image upload path is invalid.')
    const { error: uploadError } = await supabase.storage.from('business-images')
      .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type })
    if (uploadError) throw uploadError
    return upload.path
  }

  async function submitVisitor(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.post('/business/visitors', {
        ...visitorForm,
        expected_at: new Date(visitorForm.expected_at).toISOString(),
      }, { accessToken: session.access_token })
      setSelectedPass(data)
      setVisitorForm({ visitor_name: '', visitor_phone: '', purpose: 'Guest', expected_at: '' })
      setScreen('pass')
      await loadDashboard()
    } catch (submitError) {
      notify(submitError.message || 'We could not create this visitor pass.')
    } finally {
      setBusy(false)
    }
  }

  async function showPass(visitor) {
    setBusy(true)
    try {
      const { data } = await api.post(`/business/visitors/${visitor.id}/pass`, {}, { accessToken: session.access_token })
      setSelectedPass(data)
      setScreen('pass')
    } catch (passError) {
      notify(passError.message || 'This visitor pass is no longer available.')
    } finally {
      setBusy(false)
    }
  }

  async function cancelPass(visitorId) {
    setBusy(true)
    try {
      await api.post(`/business/visitors/${visitorId}/cancel`, {}, { accessToken: session.access_token })
      setSelectedPass(null)
      setScreen('')
      await loadDashboard()
      notify('Visitor pass cancelled.')
    } catch (cancelError) {
      notify(cancelError.message || 'We could not cancel this pass.')
    } finally {
      setBusy(false)
    }
  }

  async function sharePass() {
    if (!selectedPass?.pass_code) return
    const text = `Peaceville visitor pass for ${selectedPass.visitor_name}. Code: ${selectedPass.pass_code}. Expires ${dateLabel(selectedPass.pass_expires_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}.`
    try {
      if (navigator.share) await navigator.share({ title: 'Peaceville visitor pass', text })
      else {
        await navigator.clipboard.writeText(text)
        notify('Visitor pass copied to clipboard.')
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') notify('This device could not share the pass.')
    }
  }

  async function submitIncident(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const photoPath = incidentPhoto ? await uploadImage(incidentPhoto, '/business/incidents/upload-url', `${business.id}/incident-`) : ''
      await api.post('/business/incidents', { ...incidentForm, photo_path: photoPath }, { accessToken: session.access_token })
      setIncidentForm({ incident_type: incidentTypes[0], location: '', description: '' })
      setIncidentPhoto(null)
      setScreen('')
      await loadDashboard()
      notify('Incident sent to the security team.')
    } catch (submitError) {
      notify(submitError.message || 'We could not send this incident report.')
    } finally {
      setBusy(false)
    }
  }

  async function submitAdRequest(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const imagePath = adImage ? await uploadImage(adImage, '/business/ad-requests/upload-url', `${business.id}/ad-request-`) : ''
      await api.post('/business/ad-requests', { ...adForm, image_path: imagePath }, { accessToken: session.access_token })
      setAdForm({ change_type: 'text', details: '' })
      setAdImage(null)
      setScreen('')
      await loadDashboard()
      notify('Ad change request sent to estate management.')
    } catch (submitError) {
      notify(submitError.message || 'We could not send this ad request.')
    } finally {
      setBusy(false)
    }
  }

  async function startPayment(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await api.post('/business/payments/checkout', { months: paymentMonths, method: paymentMethod }, { accessToken: session.access_token })
      window.location.assign(result.checkout_url)
    } catch (paymentError) {
      notify(paymentError.message || 'Payment could not be started.')
      setBusy(false)
    }
  }

  function downloadReceipt(payment) {
    const receipt = [
      'PEACEVILLE ESTATE',
      'BUSINESS LEVY RECEIPT',
      `Business: ${business?.name || 'Business'}`,
      `Reference: ${payment.reference}`,
      `Period: ${dateLabel(payment.period_start)} - ${dateLabel(payment.period_end)}`,
      `Amount: ${money(payment.amount)}`,
      `Status: ${payment.status}`,
      `Paid: ${payment.paid_at ? dateLabel(payment.paid_at, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not paid'}`,
    ].join('\n')
    const url = URL.createObjectURL(new Blob([receipt], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `peaceville-receipt-${payment.reference}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  function downloadStatement() {
    const rows = [['Reference', 'Period start', 'Period end', 'Amount NGN', 'Status', 'Paid at'], ...(dashboard?.payments ?? []).map((payment) => [payment.reference, payment.period_start, payment.period_end, payment.amount, payment.status, payment.paid_at || ''])]
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'peaceville-business-statement.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function loadChat() {
    setChatLoading(true)
    try {
      const { data } = await api.get('/business/chat/rooms', { accessToken: session.access_token })
      setChatRooms(data ?? [])
      if (data?.length) {
        const selected = data.find((room) => room.id === chatRoomId) || data[0]
        setChatRoomId(selected.id)
        const result = await api.get(`/business/chat/rooms/${selected.id}/messages`, { accessToken: session.access_token })
        setMessages(result.data ?? [])
      } else setMessages([])
    } catch (chatError) {
      notify(chatError.message || 'Estate chat could not be loaded.')
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'Chat' && session?.access_token) void loadChat()
  }, [activeTab, session?.access_token])

  async function sendMessage(event) {
    event.preventDefault()
    if (!messageDraft.trim() || !chatRoomId) return
    setBusy(true)
    try {
      await api.post(`/business/chat/rooms/${chatRoomId}/messages`, { body: messageDraft.trim() }, { accessToken: session.access_token })
      setMessageDraft('')
      await loadChat()
    } catch (messageError) {
      notify(messageError.message || 'Your message could not be sent.')
    } finally {
      setBusy(false)
    }
  }

  async function markAlertRead(alert) {
    if (alert.read_at) return
    try {
      await api.post(`/business/notifications/${alert.id}/read`, {}, { accessToken: session.access_token })
      await loadDashboard()
    } catch (readError) {
      notify(readError.message || 'This alert could not be updated.')
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.patch('/business/profile', profileForm, { accessToken: session.access_token })
      await loadDashboard()
      notify('Business profile saved.')
    } catch (saveError) {
      notify(saveError.message || 'Business profile could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadLogo(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !business) return
    setBusy(true)
    try {
      await uploadImage(file, '/business/profile/image-upload-url', `${business.id}/profile-`)
      await loadDashboard()
      notify('Business logo updated.')
    } catch (uploadError) {
      notify(uploadError.message || 'Business logo could not be uploaded.')
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword() {
    if (!supabase || !profile?.email) {
      notify('Password reset is unavailable for this account.')
      return
    }
    setBusy(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/business` })
    setBusy(false)
    notify(resetError ? 'Password reset could not be sent.' : 'Password reset instructions sent to your email.')
  }

  async function handleSignOut() {
    setBusy(true)
    try {
      await signOut()
      navigate('/business', { replace: true })
    } catch (signOutError) {
      notify(signOutError.message || 'We could not sign you out.')
      setBusy(false)
    }
  }

  function openTab(tab) {
    setActiveTab(tab)
    setScreen('')
    setModal('')
  }

  function renderHeader() {
    return (
      <header className="business-header">
        <button className="business-brand" type="button" onClick={() => openTab('Home')}>
          <span className="business-brand-mark"><Store size={17} /></span>
          <span><strong>Peaceville</strong><small>BUSINESS PORTAL</small></span>
        </button>
        <div className="business-header-actions">
          <button className="business-alert-button" type="button" aria-label={`${dashboard?.unread_count ?? 0} unread alerts`} onClick={() => openTab('Alerts')}>
            <Bell size={18} />{dashboard?.unread_count > 0 && <span>{dashboard.unread_count > 9 ? '9+' : dashboard.unread_count}</span>}
          </button>
          <button className="business-avatar" type="button" aria-label="Open business profile" onClick={() => { openTab('Profile') }}>
            {business?.image_url ? <img src={business.image_url} alt="" /> : initials(business?.name || profile?.full_name)}
          </button>
        </div>
      </header>
    )
  }

  function renderHome() {
    const clearance = dashboard?.clearance
    const status = business?.status || 'pending'
    const dueRate = dashboard?.levy_rates?.find((rate) => rate.cycle === 'monthly') || currentRate
    const upcomingMeeting = dashboard?.meetings?.[0]
    return (
      <section className="business-screen">
        <div className="business-welcome"><span>{dateLabel(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</span><h1>{business?.name || 'Your business'}</h1><p>Your Peaceville business at a glance.</p></div>
        {status !== 'active' && <div className={`business-approval-banner ${status}`}><ShieldCheck size={18} /><span><strong>{status === 'pending' ? 'Profile awaiting approval' : `Business ${status}`}</strong><small>{status === 'pending' ? 'Your account is ready. Estate management must approve the business before payments and actions are enabled.' : 'Contact estate management for help with this account.'}</small></span></div>}
        <article className="business-levy-card">
          <div className="business-card-top"><span>COMMERCIAL LEVY · {new Date().toLocaleString('en-NG', { month: 'long' }).toUpperCase()}</span><span className={`business-pill ${clearance?.paid ? 'paid' : 'due'}`}>{clearance?.paid ? 'Paid' : 'Due'}</span></div>
          <strong className="business-amount">{dueRate ? money(dueRate.rate_amount) : 'Rate pending'}</strong>
          <div className="business-levy-bottom"><span>{business?.billing_cycle || 'Monthly'} billing · {clearance?.paid ? 'Payment verified' : 'Current period'}</span><button type="button" onClick={() => setScreen('pay')} disabled={status !== 'active'}>Pay levy <ArrowUpRight size={14} /></button></div>
        </article>
        <button className="business-clearance-row" type="button" onClick={() => openTab('Alerts')}>
          <span className={`business-clearance-icon ${clearance?.status === 'approved' ? 'approved' : ''}`}>{clearance?.status === 'approved' ? <Check size={17} /> : <Clock3 size={17} />}</span>
          <span><strong>Monthly clearance</strong><small>{clearance?.status === 'approved' ? `Cleared${clearance.approved_at ? ` · until ${dateLabel(clearance.approved_at)}` : ''}` : clearance?.paid ? 'Payment verified · waiting for security' : 'Clearance follows a verified levy payment'}</small></span>
          <span className={`business-status-text ${clearance?.status === 'approved' ? 'good' : ''}`}>{clearance?.status === 'approved' ? 'Cleared' : clearance?.paid ? 'Review' : 'Not paid'}</span><ChevronRight size={15} />
        </button>
        <div className="business-section-heading"><div><h2>Quick actions</h2><p>Common business tasks</p></div></div>
        <div className="business-action-grid">
          <button type="button" onClick={() => { setVisitorForm({ visitor_name: '', visitor_phone: '', purpose: 'Guest', expected_at: '' }); setScreen('invite') }} disabled={status !== 'active'}><span className="action-icon green"><UsersRound size={18} /></span><strong>Invite visitor</strong><small>Create a gate pass</small></button>
          <button type="button" onClick={() => setScreen('incident')} disabled={status !== 'active'}><span className="action-icon coral"><CircleAlert size={18} /></span><strong>Report incident</strong><small>Alert estate security</small></button>
          <button type="button" onClick={() => { openTab('Chat') }} disabled={status !== 'active'}><span className="action-icon blue"><MessageCircle size={18} /></span><strong>Estate chat</strong><small>Join the community</small></button>
          <button type="button" onClick={() => setScreen('ad-request')} disabled={status !== 'active'}><span className="action-icon gold"><ImagePlus size={18} /></span><strong>Request ad change</strong><small>Send to management</small></button>
        </div>
        <div className="business-section-heading"><div><h2>Estate updates</h2><p>Notices and upcoming meetings</p></div><button type="button" onClick={() => openTab('Alerts')}>All alerts <ChevronRight size={14} /></button></div>
        <div className="business-update-list">
          {(dashboard?.announcements ?? []).slice(0, 2).map((notice) => <button className="business-update-row" type="button" key={notice.id} onClick={() => openTab('Alerts')}><span className="business-update-icon"><FileText size={16} /></span><span><strong>{notice.title}</strong><small>{notice.body}</small></span><ChevronRight size={15} /></button>)}
          {upcomingMeeting && <article className="business-update-row"><span className="business-update-icon meeting"><CalendarDays size={16} /></span><span><strong>{upcomingMeeting.title}</strong><small>{dateLabel(upcomingMeeting.starts_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}{upcomingMeeting.description ? ` · ${upcomingMeeting.description}` : ''}</small></span></article>}
          {!dashboard?.announcements?.length && !upcomingMeeting && <div className="business-empty">No new notices or meetings.</div>}
        </div>
      </section>
    )
  }

  function renderPayments() {
    return (
      <section className="business-screen">
        <div className="business-page-heading"><div><span className="business-eyebrow">LEVY ACCOUNT</span><h1>Payments</h1><p>Verified payments and receipts for {business?.name}.</p></div><button className="business-icon-button" type="button" aria-label="Download statement" title="Download statement" onClick={downloadStatement}><ArrowDownToLine size={17} /></button></div>
        <div className="business-filter-tabs">{['All', 'Verified', 'Pending'].map((filter) => <button className={paymentFilter === filter ? 'active' : ''} type="button" key={filter} onClick={() => setPaymentFilter(filter)}>{filter}</button>)}</div>
        <div className="business-payment-list">{visiblePayments.map((payment) => (
          <article className="business-payment-row" key={payment.id}><span className="business-payment-icon"><CreditCard size={17} /></span><span className="business-payment-copy"><strong>{money(payment.amount)}</strong><small>{dateLabel(payment.period_start)} – {dateLabel(payment.period_end)} · {payment.reference}</small><span className={`business-pill ${payment.status === 'successful' ? 'paid' : payment.status === 'pending' ? 'due' : 'neutral'}`}>{payment.status === 'successful' ? 'Verified' : payment.status}</span></span><button className="business-icon-button" type="button" aria-label={`Download receipt for ${payment.reference}`} title="Download receipt" onClick={() => downloadReceipt(payment)}><ArrowDownToLine size={16} /></button></article>
        ))}{!visiblePayments.length && <div className="business-empty">No {paymentFilter === 'All' ? '' : paymentFilter.toLowerCase()} payments yet.</div>}</div>
        <button className="business-primary-button" type="button" onClick={() => setScreen('pay')} disabled={business?.status !== 'active'}><CreditCard size={17} />Pay commercial levy</button>
      </section>
    )
  }

  function renderVisitors() {
    const filters = ['Active', 'Used', 'Expired']
    return (
      <section className="business-screen">
        <div className="business-page-heading"><div><span className="business-eyebrow">GATE ACCESS</span><h1>Visitors</h1><p>Guest and service passes issued by your business.</p></div><button className="business-icon-button" type="button" aria-label="Create visitor pass" title="Create visitor pass" onClick={() => setScreen('invite')} disabled={business?.status !== 'active'}><Plus size={18} /></button></div>
        <div className="business-filter-tabs">{filters.map((filter) => <button className={visitorFilter === filter ? 'active' : ''} type="button" key={filter} onClick={() => setVisitorFilter(filter)}>{filter}</button>)}</div>
        <div className="business-visitor-list">{activeVisitors.map((visitor) => {
          const pass = passFor(visitor)
          const canShow = ['pending', 'approved'].includes(visitor.status) && (!pass?.expires_at || new Date(pass.expires_at) > new Date())
          return <article className="business-visitor-row" key={visitor.id}><span className="business-person-mark">{initials(visitor.visitor_name)}</span><span className="business-visitor-copy"><strong>{visitor.visitor_name}</strong><small>{visitor.purpose || 'Guest'} · {dateLabel(visitor.expected_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</small><span className={`business-pill ${visitor.status === 'arrived' || visitor.status === 'departed' ? 'neutral' : 'paid'}`}>{visitor.status}</span></span>{canShow && <button className="business-outline-button compact" type="button" onClick={() => void showPass(visitor)} disabled={busy}>Show pass</button>}{visitor.status === 'pending' && <button className="business-icon-button" type="button" title="Cancel pass" aria-label={`Cancel ${visitor.visitor_name}'s pass`} onClick={() => void cancelPass(visitor.id)} disabled={busy}><X size={16} /></button>}</article>
        })}{!activeVisitors.length && <div className="business-empty">No {visitorFilter.toLowerCase()} visitor passes.</div>}</div>
        <button className="business-primary-button" type="button" onClick={() => setScreen('invite')} disabled={business?.status !== 'active'}><Plus size={17} />Create visitor pass</button>
      </section>
    )
  }

  function renderAlerts() {
    return (
      <section className="business-screen">
        <div className="business-page-heading"><div><span className="business-eyebrow">PEACEVILLE UPDATES</span><h1>Alerts</h1><p>Payments, security and estate notices.</p></div><span className="business-unread-count">{dashboard?.unread_count ?? 0} unread</span></div>
        <div className="business-filter-tabs">{['All', 'Payments', 'Security', 'Estate'].map((filter) => <button className={alertFilter === filter ? 'active' : ''} type="button" key={filter} onClick={() => setAlertFilter(filter)}>{filter}</button>)}</div>
        <div className="business-alert-list">{visibleAlerts.map((alert) => <button className={`business-alert-row${alert.read_at ? '' : ' unread'}`} type="button" key={alert.id} onClick={() => void markAlertRead(alert)}><span className="business-alert-icon"><Bell size={17} /></span><span><strong>{alert.title}</strong><small>{alert.body}</small><time>{dateLabel(alert.created_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</time></span>{!alert.read_at && <span className="business-unread-dot" />}</button>)}
          {(dashboard?.announcements ?? []).map((notice) => <button className="business-alert-row" type="button" key={`notice-${notice.id}`} onClick={() => setModal(`notice:${notice.id}`)}><span className="business-alert-icon estate"><FileText size={17} /></span><span><strong>{notice.title}</strong><small>{notice.body}</small><time>Estate notice · {dateLabel(notice.published_at)}</time></span></button>)}
          {!visibleAlerts.length && !dashboard?.announcements?.length && <div className="business-empty">You’re all caught up.</div>}</div>
      </section>
    )
  }

  function renderChat() {
    const room = chatRooms.find((item) => item.id === chatRoomId)
    return (
      <section className="business-chat-screen">
        <div className="business-page-heading"><div><span className="business-eyebrow">ESTATE COMMUNITY</span><h1>Chat</h1><p>Community conversations and meetings.</p></div><button className="business-icon-button" type="button" aria-label="Refresh chat" title="Refresh chat" onClick={() => void loadChat()}><CheckCheck size={17} /></button></div>
        {chatRooms.length > 1 && <label className="business-chat-room"><span>Room</span><select value={chatRoomId} onChange={async (event) => { setChatRoomId(event.target.value); setChatLoading(true); try { const result = await api.get(`/business/chat/rooms/${event.target.value}/messages`, { accessToken: session.access_token }); setMessages(result.data ?? []) } catch (chatError) { notify(chatError.message) } finally { setChatLoading(false) } }}>{chatRooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}
        <div className="business-chat-room-title"><span className="business-chat-room-mark"><MessageCircle size={16} /></span><span><strong>{room?.name || 'Estate community'}</strong><small>{room?.scope === 'compound' ? 'Compound conversation' : 'Estate conversation'}</small></span></div>
        <div className="business-message-list" aria-live="polite">{chatLoading ? <div className="business-empty">Loading conversation…</div> : messages.map((message) => {
          const sender = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles
          const own = message.sender_id === profile?.id
          return <article className={`business-message${own ? ' own' : ''}`} key={message.id}><span className="business-message-author">{own ? 'You' : sender?.full_name || 'Estate member'}</span><p>{message.body}</p><time>{dateLabel(message.created_at, { hour: 'numeric', minute: '2-digit' })}</time></article>
        })}{!chatLoading && !messages.length && <div className="business-empty">No messages yet. Start the conversation.</div>}</div>
        <form className="business-chat-composer" onSubmit={sendMessage}><input aria-label="Write a message" value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Write a message…" maxLength={5000} required disabled={!chatRoomId} /><button type="submit" aria-label="Send message" disabled={busy || !chatRoomId || !messageDraft.trim()}><Send size={17} /></button></form>
        <div className="business-meeting-list"><h2>Upcoming meetings</h2>{(dashboard?.meetings ?? []).map((meeting) => <article key={meeting.id}><CalendarDays size={15} /><span><strong>{meeting.title}</strong><small>{dateLabel(meeting.starts_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</small></span></article>)}{!dashboard?.meetings?.length && <p>No upcoming meetings.</p>}</div>
      </section>
    )
  }

  function renderProfile() {
    if (!profileForm) return <div className="business-empty">Loading business profile…</div>
    return (
      <section className="business-screen">
        <div className="business-page-heading"><div><span className="business-eyebrow">IDENTITY & ACCOUNT</span><h1>Business profile</h1><p>Manage your business details and contact person.</p></div></div>
        <div className="business-profile-hero"><button className="business-logo-upload" type="button" onClick={() => logoInput.current?.click()} disabled={busy}>{business?.image_url ? <img src={business.image_url} alt="Business logo" /> : <span>{initials(business?.name)}</span>}<i><Camera size={14} /></i></button><span><strong>{business?.name}</strong><small>{business?.type?.replaceAll('_', ' ')} · {business?.status}</small></span><input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadLogo} /></div>
        <form className="business-form" onSubmit={saveProfile}>
          <h2>Business details</h2>
          <label>Business name<input maxLength={160} value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} required /></label>
          <label>Address or location<input maxLength={240} value={profileForm.location} onChange={(event) => setProfileForm({ ...profileForm, location: event.target.value })} required /></label>
          <label>Contact person<input maxLength={120} value={profileForm.contact_person} onChange={(event) => setProfileForm({ ...profileForm, contact_person: event.target.value })} /></label>
          <label>Phone<input type="tel" maxLength={40} value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} /></label>
          <label>Website<input type="url" maxLength={240} placeholder="https://" value={profileForm.website} onChange={(event) => setProfileForm({ ...profileForm, website: event.target.value })} /></label>
          <button className="business-primary-button" type="submit" disabled={busy}><Check size={16} />Save business details</button>
        </form>
        <div className="business-profile-facts"><h2>Billing and clearance</h2><div><span>Business type</span><strong>{business?.type?.replaceAll('_', ' ')}</strong></div><div><span>Billing cycle</span><strong>{business?.billing_cycle}</strong></div><div><span>Current levy</span><strong>{currentRate ? money(currentRate.rate_amount) : 'Rate not set'}</strong></div><div><span>This month</span><strong>{dashboard?.clearance?.status === 'approved' ? 'Cleared' : dashboard?.clearance?.paid ? 'Awaiting security' : 'Not paid'}</strong></div><p>Billing cycle and levy rates are set by estate management.</p></div>
        <div className="business-security-settings"><h2>Password and security</h2><p>Reset your sign-in password through your verified email address.</p><button className="business-outline-button" type="button" onClick={resetPassword} disabled={busy}>Send password reset link</button></div>
        <button className="business-signout-button" type="button" onClick={handleSignOut} disabled={busy}><LogOut size={17} />Sign out</button>
      </section>
    )
  }

  function renderScreen() {
    if (screen === 'invite') return <section className="business-screen"><div className="business-page-heading"><button className="business-back-button" type="button" onClick={() => setScreen('')}><ArrowLeft size={17} /></button><div><span className="business-eyebrow">GATE ACCESS</span><h1>Invite a visitor</h1><p>Create a pass for a guest, parent, vendor or delivery.</p></div></div><form className="business-form" onSubmit={submitVisitor}><label>Visitor name<input autoComplete="name" maxLength={100} value={visitorForm.visitor_name} onChange={(event) => setVisitorForm({ ...visitorForm, visitor_name: event.target.value })} required /></label><label>Phone number<input type="tel" autoComplete="tel" maxLength={40} value={visitorForm.visitor_phone} onChange={(event) => setVisitorForm({ ...visitorForm, visitor_phone: event.target.value })} /></label><label>Date and time<input type="datetime-local" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} value={visitorForm.expected_at} onChange={(event) => setVisitorForm({ ...visitorForm, expected_at: event.target.value })} required /></label><label>Purpose<select value={visitorForm.purpose} onChange={(event) => setVisitorForm({ ...visitorForm, purpose: event.target.value })}><option>Guest</option><option>Parent</option><option>Vendor</option><option>Delivery</option><option>Service</option><option>Other</option></select></label><button className="business-primary-button" type="submit" disabled={busy}><UsersRound size={17} />{busy ? 'Creating pass…' : 'Create visitor pass'}</button></form></section>
    if (screen === 'pass' && selectedPass) return <section className="business-screen"><div className="business-page-heading"><button className="business-back-button" type="button" onClick={() => { setScreen(''); setSelectedPass(null) }}><ArrowLeft size={17} /></button><div><span className="business-eyebrow">GATE PASS</span><h1>Visitor pass</h1><p>Share this QR code with your visitor.</p></div></div><article className="business-pass-card"><span className="business-pass-brand"><span className="business-brand-mark"><Store size={16} /></span>Peaceville Estate</span><div className="business-qr"><QRCodeSVG value={selectedPass.pass_code} size={188} level="M" includeMargin /></div><strong>{selectedPass.visitor_name}</strong><span>{selectedPass.purpose || 'Visitor'} · {business?.name}</span><small>Expected {dateLabel(selectedPass.expected_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</small><div className="business-pass-code">{selectedPass.pass_code}</div><small>Valid until {dateLabel(selectedPass.pass_expires_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</small></article><button className="business-primary-button" type="button" onClick={sharePass}><ArrowUpRight size={17} />Share pass</button><button className="business-outline-button full" type="button" onClick={() => void cancelPass(selectedPass.id)} disabled={busy}>Cancel pass</button></section>
    if (screen === 'pay') return <section className="business-screen"><div className="business-page-heading"><button className="business-back-button" type="button" onClick={() => setScreen('')}><ArrowLeft size={17} /></button><div><span className="business-eyebrow">SECURE CHECKOUT</span><h1>Pay levy</h1><p>Commercial levy set by Peaceville Estate.</p></div></div><form className="business-form" onSubmit={startPayment}><label>Pay for<select value={paymentMonths} onChange={(event) => setPaymentMonths(Number(event.target.value))}><option value={1}>This month · {money(dashboard?.levy_rates?.find((rate) => rate.cycle === 'monthly')?.rate_amount)}</option><option value={3}>3 months · {money(dashboard?.levy_rates?.find((rate) => rate.cycle === 'quarterly')?.rate_amount)}</option><option value={12}>Full year · {money(dashboard?.levy_rates?.find((rate) => rate.cycle === 'annual')?.rate_amount)}</option></select></label><div className="business-checkout-amount"><span>Total</span><strong>{money(dashboard?.levy_rates?.find((rate) => rate.cycle === (paymentMonths === 1 ? 'monthly' : paymentMonths === 3 ? 'quarterly' : 'annual'))?.rate_amount)}</strong></div><fieldset className="business-payment-method"><legend>Payment method</legend><label className={paymentMethod === 'card' ? 'selected' : ''}><input type="radio" name="payment-method" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /><CreditCard size={17} />Card</label><label className={paymentMethod === 'bank' ? 'selected' : ''}><input type="radio" name="payment-method" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} /><BriefcaseBusiness size={17} />Bank transfer</label></fieldset>{!dashboard?.payment_provider_ready && <p className="business-provider-note">Online checkout is not connected yet. Estate management can provide an alternative payment method.</p>}<button className="business-primary-button" type="submit" disabled={busy || !dashboard?.payment_provider_ready || business?.status !== 'active'}><ShieldCheck size={17} />{busy ? 'Connecting…' : 'Pay securely'}</button></form></section>
    if (screen === 'incident') return <section className="business-screen"><div className="business-page-heading"><button className="business-back-button" type="button" onClick={() => setScreen('')}><ArrowLeft size={17} /></button><div><span className="business-eyebrow">SECURITY REPORT</span><h1>Report incident</h1><p>Tell the estate security team what happened.</p></div></div><form className="business-form" onSubmit={submitIncident}><fieldset className="business-incident-types"><legend>Incident type</legend>{incidentTypes.map((type) => <button className={incidentForm.incident_type === type ? 'selected' : ''} type="button" key={type} onClick={() => setIncidentForm({ ...incidentForm, incident_type: type })}>{type}</button>)}</fieldset><label>Location<input maxLength={200} placeholder="Building, gate or unit" value={incidentForm.location} onChange={(event) => setIncidentForm({ ...incidentForm, location: event.target.value })} required /></label><label>Description<textarea rows="5" minLength={5} maxLength={1800} placeholder="Describe what happened and when" value={incidentForm.description} onChange={(event) => setIncidentForm({ ...incidentForm, description: event.target.value })} required /></label><label className="business-file-field"><ImagePlus size={17} /><span>{incidentPhoto?.name || 'Add photo (optional)'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setIncidentPhoto(event.target.files?.[0] ?? null)} /></label><button className="business-primary-button" type="submit" disabled={busy}><Send size={16} />{busy ? 'Sending…' : 'Send to security now'}</button></form></section>
    if (screen === 'ad-request') return <section className="business-screen"><div className="business-page-heading"><button className="business-back-button" type="button" onClick={() => setScreen('')}><ArrowLeft size={17} /></button><div><span className="business-eyebrow">ESTATE ADVERTISING</span><h1>Request an ad change</h1><p>Estate management reviews and publishes all ads.</p></div></div><div className="business-ad-preview">{dashboard?.ads?.[0] ? <><div className="business-ad-preview-top"><span>LIVE ESTATE AD</span><span className="business-pill paid">{dashboard.ads[0].status}</span></div><h2>{dashboard.ads[0].title}</h2><p>{dashboard.ads[0].summary}</p><small>{dashboard.ads[0].partner_name} · {dashboard.ads[0].starts_at ? dateLabel(dashboard.ads[0].starts_at) : 'Run date not set'}{dashboard.ads[0].ends_at ? ` – ${dateLabel(dashboard.ads[0].ends_at)}` : ''}</small></> : <><div className="business-ad-preview-top"><span>AD PROFILE</span><span className="business-pill neutral">Not published</span></div><h2>{business?.name}</h2><p>No live estate ad is currently linked to this business.</p><small>Request a new ad to begin.</small></>}</div><form className="business-form" onSubmit={submitAdRequest}><fieldset className="business-request-types"><legend>What should change?</legend>{requestTypes.map((type) => <button className={adForm.change_type === type.toLowerCase() ? 'selected' : ''} type="button" key={type} onClick={() => setAdForm({ ...adForm, change_type: type.toLowerCase() })}>{type}</button>)}</fieldset><label>Details<textarea rows="5" minLength="5" maxLength="2000" placeholder="Describe the requested update" value={adForm.details} onChange={(event) => setAdForm({ ...adForm, details: event.target.value })} required /></label><label className="business-file-field"><ImagePlus size={17} /><span>{adImage?.name || 'Attach image (optional)'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setAdImage(event.target.files?.[0] ?? null)} /></label><button className="business-primary-button" type="submit" disabled={busy}><Send size={16} />{busy ? 'Sending…' : 'Send request'}</button></form><div className="business-section-heading"><div><h2>Past requests</h2><p>Updates from estate management</p></div></div><div className="business-request-list">{(dashboard?.ad_requests ?? []).map((request) => <article key={request.id}><span className={`business-pill ${request.status === 'approved' ? 'paid' : request.status === 'rejected' ? 'neutral' : 'due'}`}>{request.status}</span><strong>{request.change_type.replaceAll('_', ' ')} update</strong><p>{request.details}</p>{request.admin_response && <small>Estate response: {request.admin_response}</small>}<time>{dateLabel(request.created_at)}</time></article>)}{!dashboard?.ad_requests?.length && <div className="business-empty">No ad requests yet.</div>}</div></section>
    return null
  }

  function renderModal() {
    if (!modal) return null
    if (modal.startsWith('notice:')) {
      const notice = dashboard?.announcements?.find((item) => item.id === modal.slice(7))
      return <div className="business-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal('') }}><article className="business-modal"><div className="business-modal-heading"><span><FileText size={17} />Estate notice</span><button type="button" aria-label="Close" onClick={() => setModal('')}><X size={17} /></button></div><h2>{notice?.title}</h2><p>{notice?.body}</p><small>{dateLabel(notice?.published_at, { day: 'numeric', month: 'long', year: 'numeric' })}</small></article></div>
    }
    return null
  }

  if (loading && !dashboard) return <main className="business-stage"><div className="business-shell"><div className="business-loading"><span className="business-brand-mark"><Store size={17} /></span><strong>Opening your business workspace…</strong></div></div></main>
  if (error && !dashboard) return <main className="business-stage"><div className="business-shell"><div className="business-error"><span className="business-brand-mark"><Store size={17} /></span><h1>Workspace unavailable</h1><p>{error}</p><button className="business-primary-button" type="button" onClick={() => void loadDashboard(true)}>Try again</button></div></div></main>

  const isSubscreen = Boolean(screen)
  return (
    <main className="business-stage">
      <div className="business-shell">
        {renderHeader()}
        <div className="business-content">
          {error && <div className="business-inline-error" role="alert">{error}<button type="button" onClick={() => void loadDashboard()}>Retry</button></div>}
          {isSubscreen ? renderScreen() : activeTab === 'Home' ? renderHome() : activeTab === 'Visitors' ? renderVisitors() : activeTab === 'Payments' ? renderPayments() : activeTab === 'Chat' ? renderChat() : activeTab === 'Alerts' ? renderAlerts() : renderProfile()}
        </div>
        {!isSubscreen && <nav className="business-bottom-nav" aria-label="Business dashboard navigation">{navigation.map(({ id, icon: Icon }) => <button className={activeTab === id ? 'active' : ''} type="button" key={id} onClick={() => openTab(id)} aria-current={activeTab === id ? 'page' : undefined}><span className="business-nav-icon"><Icon size={18} />{id === 'Alerts' && dashboard?.unread_count > 0 && <i />}</span><span>{id}</span></button>)}</nav>}
        {renderModal()}
        {toast && <div className="business-toast" role="status">{toast}</div>}
      </div>
    </main>
  )
}

export default BusinessDashboardPage