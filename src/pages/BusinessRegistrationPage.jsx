import { useEffect, useState } from 'react'
import { Check, Store } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import '../css/auth.css'
import '../css/registration-assets.css'

const businessTypes = ['school', 'church', 'mosque', 'shop', 'company', 'other']

function BusinessRegistrationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('invite') || ''
  const [invitation, setInvitation] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'shop', location: '', contact_person: '', phone: '', website: '' })
  const [businessImage, setBusinessImage] = useState(null)
  const [contactPhoto, setContactPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [complete, setComplete] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    if (!token) {
      setNotice('This business registration link is invalid or incomplete.')
      setLoading(false)
      return undefined
    }
    api.get(`/registrations/business-invitations/${encodeURIComponent(token)}`)
      .then((data) => { if (active) setInvitation(data) })
      .catch((error) => {
        console.error('Business invitation could not be loaded:', error)
        if (active) setNotice('This business registration link is invalid, expired, or already used.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function uploadImage(file, imageType) {
    if (!file) return null
    if (!supabase) throw new Error('Image uploads are not configured.')
    if (file.size > 8 * 1024 * 1024) throw new Error('Images must be 8 MB or smaller.')
    const upload = await api.post('/registrations/business-invitations/upload-url', {
      token,
      image_type: imageType,
      content_type: file.type,
    })
    const { error } = await supabase.storage.from('business-images')
      .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type })
    if (error) throw error
    return upload.path
  }

  async function submitRegistration(event) {
    event.preventDefault()
    setSubmitting(true)
    setNotice('')
    try {
      const [imagePath, contactPhotoPath] = await Promise.all([
        uploadImage(businessImage, 'business'),
        uploadImage(contactPhoto, 'contact'),
      ])
      await api.post('/registrations/business-invitations/complete', {
        token,
        ...form,
        compound_id: invitation.compound_id,
        unit_id: invitation.unit_id,
        image_path: imagePath,
        contact_photo_path: contactPhotoPath,
      })
      setComplete(true)
      setNotice('Your business profile has been submitted for estate approval.')
    } catch (error) {
      console.error('Business registration submission failed:', error)
      setNotice(error?.message || 'We could not submit your business profile. Check the details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-stage public-registration-stage">
      <section className="auth-screen business-registration-screen" aria-labelledby="business-registration-title">
        <div className="auth-content">
          <span className="auth-logo" aria-hidden="true"><Store size={23} strokeWidth={1.8} /></span>
          <header className="auth-heading">
            <h1 id="business-registration-title">{complete ? 'Profile received' : 'Register your business'}</h1>
            <p>{complete ? 'Estate management will review your submission.' : 'Complete this form to join the Peaceville business directory.'}</p>
          </header>
          {loading ? <p className="auth-notice" role="status">Checking invitation…</p> : complete ? (
            <div className="registration-success"><Check size={24} /><strong>Submitted for approval</strong><span>Your business will appear in the estate directory after review.</span></div>
          ) : invitation ? (
            <form className="auth-form" onSubmit={submitRegistration}>
              <div className="registration-role-summary"><span>Business invitation</span><strong>{invitation.assignment || 'Peaceville Estate'}</strong><small>Expires {new Date(invitation.expires_at).toLocaleDateString('en-NG')}</small></div>
              <label className="auth-field"><span>Invitation email</span><input type="email" value={invitation.email} readOnly aria-readonly="true" /></label>
              <label className="auth-field"><span>Business name</span><input name="name" autoComplete="organization" maxLength={160} value={form.name} onChange={updateField} required /></label>
              <label className="auth-field"><span>Business type</span><select name="type" value={form.type} onChange={updateField}>{businessTypes.map((type) => <option value={type} key={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
              <label className="auth-field"><span>Business location</span><input name="location" maxLength={240} value={form.location} onChange={updateField} required /></label>
              <label className="auth-field"><span>Contact person</span><input name="contact_person" autoComplete="name" maxLength={120} value={form.contact_person} onChange={updateField} /></label>
              <label className="auth-field"><span>Phone number</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={updateField} required /></label>
              <label className="auth-field"><span>Website (optional)</span><input name="website" type="url" maxLength={240} value={form.website} onChange={updateField} /></label>
              <label className="auth-field"><span>Business image (optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setBusinessImage(event.target.files?.[0] ?? null)} /></label>
              <label className="auth-field"><span>Contact person profile photo (optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setContactPhoto(event.target.files?.[0] ?? null)} /></label>
              <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit for approval'}</button>
            </form>
          ) : null}
          {notice && !complete && <p className="auth-notice" role="alert">{notice}</p>}
        </div>
        <p className="auth-footnote">Your information is shared with Peaceville estate management for registration and approval.</p>
      </section>
    </main>
  )
}

export default BusinessRegistrationPage