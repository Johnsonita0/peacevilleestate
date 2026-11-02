import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, Megaphone, Pause, Play, Plus, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import '../css/admin-dashboard.css'

function EstateAdsPage({ onNavigate }) {
  const { session } = useAuth()
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ title: '', partner_name: '', summary: '', destination_url: '', ends_at: '' })

  async function loadAds() {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/resources/ads', { accessToken: session?.access_token })
      setAds(data ?? [])
    } catch (error) {
      console.error('Estate ads could not be loaded:', error)
      setAds([])
      setNotice('Estate ads could not be loaded. Check the API and database connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadAds() }, [session?.access_token])

  async function createAd(event) {
    event.preventDefault()
    if (!session?.access_token) {
      setNotice('Please sign in again before creating an ad.')
      return
    }

    setBusy(true)
    setNotice('')
    try {
      await api.post('/admin/resources/ads', {
      ...form,
      destination_url: form.destination_url || null,
      starts_at: new Date().toISOString(),
      ends_at: form.ends_at ? new Date(`${form.ends_at}T23:59:59`).toISOString() : null,
      status: 'active',
      }, { accessToken: session.access_token })
    } catch (error) {
      console.error('Estate ad creation failed:', error)
      setNotice('We could not create this ad. Please try again.')
      return
    } finally {
      setBusy(false)
    }
    setForm({ title: '', partner_name: '', summary: '', destination_url: '', ends_at: '' })
    setShowForm(false)
    setNotice('Ad created successfully.')
    await loadAds()
  }

  async function toggleAd(ad) {
    if (!session?.access_token) {
      setNotice('Please sign in again before updating an ad.')
      return
    }
    const nextStatus = ad.status === 'active' ? 'paused' : 'active'
    try {
      await api.patch(`/admin/resources/ads/${ad.id}`, { status: nextStatus }, { accessToken: session.access_token })
    } catch (error) {
      console.error('Estate ad update failed:', error)
      setNotice('We could not update this ad. Please try again.')
      return
    }
    setNotice(`Ad ${nextStatus}.`)
    await loadAds()
  }

  return (
    <section className="admin-workspace">
      <div className="admin-workspace-heading">
        <div>
          <button className="admin-back-button" type="button" onClick={() => onNavigate('Overview')}><ArrowLeft size={16} />Overview</button>
          <h1>Estate ads</h1>
          <p>Manage partner promotions shown to residents.</p>
        </div>
        <button className="admin-primary-button" type="button" onClick={() => setShowForm(true)}><Plus size={16} />Create ad</button>
      </div>

      {notice && <div className="admin-toast" role="status">{notice}</div>}

      {showForm && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}>
          <form className="admin-ad-form" onSubmit={createAd}>
            <div className="admin-form-heading"><div><h2>Create estate ad</h2><p>All fields except destination and end date are required.</p></div><button type="button" className="admin-icon-button" aria-label="Close" onClick={() => setShowForm(false)}><X size={18} /></button></div>
            <label>Ad title<input required maxLength={100} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>Partner or business<input required maxLength={100} value={form.partner_name} onChange={(event) => setForm({ ...form, partner_name: event.target.value })} /></label>
            <label>Short description<textarea required rows="3" maxLength={300} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></label>
            <label>Destination URL<input type="url" placeholder="https://" value={form.destination_url} onChange={(event) => setForm({ ...form, destination_url: event.target.value })} /></label>
            <label>End date<input type="date" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} /></label>
            <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Publish ad'}</button>
          </form>
        </div>
      )}

      <div className="admin-ad-list" aria-live="polite">
        {loading ? <p className="admin-empty-state">Loading ads…</p> : ads.length === 0 ? <p className="admin-empty-state">No estate ads yet. Create the first one.</p> : ads.map((ad) => (
          <article className="admin-ad-row" key={ad.id}>
            <span className="admin-ad-icon"><Megaphone size={18} /></span>
            <div className="admin-ad-copy"><strong>{ad.title}</strong><span>{ad.partner_name} · {ad.summary}</span><small>{ad.ends_at ? `Ends ${new Date(ad.ends_at).toLocaleDateString('en-NG')}` : 'No end date'} · {ad.status}</small></div>
            {ad.destination_url && <a className="admin-ad-link" href={ad.destination_url} target="_blank" rel="noreferrer" aria-label={`Open ${ad.partner_name} destination`}><ExternalLink size={16} /></a>}
            <button className="admin-secondary-button" type="button" onClick={() => toggleAd(ad)} disabled={busy}>{ad.status === 'active' ? <><Pause size={15} />Pause</> : <><Play size={15} />Activate</>}</button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default EstateAdsPage
