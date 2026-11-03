import { useEffect, useMemo, useState } from 'react'
import { Download, Filter, Plus, Search, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import '../css/admin-dashboard.css'
import '../css/admin-workspace.css'
import '../css/admin-form-controls.css'

const sectionConfig = {
  Residents: { description: 'Resident register and household access.', add: 'Invite account', tabs: ['All', 'Landlords', 'Tenants', 'Pending'], table: 'profiles' },
  Visitors: { description: 'Visitor requests, arrivals and gate activity.', tabs: ['All', 'pending', 'approved', 'arrived'], table: 'visitors' },
  Payments: { description: 'Collection, receipts and provider verification.', tabs: ['All', 'pending', 'successful', 'failed'], table: 'levy_payments' },
  Security: { description: 'Incident response and guard activity.', tabs: ['All', 'open', 'investigating', 'resolved'], table: 'incidents' },
  'Levies and fees': { description: 'Amounts and due dates by estate or compound.', add: 'Add levy', table: 'levies' },
  Announcements: { description: 'Notices for residents and compounds.', add: 'New announcement', tabs: ['All', 'draft', 'published', 'archived'], table: 'announcements' },
  Meetings: { description: 'Schedule meetings and track attendance.', add: 'Schedule meeting', table: 'meetings' },
  'Compounds and units': { description: 'Create a compound and its numbered units together.', add: 'Add compound + units', table: 'compounds' },
  'Staff and roles': { description: 'Administrators, representatives and guards.', add: 'Add staff member', table: 'compound_staff' },
  'Businesses and institutions': { description: 'Schools, churches, shops and companies managed by the estate.', add: 'Invite business', tabs: ['All', 'pending', 'active', 'suspended'], table: 'businesses' },
  'Commercial levy rates': { description: 'Standard levy rates by business and institution type.', add: 'Add levy rate', table: 'commercial_levy_rates' },
  'Audit log': { description: 'A read-only record of administrative activity.', tabs: ['All', 'Payments', 'Access', 'Residents'], table: 'audit_logs' },
  Settings: { description: 'Estate access, session, and notification settings.', table: 'estate_settings' },
}

const resourceBySection = {
  Residents: 'residents', Visitors: 'visitors', Payments: 'payments', Security: 'incidents',
  'Levies and fees': 'levies', Announcements: 'announcements', Meetings: 'meetings',
  'Compounds and units': 'compounds', 'Staff and roles': 'staff',
  'Businesses and institutions': 'businesses', 'Commercial levy rates': 'rates',
  'Audit log': 'audit', Settings: 'settings',
}

const estateTypeOptions = ['residential', 'mixed_use', 'church', 'school', 'shop', 'office', 'clinic', 'restaurant', 'warehouse', 'other']
const unitTypeOptions = ['house', 'apartment', 'residential', 'church', 'school', 'shop', 'office', 'clinic', 'restaurant', 'warehouse', 'other']
const primarySuperAdminId = '0adc9938-2343-4f7c-b4d7-5b1df229c7c5'

function displayRow(section, row) {
  if (section === 'Residents') return { id: row.id, name: row.full_name || row.email || row.phone || 'Resident', location: row.phone || row.email || 'Household not assigned', status: row.status, amount: row.role?.replaceAll('_', ' ') }
  if (section === 'Visitors') return { id: row.id, name: row.visitor_name, location: row.purpose || 'Visitor request', status: row.status, amount: row.visitor_phone }
  if (section === 'Payments') return { id: row.id, name: row.reference, location: row.resident_id, status: row.status, amount: `₦${Number(row.amount).toLocaleString('en-NG')}` }
  if (section === 'Security') return { id: row.id, name: row.incident_type, location: row.description, status: row.status }
  if (section === 'Levies and fees') return { id: row.id, name: row.title, location: row.due_date ? `Due ${new Date(row.due_date).toLocaleDateString('en-NG')}` : row.description, status: row.status, amount: `₦${Number(row.amount).toLocaleString('en-NG')}` }
  if (section === 'Announcements') return { id: row.id, name: row.title, location: row.body, status: row.status }
  if (section === 'Meetings') return { id: row.id, name: row.title, location: row.description, status: new Date(row.starts_at).toLocaleString('en-NG') }
  if (section === 'Compounds and units') return { id: row.id, name: row.name, location: `${row.address || 'No address'}${row.estate_type ? ` · ${row.estate_type.replaceAll('_', ' ')}` : ''}`, status: row.status }
  if (section === 'Businesses and institutions') return { id: row.id, name: row.name, location: `${row.location || 'Location not set'} · ${row.type || 'Entity'}${row.status ? ` · ${row.status}` : ''}`, status: row.status, amount: row.type }
  if (section === 'Commercial levy rates') return { id: row.id, name: row.entity_type || row.name || 'Rate', location: row.cycle ? `${row.cycle} cycle` : 'Standard rate', status: row.status || 'Active', amount: `₦${Number(row.rate_amount || row.amount || 0).toLocaleString('en-NG')}` }
  return { id: row.id, name: row.action?.replaceAll('_', ' '), location: row.target_table, status: new Date(row.created_at).toLocaleString('en-NG') }
}

const addFields = {
  Residents: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'role', label: 'Account type', type: 'select', options: ['tenant', 'landlord', 'compound_rep', 'compound_security', 'estate_security', 'estate_admin'] },
    { name: 'compound_id', label: 'Compound', type: 'select', required: true },
    { name: 'unit_id', label: 'Home unit', type: 'select', required: true },
    { name: 'gate', label: 'Assigned gate', required: true },
  ],
  'Staff and roles': [{ name: 'user_id', label: 'Staff account', type: 'select', required: true }, { name: 'compound_id', label: 'Compound', type: 'select', required: true }, { name: 'staff_role', label: 'Staff role', type: 'select', options: ['compound_security', 'estate_security', 'compound_rep'] }, { name: 'duty_status', label: 'Duty status', type: 'select', options: ['off_duty', 'on_duty', 'on_break'] }, { name: 'gate', label: 'Gate or post' }],
  'Levies and fees': [{ name: 'title', label: 'Levy name', required: true }, { name: 'amount', label: 'Amount (₦)', type: 'number', required: true }, { name: 'due_date', label: 'Due date', type: 'date' }, { name: 'description', label: 'Description' }, { name: 'compound_id', label: 'Compound (optional)', type: 'select' }],
  Announcements: [{ name: 'title', label: 'Title', required: true }, { name: 'body', label: 'Message', type: 'textarea', required: true }, { name: 'scope', label: 'Audience', type: 'select', options: ['estate', 'compound'] }, { name: 'compound_id', label: 'Compound', type: 'select' }],
  Meetings: [{ name: 'title', label: 'Meeting title', required: true }, { name: 'starts_at', label: 'Date and time', type: 'datetime-local', required: true }, { name: 'description', label: 'Location or details' }, { name: 'compound_id', label: 'Compound (optional)', type: 'select' }],
  'Compounds and units': [
    { name: 'name', label: 'Compound or block name', required: true },
    { name: 'address', label: 'Address' },
    { name: 'estate_type', label: 'Estate type', type: 'select', options: estateTypeOptions },
    { name: 'unit_type', label: 'Default unit type', type: 'select', options: unitTypeOptions },
    { name: 'unit_count', label: 'Number of units', type: 'number', required: true },
    { name: 'image', label: 'Compound image (optional)', type: 'file' },
  ],
  'Businesses and institutions': [
    { name: 'email', label: 'Business contact email', type: 'email', required: true },
    { name: 'compound_id', label: 'Compound (optional)', type: 'select' },
    { name: 'unit_id', label: 'Unit (optional)', type: 'select' },
  ],
  'Commercial levy rates': [
    { name: 'entity_type', label: 'Entity type', type: 'select', options: ['school', 'church', 'mosque', 'shop', 'company', 'other'] },
    { name: 'rate_amount', label: 'Rate amount (₦)', type: 'number', required: true },
    { name: 'cycle', label: 'Billing cycle', type: 'select', options: ['annual', 'quarterly', 'monthly'] },
  ],
}

function AdminWorkspacePage({ section, onNavigate }) {
  const { session } = useAuth()
  const isPrimarySuperAdmin = session?.user?.id === primarySuperAdminId
  const config = sectionConfig[section] ?? { description: 'Estate management workspace.' }
  const [rows, setRows] = useState([])
  const [availableUnits, setAvailableUnits] = useState([])
  const [availableStaff, setAvailableStaff] = useState([])
  const [availableCompounds, setAvailableCompounds] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({})
  const [notice, setNotice] = useState('')
  const [registrationLink, setRegistrationLink] = useState('')
  const [invitationEmail, setInvitationEmail] = useState('')
  const [invitationEmailSent, setInvitationEmailSent] = useState(false)
  const [invitationEmailError, setInvitationEmailError] = useState('')
  const [compoundImage, setCompoundImage] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    let mounted = true
    const resourceName = resourceBySection[section]
    if (!resourceName || !session?.access_token) {
      setRows([])
      setLoading(false)
      return () => { mounted = false }
    }

    setLoading(true)
    api.get(`/admin/resources/${resourceName}`, { accessToken: session.access_token })
      .then(async ({ data }) => {
        if (!mounted) return
        setRows((data ?? []).map((row) => displayRow(section, row)))
        if (section === 'Settings') setSettings(data?.[0] ?? null)
        if (['Residents', 'Businesses and institutions'].includes(section)) {
          try {
            const unitsResult = await api.get('/admin/resources/units', { accessToken: session.access_token })
            if (mounted) setAvailableUnits(unitsResult.data ?? [])
          } catch (error) {
            console.error('Resident invitation units could not be loaded:', error)
          }
        }
        if (['Residents', 'Staff and roles', 'Levies and fees', 'Announcements', 'Meetings', 'Businesses and institutions'].includes(section)) {
          const compoundResult = await api.get('/admin/resources/compounds', { accessToken: session.access_token })
          if (mounted) setAvailableCompounds(compoundResult.data ?? [])
          if (section === 'Staff and roles') {
            const staffResult = await api.get('/admin/resources/residents', { accessToken: session.access_token })
            if (mounted) setAvailableStaff((staffResult.data ?? []).filter((item) => item.status === 'active'))
          }
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error(`Admin ${section} data could not be loaded:`, error)
        if (mounted) {
          setRows([])
          setNotice(error?.payload?.error === 'AUTH_CONFIGURATION_MISSING'
            ? 'Supabase is not configured for the API. Set the backend environment values and restart it.'
            : 'Live estate data could not be loaded. Check the API and database connection.')
          setLoading(false)
        }
      })

    return () => { mounted = false }
  }, [section, config.table, session?.access_token])

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesText = !query || `${row.name} ${row.location} ${row.status} ${row.amount}`.toLowerCase().includes(query.toLowerCase())
    const matchesTab = tab === 'All'
      || (section === 'Residents' && ['Landlords', 'Tenants'].includes(tab) ? row.amount === tab.slice(0, -1).toLowerCase() : row.status?.toLowerCase() === tab.toLowerCase())
    return matchesText && matchesTab
  }), [rows, query, tab, section])
  const formUnits = form.compound_id
    ? availableUnits.filter((unit) => unit.compound_id === form.compound_id)
    : availableUnits

  async function submitForm(event) {
    event.preventDefault()
    const resourceName = resourceBySection[section]
    if (!resourceName || !session?.access_token) {
      setNotice('Please sign in again before saving this change.')
      return
    }

    const values = { ...form }
    if (section === 'Residents') {
      values.role = values.role || 'tenant'
      if (['tenant', 'landlord', 'compound_rep'].includes(values.role)) {
        values.unit_id = values.unit_id || formUnits[0]?.id
        delete values.compound_id
      }
      if (['compound_security', 'estate_security'].includes(values.role)) values.compound_id = values.compound_id || availableCompounds[0]?.id
    }
    if (section === 'Levies and fees') values.amount = Number(values.amount)
    if (section === 'Meetings') values.starts_at = new Date(values.starts_at).toISOString()
    if (section === 'Announcements') {
      values.status = 'published'
      values.published_at = new Date().toISOString()
      if (values.scope === 'estate') values.compound_id = null
    }
    if (['Levies and fees', 'Meetings'].includes(section) && !values.compound_id) values.compound_id = null
    if (section === 'Compounds and units') {
      values.status = values.status || 'active'
      values.estate_type = values.estate_type || 'residential'
      values.unit_type = values.unit_type || 'house'
      values.unit_count = Number(values.unit_count)
    }
    if (section === 'Businesses and institutions') {
      values.type = values.type || 'school'
      values.status = 'pending'
      if (values.unit_id && !values.compound_id) {
        values.compound_id = availableUnits.find((unit) => unit.id === values.unit_id)?.compound_id
      }
    }
    if (section === 'Commercial levy rates') {
      values.rate_amount = Number(values.rate_amount)
      values.status = 'active'
    }

    let result
    let followUpNotice = ''
    try {
      if (section === 'Residents') {
        result = await api.post('/admin/accounts/invitations', values, { accessToken: session.access_token })
      } else if (section === 'Businesses and institutions') {
        result = await api.post('/admin/business-invitations', values, { accessToken: session.access_token })
      } else if (section === 'Compounds and units') {
        const { data: compound } = await api.post(`/admin/resources/${resourceName}`, values, { accessToken: session.access_token })
        if (compoundImage) {
          try {
            if (!supabase || compoundImage.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB.')
            const upload = await api.post(`/admin/compounds/${compound.id}/image-upload-url`, { content_type: compoundImage.type }, { accessToken: session.access_token })
            const { error } = await supabase.storage.from('compound-images')
              .uploadToSignedUrl(upload.path, upload.token, compoundImage, { contentType: compoundImage.type })
            if (error) throw error
            await api.patch(`/admin/resources/compounds/${compound.id}`, { image_path: upload.path }, { accessToken: session.access_token })
          } catch (error) {
            console.error('Compound image upload failed:', error)
            followUpNotice = 'Compound and units were created, but the image could not be uploaded. You can retry from the compound record.'
          }
        }
      } else {
        await api.post(`/admin/resources/${resourceName}`, values, { accessToken: session.access_token })
      }
    } catch (error) {
      console.error(`Failed to save ${section}:`, error)
      setNotice(error?.payload?.error === 'AUTH_CONFIGURATION_MISSING'
        ? 'Supabase is not configured for the API. Set the backend environment values and restart it.'
        : 'We could not save this change. Please try again.')
      return
    }

    setNotice(followUpNotice || (['Residents', 'Businesses and institutions'].includes(section) ? 'Registration invitation link created.' : 'Saved successfully.'))
    if (['Residents', 'Businesses and institutions'].includes(section)) {
      setRegistrationLink(result.registration_url)
      setInvitationEmail(result.email)
      setInvitationEmailSent(Boolean(result.email_sent))
      setInvitationEmailError(result.email_error || '')
    }
    setForm({})
    setCompoundImage(null)
    setShowForm(false)
    try {
      const { data } = await api.get(`/admin/resources/${resourceName}`, { accessToken: session.access_token })
      setRows((data ?? []).map((row) => displayRow(section, row)))
    } catch (error) {
      console.error(`Saved ${section} records could not be refreshed:`, error)
    }
  }

  async function updateResource(resourceName, recordId, values) {
    if (!session?.access_token) return
    try {
      await api.patch(`/admin/resources/${resourceName}/${recordId}`, values, { accessToken: session.access_token })
      setNotice('Updated successfully.')
      const { data } = await api.get(`/admin/resources/${resourceName}`, { accessToken: session.access_token })
      setRows((data ?? []).map((row) => displayRow(section, row)))
    } catch (error) {
      console.error(`Admin ${resourceName} update failed:`, error)
      setNotice('We could not save this update. Please try again.')
    }
  }

  async function updateSetting(field, value) {
    if (!session?.access_token) return
    try {
      const { data } = await api.patch('/admin/resources/settings/singleton', { [field]: value }, { accessToken: session.access_token })
      setSettings(data)
      setNotice('Settings saved.')
    } catch (error) {
      console.error('Estate settings update failed:', error)
      setNotice('We could not save this setting. Please try again.')
    }
  }

  async function verifyPayment(paymentId) {
    if (!session?.access_token) return
    try {
      await api.post(`/admin/payments/${paymentId}/verify`, {}, { accessToken: session.access_token })
      setNotice('Payment verified successfully.')
      const { data } = await api.get('/admin/resources/payments', { accessToken: session.access_token })
      setRows((data ?? []).map((row) => displayRow(section, row)))
    } catch (error) {
      console.error('Payment verification failed:', error)
      setNotice('We could not verify this payment. Please confirm the receipt and try again.')
    }
  }

  async function approveRegistration(userId) {
    if (!session?.access_token) return
    try {
      await api.post(`/admin/registrations/${userId}/approve`, {}, { accessToken: session.access_token })
      setNotice('Account approved and activated.')
      const { data } = await api.get('/admin/resources/residents', { accessToken: session.access_token })
      setRows((data ?? []).map((row) => displayRow('Residents', row)))
    } catch (error) {
      console.error('Account approval failed:', error)
      setNotice('We could not approve this account. Please refresh and try again.')
    }
  }

  async function approveBusiness(businessId) {
    if (!session?.access_token) return
    try {
      await api.post(`/admin/businesses/${businessId}/approve`, {}, { accessToken: session.access_token })
      setNotice('Business approved successfully.')
      const { data } = await api.get('/admin/resources/businesses', { accessToken: session.access_token })
      setRows((data ?? []).map((row) => displayRow('Businesses and institutions', row)))
    } catch (error) {
      console.error('Business approval failed:', error)
      setNotice(error.message || 'We could not approve this business. Refresh and try again.')
    }
  }

  function exportRows() {
    const csv = ['Name,Details,Status', ...filteredRows.map((row) => [row.name, row.location, row.status].map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `peaceville-${section.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function exportReport(reportName) {
    if (!session?.access_token) {
      setNotice('Please sign in again before exporting this report.')
      return
    }
    const reportKeys = {
      'Levy collection': 'levy-collection',
      'Visitor log': 'visitor-log',
      'Incident summary': 'incident-summary',
      'Resident register': 'resident-register',
    }
    try {
      const { data } = await api.get(`/admin/reports/${reportKeys[reportName]}`, { accessToken: session.access_token })
      const rows = data ?? []
      if (!rows.length) {
        setNotice('There are no records to export for this report.')
        return
      }
      const columns = Object.keys(rows[0])
      const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => `"${String(row[column] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `peaceville-${reportKeys[reportName]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`Report export failed (${reportName}):`, error)
      setNotice('We could not export this report. Please try again.')
    }
  }

  const canAdd = Boolean(config.add) && (!['Residents', 'Businesses and institutions'].includes(section) || isPrimarySuperAdmin)
  const formFields = addFields[section] ?? []

  return (
    <section className="admin-workspace">
      <div className="admin-workspace-heading">
        <div><h1>{section}</h1><p>{config.description}</p></div>
        <div className="admin-workspace-tools">
          {canAdd && <button className="admin-primary-button" type="button" disabled={loading} onClick={() => {
            const firstCompound = availableCompounds[0]
            const firstUnit = availableUnits.find((unit) => unit.compound_id === firstCompound?.id)
            setForm(section === 'Residents'
              ? { role: 'tenant', compound_id: firstCompound?.id ?? '', unit_id: firstUnit?.id ?? '' }
              : {})
            setShowForm(true)
          }}><Plus size={16} />{config.add}</button>}
        </div>
      </div>

      {notice && <div className="admin-toast" role="status">{notice}</div>}

      {registrationLink && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-ad-form" role="dialog" aria-modal="true" aria-labelledby="registration-link-title">
            <div className="admin-form-heading"><div><h2 id="registration-link-title">{section === 'Businesses and institutions' ? 'Business registration link ready' : 'Resident registration link ready'}</h2><p>{invitationEmailSent ? `Emailed to ${invitationEmail}; expires in 7 days.` : `${invitationEmailError || 'Email delivery is not configured.'} Share with ${invitationEmail}; the link expires in 7 days.`}</p></div><button type="button" className="admin-icon-button" aria-label="Close" onClick={() => setRegistrationLink('')}><X size={18} /></button></div>
            <label>Share this link<input readOnly value={registrationLink} onFocus={(event) => event.target.select()} /></label>
            <div className="admin-invitation-actions">
              <button className="admin-primary-button" type="button" onClick={async () => { try { await navigator.clipboard.writeText(registrationLink); setNotice('Registration link copied.') } catch (error) { console.error('Registration link copy failed:', error); setNotice('Copy is unavailable. Select and copy the link.') } }}>Copy link</button>
              <a className="admin-secondary-button" href={`mailto:${encodeURIComponent(invitationEmail)}?subject=${encodeURIComponent('Complete your Peaceville registration')}&body=${encodeURIComponent(`Use this secure link to complete your registration. It expires in 7 days:\n\n${registrationLink}`)}`}>Email invitation</a>
            </div>
          </div>
        </div>
      )}

      {config.tabs && (
        <div className="admin-filter-tabs" role="tablist" aria-label={`${section} filters`}>
          {config.tabs.map((item) => <button className={tab === item ? 'active' : ''} key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{item}</button>)}
        </div>
      )}

      {['Residents', 'Visitors', 'Payments', 'Security', 'Audit log', 'Businesses and institutions', 'Commercial levy rates'].includes(section) && (
        <label className="admin-workspace-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section.toLowerCase()}`} aria-label={`Search ${section}`} /><Filter size={15} /></label>
      )}

      {showForm && formFields.length > 0 && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}>
          <form className="admin-ad-form" onSubmit={submitForm}>
            <div className="admin-form-heading"><div><h2>{config.add}</h2><p>Required fields are marked in the form.</p></div><button type="button" className="admin-icon-button" aria-label="Close" onClick={() => setShowForm(false)}><X size={18} /></button></div>
            {formFields.filter((field) => field.name !== 'unit_id' || ['Residents', 'Businesses and institutions'].includes(section) || ['tenant', 'landlord', 'compound_rep'].includes(form.role ?? 'tenant')).filter((field) => field.name !== 'gate' || ['compound_security', 'estate_security'].includes(form.role)).filter((field) => field.name !== 'compound_id' || section !== 'Businesses and institutions' || availableCompounds.length > 0).filter((field) => field.name !== 'unit_id' || section !== 'Businesses and institutions' || availableUnits.length > 0).map((field) => (
              <label key={field.name}>{field.label}
                {field.name === 'compound_id' && section === 'Announcements' && form.scope !== 'compound' ? null : field.type === 'file'
                  ? <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCompoundImage(event.target.files?.[0] ?? null)} />
                  : field.type === 'textarea'
                  ? <textarea required={field.required} rows="3" value={form[field.name] ?? ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />
                  : field.type === 'select'
                    ? <select required={field.required || (field.name === 'compound_id' && section === 'Announcements' && form.scope === 'compound')} value={form[field.name] ?? (field.name === 'unit_id' ? '' : field.name === 'user_id' ? availableStaff[0]?.id ?? '' : field.name === 'compound_id' ? section === 'Announcements' || section === 'Residents' ? availableCompounds[0]?.id ?? '' : '' : field.options?.[0] ?? '')} onChange={(event) => setForm({ ...form, [field.name]: event.target.value, ...(field.name === 'compound_id' ? { unit_id: '' } : {}) })}>
                      {(field.name === 'unit_id'
                        ? [...(formUnits.length ? [{ value: '', label: field.required ? 'Choose a unit' : 'No unit' }] : [{ value: '', label: 'No units available', disabled: true }]), ...formUnits.map((unit) => ({ value: unit.id, label: `${unit.unit_number} · ${Array.isArray(unit.compounds) ? unit.compounds[0]?.name : unit.compounds?.name || unit.compound_id}` }))]
                        : field.name === 'user_id'
                          ? availableStaff.map((staff) => ({ value: staff.id, label: staff.full_name || staff.email || staff.phone }))
                          : field.name === 'compound_id'
                            ? [...(field.required ? (availableCompounds.length ? [] : [{ value: '', label: 'No compounds available', disabled: true }]) : [{ value: '', label: section === 'Announcements' ? 'All compounds' : 'No compound' }]), ...availableCompounds.map((compound) => ({ value: compound.id, label: compound.name }))]
                            : field.options.map((option) => ({ value: option, label: option }))).map((option) => <option value={option.value} key={option.value || 'none'} disabled={option.disabled}>{option.label}</option>)}
                    </select>
                    : <input type={field.type ?? 'text'} min={field.type === 'number' ? '0' : undefined} max={field.name === 'unit_count' ? '500' : undefined} required={field.required} value={form[field.name] ?? ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />}
              </label>
            ))}
            {section === 'Compounds and units' && <p className="admin-form-hint">Units are created automatically with numbers starting at 1. Enter 0 if this compound does not need units yet.</p>}
            {['Residents', 'Businesses and institutions'].includes(section) && (!availableCompounds.length || !availableUnits.length) && (
              <div className="admin-setup-prompt">
                <div><strong>Set up compounds and units first</strong><span>Choose a compound and numbered unit after the estate structure is created.</span></div>
                <button type="button" onClick={() => { setShowForm(false); onNavigate?.('Compounds and units') }}>Add compound + units</button>
              </div>
            )}
            {section === 'Residents' && <p className="admin-form-hint">The invited person completes their own details. Their account remains pending until an administrator approves it; only a super admin can invite another administrator.</p>}
            <button className="admin-primary-button" type="submit">Save</button>
          </form>
        </div>
      )}

      <div className="admin-record-list" aria-live="polite">
        {loading ? <p className="admin-empty-state">Loading {section.toLowerCase()}…</p> : filteredRows.length ? filteredRows.map((row) => (
          <article className="admin-record-row" key={row.id}>
            <span className="admin-record-avatar">{row.initials ?? row.name?.slice(0, 1)?.toUpperCase()}</span>
            <span className="admin-record-copy"><strong>{row.name}</strong><small>{row.location}{row.amount ? ` · ${row.amount}` : ''}</small></span>
            <span className={`admin-record-status status-${String(row.status).toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}>{row.status}</span>
            {section === 'Payments' && row.status === 'pending' && <button className="admin-record-action" type="button" onClick={() => verifyPayment(row.id)}>Verify</button>}
            {section === 'Residents' && isPrimarySuperAdmin && row.status === 'pending' && <button className="admin-record-action" type="button" onClick={() => approveRegistration(row.id)}>Approve</button>}
            {section === 'Visitors' && row.status === 'pending' && <button className="admin-record-action" type="button" onClick={() => updateResource('visitors', row.id, { status: 'approved' })}>Approve</button>}
            {section === 'Visitors' && row.status === 'arrived' && <button className="admin-record-action" type="button" onClick={() => updateResource('visitors', row.id, { status: 'departed' })}>Record exit</button>}
            {section === 'Security' && row.status === 'open' && <button className="admin-record-action" type="button" onClick={() => updateResource('incidents', row.id, { status: 'investigating' })}>Investigate</button>}
            {section === 'Security' && ['open', 'investigating'].includes(row.status) && <button className="admin-record-action" type="button" onClick={() => updateResource('incidents', row.id, { status: 'resolved' })}>Resolve</button>}
            {section === 'Businesses and institutions' && row.status === 'pending' && <button className="admin-record-action" type="button" onClick={() => approveBusiness(row.id)}>Approve</button>}
          </article>
        )) : <p className="admin-empty-state">No matching records.</p>}
      </div>

      {section === 'Settings' && (
        <div className="admin-settings-list">
          {[
            ['require_admin_mfa', 'Require MFA for admins', 'Extra code at sign-in'],
            ['idle_timeout_minutes', 'Auto sign-out after 15 minutes', 'Idle session protection'],
            ['notify_failed_logins', 'Notify on failed logins', 'Alert super admin'],
            ['push_notifications_enabled', 'Push notifications', 'Residents and guards'],
          ].map(([field, setting, description]) => <label className="admin-setting-row" key={field}><span><strong>{setting}</strong><small>{description}</small></span><input type={field === 'idle_timeout_minutes' ? 'number' : 'checkbox'} min={5} max={120} checked={field === 'idle_timeout_minutes' ? undefined : Boolean(settings?.[field])} value={field === 'idle_timeout_minutes' ? settings?.[field] ?? 15 : undefined} onChange={(event) => updateSetting(field, field === 'idle_timeout_minutes' ? Number(event.target.value) : event.target.checked)} /></label>)}
        </div>
      )}

      {section === 'Reports' && (
        <div className="admin-report-grid">
          {['Levy collection', 'Visitor log', 'Incident summary', 'Resident register'].map((report) => <button className="admin-report-card" key={report} type="button" onClick={() => exportReport(report)}><strong>{report}</strong><small>Export live estate records as CSV</small><Download size={16} /></button>)}
        </div>
      )}

      {section === 'Audit log' && <p className="admin-readonly-note">Entries cannot be edited or deleted.</p>}
    </section>
  )
}

export default AdminWorkspacePage
