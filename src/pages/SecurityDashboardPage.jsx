import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  House,
  LogOut,
  MapPin,
  MessageSquareText,
  Search,
  Shield,
  TicketCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import '../css/security-dashboard.css'

const tabs = [
  { id: 'Gate', icon: House },
  { id: 'Visitors', icon: UsersRound },
  { id: 'Incidents', icon: AlertTriangle },
  { id: 'Patrol', icon: MapPin },
  { id: 'Profile', icon: Shield },
]

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function friendlyDate(value) {
  if (!value) return 'Time not set'
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function SecurityDashboardPage() {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Gate')
  const [home, setHome] = useState(null)
  const [visitors, setVisitors] = useState([])
  const [incidents, setIncidents] = useState([])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [clearances, setClearances] = useState([])
  const [clearanceMonth, setClearanceMonth] = useState(monthKey())
  const [clearanceType, setClearanceType] = useState('All')
  const [clearanceStatus, setClearanceStatus] = useState('All')
  const [clearanceSearch, setClearanceSearch] = useState('')
  const [selectedClearance, setSelectedClearance] = useState(null)
  const [checkedOccupants, setCheckedOccupants] = useState([])
  const [checkedVehicles, setCheckedVehicles] = useState([])
  const [visitorFilter, setVisitorFilter] = useState('Inside')
  const [visitorSearch, setVisitorSearch] = useState('')
  const [modal, setModal] = useState('')
  const [verifiedPass, setVerifiedPass] = useState(null)
  const [passCode, setPassCode] = useState('')
  const [denyReason, setDenyReason] = useState('')
  const [walkIn, setWalkIn] = useState({ visitor_name: '', visitor_phone: '', purpose: 'Guest', host_unit_id: '', vehicle_plate: '' })
  const [walkInPhoto, setWalkInPhoto] = useState(null)
  const [incidentNote, setIncidentNote] = useState('')
  const [incidentStatus, setIncidentStatus] = useState('open')
  const [checkpointTag, setCheckpointTag] = useState('')
  const [handoverNotes, setHandoverNotes] = useState('')
  const [emergencyDraft, setEmergencyDraft] = useState({ alert_type: 'Security emergency', location: '' })
  const [alertDetails, setAlertDetails] = useState(null)
  const [draftBusy, setDraftBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const isSupervisor = profile?.role === 'estate_security'

  function notify(message, type = 'success') {
    setToast({ message, type })
  }

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function loadHome(showLoading = false) {
    if (!session?.access_token) return
    if (showLoading) setLoading(true)
    try {
      const data = await api.get('/security/home', { accessToken: session.access_token })
      setHome(data)
    } catch (error) {
      console.error('Security home could not be loaded:', error)
      notify('Security information is unavailable. Check your connection and assignment.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadVisitors(state = visitorFilter) {
    if (!session?.access_token) return
    try {
      const { data } = await api.get(`/security/visitors?state=${encodeURIComponent(state.toLowerCase())}&search=${encodeURIComponent(visitorSearch)}`, { accessToken: session.access_token })
      setVisitors(data ?? [])
    } catch (error) {
      console.error('Security visitor list could not be loaded:', error)
      notify('Visitor records could not be loaded. Please try again.', 'error')
    }
  }

  async function loadIncidents() {
    if (!session?.access_token) return
    try {
      const { data } = await api.get('/security/incidents', { accessToken: session.access_token })
      setIncidents(data ?? [])
    } catch (error) {
      console.error('Security incident list could not be loaded:', error)
      notify('Incident records could not be loaded. Please try again.', 'error')
    }
  }

  async function loadClearances() {
    if (!session?.access_token) return
    try {
      const params = new URLSearchParams({ month: clearanceMonth })
      if (clearanceType !== 'All') params.set('type', clearanceType.toLowerCase())
      if (clearanceStatus !== 'All') params.set('status', clearanceStatus.toLowerCase())
      if (clearanceSearch.trim()) params.set('search', clearanceSearch.trim())
      const { data } = await api.get(`/security/clearances?${params}`, { accessToken: session.access_token })
      setClearances(data ?? [])
    } catch (error) {
      console.error('Monthly clearance records could not be loaded:', error)
      notify('Monthly clearance could not be loaded. Please try again.', 'error')
    }
  }

  useEffect(() => {
    void loadHome(true)
  }, [session?.access_token])

  useEffect(() => {
    if (!session?.access_token) return undefined
    const timer = window.setInterval(() => { void loadHome() }, 12000)
    const onOnline = () => { void loadHome(); notify('Connection restored.') }
    window.addEventListener('online', onOnline)
    return () => { window.clearInterval(timer); window.removeEventListener('online', onOnline) }
  }, [session?.access_token])

  useEffect(() => {
    if (activeTab === 'Visitors') void loadVisitors()
  }, [activeTab, visitorFilter, visitorSearch, session?.access_token])

  useEffect(() => {
    if (activeTab === 'Incidents') void loadIncidents()
  }, [activeTab, session?.access_token])

  useEffect(() => {
    if (activeTab === 'Gate' && home?.pending_approvals?.length) setModal('resident-approval')
  }, [activeTab, home?.pending_approvals?.length])

  useEffect(() => {
    if (activeTab === 'Patrol') void loadHome()
  }, [activeTab])

  const filteredClearances = useMemo(() => clearances, [clearances])
  const expectedVisitors = home?.expected_visitors ?? []
  const openIncidents = incidents.filter((incident) => incident.status !== 'resolved')
  const checkpoints = home?.patrol?.checkpoints ?? []
  const patrolDone = checkpoints.filter((checkpoint) => checkpoint.checked_at).length
  const nextApproval = home?.pending_approvals?.[0]

  async function startShift() {
    setDraftBusy(true)
    try {
      const { data } = await api.post('/security/shifts/start', {}, { accessToken: session.access_token })
      setHome((current) => ({ ...current, shift: data }))
      notify('Shift started. You are on duty.')
    } catch (error) {
      console.error('Security shift could not be started:', error)
      notify('We could not start your shift. Check your assignment and try again.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function verifyPass(event) {
    event?.preventDefault()
    if (!passCode.trim()) return
    setDraftBusy(true)
    try {
      const result = await api.post('/security/passes/verify', { pass_code: passCode.trim() }, { accessToken: session.access_token })
      setVerifiedPass(result)
      if (!result.valid) notify(result.reason || 'This pass is not valid at this gate.', 'error')
    } catch (error) {
      console.error('Security visitor pass verification failed:', error)
      setVerifiedPass({ valid: false, reason: 'This pass is invalid, expired, or assigned to another compound.' })
      notify('This pass could not be verified.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function decideEntry(decision) {
    if (!verifiedPass?.visitor?.id) return
    if (decision === 'denied' && denyReason.trim().length < 3) {
      notify('Add a short reason before denying entry.', 'error')
      return
    }
    setDraftBusy(true)
    try {
      await api.post('/security/entries', {
        visitor_id: verifiedPass.visitor.id,
        decision,
        reason: decision === 'denied' ? denyReason.trim() : undefined,
        request_id: crypto.randomUUID(),
      }, { accessToken: session.access_token })
      setVerifiedPass(null)
      setPassCode('')
      setDenyReason('')
      setModal('')
      await loadHome()
      notify(decision === 'approved' ? 'Entry approved and logged.' : 'Entry denied and logged.')
    } catch (error) {
      console.error('Visitor entry decision failed:', error)
      notify('We could not record that gate decision. Please retry.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function createWalkIn(event) {
    event.preventDefault()
    setDraftBusy(true)
    let photoPath = null
    try {
      if (walkInPhoto && supabase) {
        const photoName = `${profile.id}/${crypto.randomUUID()}-${walkInPhoto.name.replaceAll(/[^a-zA-Z0-9._-]/g, '-')}`
        const { data: upload, error: uploadError } = await supabase.storage.from('security-evidence').upload(photoName, walkInPhoto, { contentType: walkInPhoto.type, upsert: false })
        if (uploadError) throw uploadError
        photoPath = upload.path
      }
      const result = await api.post('/security/visitors/walk-in', {
        ...walkIn,
        photo_path: photoPath,
      }, { accessToken: session.access_token })
      setModal('')
      setWalkIn({ visitor_name: '', visitor_phone: '', purpose: 'Guest', host_unit_id: '', vehicle_plate: '' })
      setWalkInPhoto(null)
      await loadHome()
      notify(result.status === 'waiting' ? 'Resident approval requested. Waiting for a response.' : 'Walk-in request recorded.')
    } catch (error) {
      console.error('Walk-in visitor request failed:', error)
      notify('We could not request resident approval. Please check the visitor details.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function markExit(visitorId) {
    setDraftBusy(true)
    try {
      await api.post('/security/exits', { visitor_id: visitorId, request_id: crypto.randomUUID() }, { accessToken: session.access_token })
      await loadVisitors()
      await loadHome()
      notify('Visitor exit recorded.')
    } catch (error) {
      console.error('Visitor exit could not be recorded:', error)
      notify('We could not record the exit. Please retry.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function loadClearanceDetail(subject) {
    setDraftBusy(true)
    try {
      const { data } = await api.get(`/security/clearances/${subject.id}?month=${clearanceMonth}`, { accessToken: session.access_token })
      setSelectedClearance(data)
      setCheckedOccupants((data.occupants ?? []).map((occupant) => occupant.id))
      setCheckedVehicles((data.vehicles ?? []).map((vehicle) => vehicle.plate))
      setModal('clearance-detail')
    } catch (error) {
      console.error('Clearance details could not be loaded:', error)
      notify('We could not load this household or business.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function approveClearance(subject = selectedClearance) {
    if (!subject) return
    setDraftBusy(true)
    try {
      await api.post('/security/clearances', {
        month: clearanceMonth,
        approvals: [{ subject_type: subject.subject_type, subject_id: subject.id, occupant_ids: checkedOccupants, vehicle_plates: checkedVehicles }],
      }, { accessToken: session.access_token })
      setModal('')
      setSelectedClearance(null)
      await loadClearances()
      await loadHome()
      notify('Clearance approved through the end of this month.')
    } catch (error) {
      console.error('Monthly clearance approval failed:', error)
      notify('This subject is not cleared for approval yet.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function approveAllPaid() {
    const paidRows = filteredClearances.filter((row) => row.levy_status === 'paid' && row.clearance_status !== 'approved')
    if (!paidRows.length) {
      notify('There are no paid records ready to approve.', 'error')
      return
    }
    setDraftBusy(true)
    try {
      await api.post('/security/clearances', {
        month: clearanceMonth,
        approvals: paidRows.map((row) => ({ subject_type: row.subject_type, subject_id: row.id, occupant_ids: (row.occupants ?? []).map((item) => item.id), vehicle_plates: (row.vehicles ?? []).map((item) => item.plate) })),
      }, { accessToken: session.access_token })
      await loadClearances()
      await loadHome()
      notify(`${paidRows.length} paid records approved for this month.`)
    } catch (error) {
      console.error('Bulk clearance approval failed:', error)
      notify('We could not approve all paid records. Refresh the list and retry.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function referClearance(subject) {
    setDraftBusy(true)
    try {
      await api.post(`/security/clearances/${subject.id}/refer`, { subject_type: subject.subject_type, month: clearanceMonth }, { accessToken: session.access_token })
      await loadClearances()
      notify('Unpaid record referred to estate management.')
    } catch (error) {
      console.error('Clearance referral failed:', error)
      notify('We could not refer this record. Please try again.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function openIncident(incident) {
    setDraftBusy(true)
    try {
      const { data } = await api.get(`/security/incidents/${incident.id}`, { accessToken: session.access_token })
      setSelectedIncident(data)
      setIncidentStatus(data.status === 'investigating' ? 'checking' : data.status)
      setIncidentNote('')
    } catch (error) {
      console.error('Incident details could not be loaded:', error)
      notify('Incident details could not be loaded.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function saveIncidentUpdate(event) {
    event.preventDefault()
    if (!selectedIncident || !incidentNote.trim()) {
      notify('Add a note before saving the incident update.', 'error')
      return
    }
    setDraftBusy(true)
    try {
      await api.patch(`/incidents/${selectedIncident.id}`, { status: incidentStatus, note: incidentNote.trim() }, { accessToken: session.access_token })
      setModal('')
      setSelectedIncident(null)
      await loadIncidents()
      await loadHome()
      notify('Incident update saved to the timeline.')
    } catch (error) {
      console.error('Incident update failed:', error)
      notify('We could not save this incident update.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function triggerEmergency(event) {
    event.preventDefault()
    if (!emergencyDraft.location.trim()) {
      notify('Enter the emergency location.', 'error')
      return
    }
    setDraftBusy(true)
    try {
      const { data } = await api.post('/security/emergency', emergencyDraft, { accessToken: session.access_token })
      setAlertDetails(data)
      setModal('')
      setEmergencyDraft({ alert_type: 'Security emergency', location: '' })
      notify('Emergency alert sent to the security team.')
      await loadHome()
    } catch (error) {
      console.error('Emergency alert failed:', error)
      notify('We could not send the emergency alert. Please retry.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function acknowledgeAlert(alertId) {
    try {
      await api.post(`/security/alerts/${alertId}/ack`, {}, { accessToken: session.access_token })
      await loadHome()
      notify('You are marked as responding.')
    } catch (error) {
      console.error('Emergency acknowledgement failed:', error)
      notify('We could not record your response.', 'error')
    }
  }

  async function checkInCheckpoint(event) {
    event.preventDefault()
    if (!checkpointTag.trim()) return
    setDraftBusy(true)
    try {
      await api.post('/security/patrol/checkins', { tag: checkpointTag.trim(), request_id: crypto.randomUUID() }, { accessToken: session.access_token })
      setCheckpointTag('')
      await loadHome()
      notify('Patrol checkpoint recorded.')
    } catch (error) {
      console.error('Patrol check-in failed:', error)
      notify('Checkpoint could not be verified for this shift.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function submitHandover(event) {
    event.preventDefault()
    if (handoverNotes.trim().length < 5) {
      notify('Add handover notes before ending the shift.', 'error')
      return
    }
    setDraftBusy(true)
    try {
      await api.post('/security/shifts/handover', { notes: handoverNotes.trim() }, { accessToken: session.access_token })
      setHandoverNotes('')
      setModal('')
      await loadHome()
      notify('Handover recorded. Waiting for the next guard to accept.')
    } catch (error) {
      console.error('Shift handover failed:', error)
      notify('We could not submit handover notes.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function respondToApproval(requestId, decision) {
    setDraftBusy(true)
    try {
      await api.post(`/resident/approvals/${requestId}`, { decision }, { accessToken: session.access_token })
      setModal('')
      await loadHome()
      notify('Resident approval response recorded.')
    } catch (error) {
      console.error('Walk-in approval response failed:', error)
      notify('The approval request has already expired or changed.', 'error')
    } finally {
      setDraftBusy(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Security sign-out failed:', error)
      notify('We could not sign you out. Please try again.', 'error')
    }
  }

  async function switchTab(tabId) {
    setActiveTab(tabId)
    setModal('')
    setSelectedClearance(null)
    setSelectedIncident(null)
    if (tabId !== 'Gate') setAlertDetails(null)
  }

  function openClearance() {
    setModal('')
    setActiveTab('Gate')
    void loadClearances()
    setSelectedClearance(null)
    setModal('clearance')
  }

  function renderRecord(row, icon = UsersRound) {
    const Icon = icon
    const isLongStay = row.status === 'arrived' && Date.now() - new Date(row.arrived_at || row.expected_at).getTime() > 3 * 60 * 60 * 1000
    return (
      <article className="security-record" key={row.id}>
        <span className="security-record-icon"><Icon size={15} /></span>
        <span className="security-record-copy"><strong>{row.visitor_name || row.name || row.incident_type}</strong><small>{row.unit_number || row.location || row.purpose || 'Estate access'}{row.expected_at ? ` · ${friendlyDate(row.expected_at)}` : ''}{isLongStay ? ' · Over 3 hours' : ''}</small></span>
        <span className="security-record-side"><span className={`security-status ${row.status || 'pending'}`}>{row.status?.replaceAll('_', ' ') || 'Pending'}</span>{row.status === 'arrived' && <button className="security-inline-action" type="button" disabled={draftBusy} onClick={() => markExit(row.id)}>Mark exit</button>}</span>
      </article>
    )
  }

  function renderGate() {
    const shift = home?.shift
    return (
      <section className="security-screen">
        {!navigator.onLine && <div className="security-offline">Offline. Actions will need a connection before they can be recorded.</div>}
        <div className="security-shift-card">
          <div className="security-shift-top"><strong>{home?.assignment?.gate || 'Gate assignment'}</strong><span>{shift?.status === 'active' ? 'On duty' : 'Shift not started'}</span></div>
          <div className="security-shift-time">{shift?.starts_at ? `${new Date(shift.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${home?.shift_ends_at ? new Date(home.shift_ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Shift end'}` : 'Start of shift'}</div>
          <div className="security-shift-foot"><span>{profile?.full_name || 'Security guard'} · {home?.assignment?.gate || 'Main gate'}</span><span>{shift?.time_left || 'Ready'}</span></div>
        </div>
        {shift?.status === 'active'
          ? <button className="security-primary-action" type="button" onClick={() => { setPassCode(''); setVerifiedPass(null); setModal('verify-pass') }}><TicketCheck size={17} />Scan visitor pass</button>
          : <button className="security-primary-action" type="button" disabled={draftBusy} onClick={startShift}><Check size={17} />{draftBusy ? 'Starting shift…' : 'Start shift'}</button>}
        <div className="security-stat-grid">
          <article className="security-stat-card"><span className="security-stat-icon"><UsersRound size={17} /></span><strong className="security-stat-value">{home?.visitors_inside_count ?? 0}</strong><span className="security-stat-label">Visitors inside</span></article>
          <article className="security-stat-card"><span className="security-stat-icon"><Clock3 size={17} /></span><strong className="security-stat-value">{home?.expected_today_count ?? 0}</strong><span className="security-stat-label">Expected today</span></article>
        </div>
        <div className="security-shortcut-grid">
          <button className="security-shortcut" type="button" onClick={() => { setWalkIn((current) => ({ ...current, host_unit_id: home?.resident_units?.[0]?.id || '' })); setModal('walk-in') }}><UsersRound size={16} />Walk-in visitor</button>
          <button className="security-shortcut" type="button" onClick={() => setActiveTab('Patrol')}><MapPin size={16} />Patrol check-in</button>
        </div>
        <button className="security-clearance-link" type="button" onClick={openClearance}><Clock3 size={18} /><span><strong>Monthly clearance</strong><small>{home?.clearance_ready_count ?? 0} paid, ready to approve</small></span><span className="security-status due">{new Date().toLocaleString('en-NG', { month: 'short' })}</span><ChevronRight size={15} /></button>
        <div className="security-section-title"><h2>Expected next</h2><button type="button" onClick={() => switchTab('Visitors')}>All visitors</button></div>
        <div className="security-record-list">{expectedVisitors.slice(0, 3).map((visitor) => renderRecord(visitor, UsersRound))}{!expectedVisitors.length && <div className="security-empty">No visitors expected soon.</div>}</div>
        <div className="security-section-title"><h2>Open incident</h2><button type="button" onClick={() => switchTab('Incidents')}>View all</button></div>
        <div className="security-record-list">{openIncidents.slice(0, 1).map((incident) => <button className="security-record" key={incident.id} type="button" onClick={() => openIncident(incident)}><span className="security-record-icon"><AlertTriangle size={15} /></span><span className="security-record-copy"><strong>{incident.incident_type}</strong><small>{incident.location || incident.description} · {friendlyDate(incident.created_at)}</small></span><span className="security-status open">Open</span></button>)}{!openIncidents.length && <div className="security-empty">No open incidents.</div>}</div>
        <button className="security-danger-action" type="button" onClick={() => setModal('emergency-confirm')}><BellRing size={16} />Send emergency alert</button>
      </section>
    )
  }

  function renderVisitors() {
    const filters = ['Inside', 'Expected', 'Exited', 'Denied']
    return (
      <section className="security-screen">
        <div className="security-heading"><div><h1>Visitors inside</h1><p>Live visitor activity for your assigned gate.</p></div><button className="security-profile-button" type="button" aria-label="Walk-in visitor" onClick={() => setModal('walk-in')}><UsersRound size={16} /></button></div>
        <label className="security-search"><Search size={15} /><input value={visitorSearch} onChange={(event) => setVisitorSearch(event.target.value)} placeholder="Search name, unit or plate" /></label>
        <div className="security-filter-row">{filters.map((filter) => <button className={visitorFilter === filter ? 'active' : ''} type="button" key={filter} onClick={() => setVisitorFilter(filter)}>{filter}</button>)}</div>
        <div className="security-record-list">{visitors.map((visitor) => renderRecord(visitor))}{!visitors.length && <div className="security-empty">No {visitorFilter.toLowerCase()} visitors.</div>}</div>
      </section>
    )
  }

  function renderClearance() {
    const filters = ['All', 'Residents', 'Businesses', 'Ready', 'Unpaid']
    const paidCount = clearances.filter((item) => item.levy_status === 'paid').length
    const unpaidCount = clearances.filter((item) => item.levy_status !== 'paid').length
    return (
      <section className="security-screen">
        <div className="security-heading"><div><h1>Monthly clearance</h1><p>Unpaid homes are referred, never blocked.</p></div><button className="security-profile-button" type="button" aria-label="Close clearance" onClick={() => setModal('')}><X size={16} /></button></div>
        <label className="security-search"><Clock3 size={14} /><input type="month" value={clearanceMonth} max={monthKey()} onChange={(event) => setClearanceMonth(event.target.value)} /></label>
        <div className="security-metric-row"><article className="security-stat-card"><strong className="security-stat-value">{paidCount}</strong><span className="security-stat-label">Paid, ready to approve</span></article><article className="security-stat-card"><strong className="security-stat-value">{unpaidCount}</strong><span className="security-stat-label">Not paid yet</span></article></div>
        <label className="security-search"><Search size={15} /><input value={clearanceSearch} onChange={(event) => setClearanceSearch(event.target.value)} placeholder="Search name, unit or business" /></label>
        <div className="security-filter-row">{filters.map((filter) => <button className={(clearanceType === filter || clearanceStatus === filter) ? 'active' : ''} type="button" key={filter} onClick={() => { if (filter === 'Residents' || filter === 'Businesses') { setClearanceType(filter); setClearanceStatus('All') } else { setClearanceStatus(filter); setClearanceType('All') } }}>{filter}</button>)}</div>
        <button className="security-primary-action" type="button" disabled={draftBusy || !paidCount} onClick={approveAllPaid}><Check size={15} />Approve all paid</button>
        <div className="security-record-list">{filteredClearances.map((subject) => (
          <article className="security-clearance-subject" key={`${subject.subject_type}-${subject.id}`}>
            <div className="security-clearance-subject-head"><span><strong>{subject.name}</strong><small>{subject.location || subject.unit_number || subject.type} · {subject.levy_amount ? `₦${Number(subject.levy_amount).toLocaleString('en-NG')}` : 'Monthly levy'}{subject.paid_at ? ` · ${friendlyDate(subject.paid_at)}` : ''}</small></span><span className={`security-status ${subject.levy_status}`}>{subject.levy_status}</span></div>
            {subject.levy_status === 'paid' ? <div className="security-inline-buttons"><button className="security-inline-action" type="button" onClick={() => void loadClearanceDetail(subject)}>Details / approve</button></div> : <button className="security-inline-action refer" type="button" onClick={() => referClearance(subject)}>Refer to admin</button>}
          </article>
        ))}{!filteredClearances.length && <div className="security-empty">No clearance records match these filters.</div>}</div>
        <p className="security-modal-head"><small>Approvals last until {new Date(new Date(`${clearanceMonth}-01T00:00:00`).getFullYear(), new Date(`${clearanceMonth}-01T00:00:00`).getMonth() + 1, 0).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} and reset on the 1st.</small></p>
      </section>
    )
  }

  function renderIncidents() {
    return (
      <section className="security-screen">
        <div className="security-heading"><div><h1>Incidents</h1><p>Reports and current response activity.</p></div><span className="security-status open">{openIncidents.length} open</span></div>
        <div className="security-record-list">{incidents.map((incident) => <button className="security-record" key={incident.id} type="button" onClick={() => openIncident(incident)}><span className="security-record-icon"><AlertTriangle size={15} /></span><span className="security-record-copy"><strong>{incident.incident_type}</strong><small>{incident.location || incident.description} · {friendlyDate(incident.created_at)}</small></span><span className={`security-status ${incident.status}`}>{incident.status}</span></button>)}{!incidents.length && <div className="security-empty">No incidents are assigned to this shift.</div>}</div>
        {!!home?.active_alerts?.length && <div className="security-danger-panel"><strong>Active emergency alerts</strong>{home.active_alerts.map((alert) => <div key={alert.id}><p>{alert.alert_type} · {alert.location}</p><button className="security-danger-action" type="button" onClick={() => acknowledgeAlert(alert.id)}>I am responding</button></div>)}</div>}
      </section>
    )
  }

  function renderPatrol() {
    return (
      <section className="security-screen">
        <div className="security-heading"><div><h1>Patrol</h1><p>Today's patrol · {patrolDone} of {checkpoints.length} done</p></div><span className="security-badge">{home?.patrol?.round_label || 'Round 1'}</span></div>
        <div className="security-shift-card"><div className="security-shift-top"><strong>Today's patrol</strong><span>{patrolDone} of {checkpoints.length} checkpoints</span></div><div className="security-progress"><span style={{ width: `${checkpoints.length ? Math.round((patrolDone / checkpoints.length) * 100) : 0}%` }} /></div></div>
        <div className="security-record-list">{checkpoints.map((checkpoint) => <article className="security-record" key={checkpoint.id}><span className="security-record-icon"><MapPin size={15} /></span><span className="security-record-copy"><strong>{checkpoint.name}</strong><small>{checkpoint.location || checkpoint.gate || 'Checkpoint'} · {checkpoint.checked_at ? `Checked ${friendlyDate(checkpoint.checked_at)}` : `Due ${friendlyDate(checkpoint.due_at)}`}</small></span><span className={`security-status ${checkpoint.checked_at ? 'done' : checkpoint.late ? 'late' : 'due'}`}>{checkpoint.checked_at ? 'Done' : checkpoint.late ? 'Late' : 'Due'}</span></article>)}{!checkpoints.length && <div className="security-empty">No patrol checkpoints are assigned to this shift.</div>}</div>
        <form className="security-record" onSubmit={checkInCheckpoint}><label className="security-record-copy"><strong>Scan checkpoint tag</strong><input value={checkpointTag} onChange={(event) => setCheckpointTag(event.target.value)} placeholder="Enter or scan tag code" required /></label><button className="security-inline-action" type="submit" disabled={draftBusy}>Check in</button></form>
        <div className="security-section-title"><h2>On duty now</h2><span className="security-status inside">{home?.roster?.length ?? 0}</span></div>
        <div className="security-record-list">{(home?.roster ?? []).map((guard) => <article className="security-record" key={guard.id}><span className="security-record-icon"><Shield size={15} /></span><span className="security-record-copy"><strong>{guard.full_name}</strong><small>{guard.gate} · {guard.duty_status?.replaceAll('_', ' ')}</small></span>{guard.id === profile?.id && <span className="security-status valid">You</span>}</article>)}</div>
        <button className="security-secondary-action" type="button" onClick={() => setModal('handover')}><DoorOpen size={16} />Hand over shift</button>
      </section>
    )
  }

  function renderProfile() {
    return (
      <section className="security-screen">
        <div className="security-heading"><div><h1>Profile</h1><p>Duty assignment and session.</p></div></div>
        <article className="security-profile-card"><strong>{profile?.full_name || 'Security officer'}</strong><span>{profile?.role?.replaceAll('_', ' ')}</span><span>{home?.assignment?.gate || 'No gate assigned'} · {home?.assignment?.compound_name || 'No compound'}</span><span>{home?.shift?.status === 'active' ? 'On duty' : 'Off duty'}</span></article>
        <button className="security-secondary-action" type="button" onClick={() => setModal('handover')} disabled={home?.shift?.status !== 'active'}><DoorOpen size={16} />Shift handover</button>
        <button className="security-secondary-action" type="button" onClick={() => setToast({ message: 'Session security is managed by your estate administrator.', type: 'success' })}><Shield size={16} />Security and session</button>
        <button className="security-danger-action" type="button" onClick={handleSignOut}><LogOut size={16} />Sign out</button>
      </section>
    )
  }

  function renderModal() {
    if (!modal) return null
    if (modal === 'emergency-confirm') return <div className="security-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setModal('') }}><div className="security-modal"><div className="security-modal-head"><div><h2>Send emergency alert?</h2><p>This alerts security staff and creates an incident record.</p></div><button className="security-modal-close" type="button" onClick={() => setModal('')} aria-label="Close"><X size={15} /></button></div><form className="security-screen" onSubmit={triggerEmergency}><label>Alert type<select value={emergencyDraft.alert_type} onChange={(event) => setEmergencyDraft({ ...emergencyDraft, alert_type: event.target.value })}><option>Security emergency</option><option>Fire or smoke</option><option>Medical emergency</option><option>Suspicious activity</option><option>Other urgent help</option></select></label><label>Location<input value={emergencyDraft.location} onChange={(event) => setEmergencyDraft({ ...emergencyDraft, location: event.target.value })} placeholder="Gate, block or unit" required /></label><div className="security-danger-panel"><strong>Confirm only for a real emergency.</strong><p>Emergency alerts stay active until a guard acknowledges them. False alarms remain in the audit log.</p></div><button className="security-danger-action" type="submit" disabled={draftBusy}>{draftBusy ? 'Sending alert…' : 'Confirm and send alert'}</button></form></div></div>
    if (modal === 'verify-pass') return <div className="security-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setModal('') }}><form className="security-modal" onSubmit={verifyPass}><div className="security-modal-head"><div><h2>Gate check</h2><p>Scan a visitor QR or enter the pass code.</p></div><button className="security-modal-close" type="button" onClick={() => setModal('')} aria-label="Close"><X size={15} /></button></div><button className="security-primary-action" type="button" onClick={() => notify('Camera scanning is unavailable on this device. Enter the pass code manually.', 'error')}><TicketCheck size={16} />Scan visitor QR code</button><label>Or enter pass code<input autoFocus autoComplete="off" value={passCode} onChange={(event) => setPassCode(event.target.value)} placeholder="PV-XXXX-XXXX" required /></label><button className="security-primary-action" type="submit" disabled={draftBusy}>{draftBusy ? 'Checking…' : 'Verify pass'}</button>{verifiedPass && <div className="security-result-card"><span className={`security-status ${verifiedPass.valid ? 'valid' : 'denied'}`}>{verifiedPass.valid ? 'Valid' : 'Refused'}</span><strong>{verifiedPass.visitor?.visitor_name || verifiedPass.visitor?.name || 'Visitor pass'}</strong><small>{verifiedPass.visitor?.visitor_phone || 'No phone'} · {verifiedPass.visitor?.unit_number || 'Host unit not available'}</small><small>Expires {friendlyDate(verifiedPass.visitor?.expires_at)}</small>{verifiedPass.reason && <small>{verifiedPass.reason}</small>}{verifiedPass.valid && <div className="security-modal-actions"><button className="security-primary-action" type="button" onClick={() => decideEntry('approved')} disabled={draftBusy}>Approve entry</button><button className="security-danger-action" type="button" onClick={() => setModal('deny-entry')}>Deny entry</button></div>}</div>}</form></div>
    if (modal === 'deny-entry') return <div className="security-modal-backdrop"><form className="security-modal" onSubmit={(event) => { event.preventDefault(); void decideEntry('denied') }}><div className="security-modal-head"><div><h2>Deny entry</h2><p>The decision and reason are logged.</p></div><button className="security-modal-close" type="button" onClick={() => setModal('verify-pass')} aria-label="Back"><ChevronLeft size={15} /></button></div><label>Reason<textarea value={denyReason} onChange={(event) => setDenyReason(event.target.value)} maxLength={500} required /></label><button className="security-danger-action" type="submit" disabled={draftBusy}>Confirm denial</button></form></div>
    if (modal === 'walk-in') return <div className="security-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setModal('') }}><form className="security-modal" onSubmit={createWalkIn}><div className="security-modal-head"><div><h2>Walk-in visitor</h2><p>Request resident approval before entry.</p></div><button className="security-modal-close" type="button" onClick={() => setModal('')} aria-label="Close"><X size={15} /></button></div><label>Visitor name<input value={walkIn.visitor_name} onChange={(event) => setWalkIn({ ...walkIn, visitor_name: event.target.value })} maxLength={100} required /></label><label>Phone number<input type="tel" value={walkIn.visitor_phone} onChange={(event) => setWalkIn({ ...walkIn, visitor_phone: event.target.value })} maxLength={40} /></label><label>Purpose<select value={walkIn.purpose} onChange={(event) => setWalkIn({ ...walkIn, purpose: event.target.value })}><option>Guest</option><option>Delivery</option><option>Service</option><option>Other</option></select></label><label>Visiting (name or unit)<select value={walkIn.host_unit_id} onChange={(event) => setWalkIn({ ...walkIn, host_unit_id: event.target.value })} required><option value="">Choose home</option>{(home?.resident_units ?? []).map((unit) => <option value={unit.id} key={unit.id}>{unit.unit_number} · {unit.compound_name}</option>)}</select></label><label>Vehicle plate (optional)<input value={walkIn.vehicle_plate} onChange={(event) => setWalkIn({ ...walkIn, vehicle_plate: event.target.value.toUpperCase() })} maxLength={20} /></label><label>Photo or ID<input type="file" accept="image/*" capture="environment" onChange={(event) => setWalkInPhoto(event.target.files?.[0] ?? null)} /></label><button className="security-capture" type="button" onClick={() => document.getElementById('walkin-photo')?.click()}>Take photo or ID</button><button className="security-primary-action" type="submit" disabled={draftBusy}>{draftBusy ? 'Requesting…' : 'Request resident approval'}</button></form></div>
    if (modal === 'clearance') return <div className="security-modal-backdrop"><div className="security-modal security-clearance-modal">{renderClearance()}</div></div>
    if (modal === 'clearance-detail' && selectedClearance) return <div className="security-modal-backdrop"><div className="security-modal"><div className="security-modal-head"><div><h2>{selectedClearance.name}</h2><p>{selectedClearance.location || selectedClearance.unit_number} · {selectedClearance.subject_type}</p></div><button className="security-modal-close" type="button" onClick={() => setModal('clearance')} aria-label="Back"><ChevronLeft size={15} /></button></div><div className="security-result-card"><strong>{selectedClearance.levy_status === 'paid' ? 'Paid this month' : 'Unpaid'}</strong><small>{selectedClearance.levy_amount ? `₦${Number(selectedClearance.levy_amount).toLocaleString('en-NG')}` : ''} · {selectedClearance.reference || 'Payment verified'}</small><small>{selectedClearance.paid_at ? friendlyDate(selectedClearance.paid_at) : 'No payment recorded'}</small></div><div className="security-section-title"><h2>Occupants</h2></div>{(selectedClearance.occupants ?? []).map((occupant) => <label className="security-check-row" key={occupant.id}><input type="checkbox" checked={checkedOccupants.includes(occupant.id)} onChange={(event) => setCheckedOccupants((items) => event.target.checked ? [...items, occupant.id] : items.filter((id) => id !== occupant.id))} />{occupant.full_name} · {occupant.role}</label>)}<div className="security-section-title"><h2>Vehicles</h2></div>{(selectedClearance.vehicles ?? []).map((vehicle) => <label className="security-check-row" key={vehicle.plate}><input type="checkbox" checked={checkedVehicles.includes(vehicle.plate)} onChange={(event) => setCheckedVehicles((items) => event.target.checked ? [...items, vehicle.plate] : items.filter((plate) => plate !== vehicle.plate))} />{vehicle.plate}{vehicle.description ? ` · ${vehicle.description}` : ''}</label>)}<div className="security-danger-panel"><strong>Clearance is not a movement restriction.</strong><p>Unpaid residents and businesses are referred to management. Nobody is stopped from leaving.</p></div><button className="security-primary-action" type="button" onClick={() => approveClearance()} disabled={draftBusy || selectedClearance.levy_status !== 'paid'}>{draftBusy ? 'Saving…' : 'Approve for the month'}</button><button className="security-secondary-action" type="button" onClick={() => referClearance(selectedClearance)}>Refer to admin</button></div></div>
    if (modal === 'incident-detail' && selectedIncident) return <div className="security-modal-backdrop"><form className="security-modal" onSubmit={saveIncidentUpdate}><div className="security-modal-head"><div><h2>{selectedIncident.incident_type}</h2><p>{selectedIncident.location || selectedIncident.description}</p></div><button className="security-modal-close" type="button" onClick={() => setModal('')} aria-label="Close"><X size={15} /></button></div><div className="security-timeline">{(selectedIncident.timeline ?? []).map((item) => <div className="security-timeline-item" key={item.id}><Clock3 size={13} /><span><strong>{item.title || item.note || item.action}</strong><small>{friendlyDate(item.created_at)} · {item.author_name || 'Security'}</small></span></div>)}</div><label>Status<select value={incidentStatus} onChange={(event) => setIncidentStatus(event.target.value)}><option value="open">Open</option><option value="checking">Checking</option><option value="resolved">Resolved</option></select></label><label>Add a note<textarea value={incidentNote} onChange={(event) => setIncidentNote(event.target.value)} maxLength={2000} required placeholder="What did you find or do?" /></label>{selectedIncident.reporter_phone && <a className="security-secondary-action" href={`tel:${selectedIncident.reporter_phone}`}>Call reporter</a>}<button className="security-primary-action" type="submit" disabled={draftBusy}>{draftBusy ? 'Saving…' : 'Save update'}</button></form></div>
    if (modal === 'emergency-active' && alertDetails) return <div className="security-modal-fullscreen"><span className="security-alert-icon"><BellRing size={25} /></span><h2>{alertDetails.alert_type || 'Emergency alert'}</h2><p>{alertDetails.location}</p><p>Alert sent to the security team. It stays active until a guard acknowledges it.</p><button className="security-primary-action" type="button" onClick={() => acknowledgeAlert(alertDetails.id)}>I am responding</button><button className="security-secondary-action" type="button" onClick={() => setModal('')}>Close</button></div>
    if (modal === 'resident-approval' && nextApproval) return <div className="security-modal-backdrop"><div className="security-modal"><div className="security-modal-head"><div><h2>Resident approval</h2><p>Walk-in request is waiting for a response.</p></div><button className="security-modal-close" type="button" onClick={() => setModal('')} aria-label="Close"><X size={15} /></button></div><div className="security-result-card"><strong>{nextApproval.visitor_name}</strong><small>{nextApproval.purpose} · {nextApproval.unit_number}</small><small>Waiting until {friendlyDate(nextApproval.expires_at)}</small></div><button className="security-secondary-action" type="button" onClick={() => window.location.assign(`tel:${nextApproval.resident_phone}`)}>Call resident</button><button className="security-danger-action" type="button" disabled={!isSupervisor} onClick={() => notify('Supervisor override requires a logged reason.', 'error')}>Supervisor override</button></div></div>
    if (modal === 'handover') return <div className="security-modal-backdrop"><form className="security-modal" onSubmit={submitHandover}><div className="security-modal-head"><div><h2>Hand over shift</h2><p>The next guard must accept the handover.</p></div><button className="security-modal-close" type="button" onClick={() => setModal('')} aria-label="Close"><X size={15} /></button></div><label>Handover notes<textarea value={handoverNotes} onChange={(event) => setHandoverNotes(event.target.value)} minLength={5} maxLength={2000} required placeholder="Incidents, expected visitors, patrol notes" /></label><button className="security-primary-action" type="submit" disabled={draftBusy}>Submit handover</button></form></div>
    return null
  }

  return (
    <main className="security-stage">
      <div className="security-shell">
        <header className="security-header"><div className="security-brand"><span className="security-brand-mark"><Shield size={15} /></span>Peaceville Security</div><div className="security-header-right"><span className={`security-duty-chip${home?.shift?.status !== 'active' ? ' off' : ''}`}>{home?.shift?.status === 'active' ? 'On duty' : 'Off duty'}</span><button className="security-profile-button" type="button" aria-label="Profile" onClick={() => switchTab('Profile')}><Shield size={15} /></button></div></header>
        <div className="security-content">
          {loading && !home ? <div className="security-empty">Loading your gate assignment…</div> : <>
            {modal === 'clearance' ? renderClearance() : activeTab === 'Gate' ? renderGate() : activeTab === 'Visitors' ? renderVisitors() : activeTab === 'Incidents' ? renderIncidents() : activeTab === 'Patrol' ? renderPatrol() : renderProfile()}
          </>}
        </div>
        <nav className="security-bottom-nav" aria-label="Security dashboard navigation">{tabs.map(({ id, icon: Icon }) => <button className={activeTab === id ? 'active' : ''} key={id} type="button" onClick={() => void switchTab(id)}><Icon size={17} /><span>{id}</span></button>)}</nav>
        {renderModal()}
        {toast && <div className={`security-toast${toast.type === 'error' ? ' error' : ''}`} role="status">{toast.message}</div>}
      </div>
    </main>
  )
}

export default SecurityDashboardPage
