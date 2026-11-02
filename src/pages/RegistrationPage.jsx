import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, House } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import '../css/auth.css'

function RegistrationPage() {
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const token = searchParams.get('invite') || ''
  const completionStarted = useRef(false)
  const [invitation, setInvitation] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '', password: '' })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [complete, setComplete] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    if (!token) {
      setNotice('This registration link is invalid or incomplete.')
      setLoading(false)
      return undefined
    }
    api.get(`/registrations/invitations/${encodeURIComponent(token)}`)
      .then((data) => { if (active) setInvitation(data) })
      .catch((error) => {
        console.error('Registration invitation could not be loaded:', error)
        if (active) setNotice('This registration link is invalid, expired, or already used.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (!session?.access_token || !token || !invitation || completionStarted.current) return
    completionStarted.current = true
    setSubmitting(true)
    api.post('/registrations/complete', { token }, { accessToken: session.access_token })
      .then(async () => {
        setComplete(true)
        setNotice('Your registration was submitted. Estate management will review and activate your account.')
        await supabase?.auth.signOut()
      })
      .catch((error) => {
        console.error('Registration could not be completed:', error)
        completionStarted.current = false
        setNotice('We could not submit your registration. Make sure you confirmed the invited email address and try again.')
      })
      .finally(() => setSubmitting(false))
  }, [session?.access_token, token, invitation])

  async function submitRegistration(event) {
    event.preventDefault()
    if (!supabase || !invitation) {
      setNotice('Registration is temporarily unavailable. Please contact estate management.')
      return
    }
    setSubmitting(true)
    setNotice('')
    try {
      if (profilePhoto) {
        const upload = await api.post('/registrations/invitations/upload-url', {
          token,
          content_type: profilePhoto.type,
        })
        const { error: uploadError } = await supabase.storage.from('registration-uploads')
          .uploadToSignedUrl(upload.path, upload.token, profilePhoto, { contentType: profilePhoto.type })
        if (uploadError) throw uploadError
      }
      const { data, error } = await supabase.auth.signUp({
        email: invitation.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name.trim(), phone: form.phone.trim() },
          emailRedirectTo: `${window.location.origin}/register?invite=${encodeURIComponent(token)}`,
        },
      })
      if (error) throw error
      if (data.session) {
        completionStarted.current = true
        await api.post('/registrations/complete', { token }, { accessToken: data.session.access_token })
        setComplete(true)
        setNotice('Your registration was submitted. Estate management will review and activate your account.')
        await supabase.auth.signOut()
      } else {
        setNotice('Check your invited email and confirm the address to submit your registration for approval.')
      }
    } catch (error) {
      completionStarted.current = false
      console.error('Registration submission failed:', error)
      setNotice('We could not submit your registration. Check your details and try again, or contact estate management.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-stage">
      <section className="auth-screen" aria-labelledby="registration-title">
        <div className="auth-content">
          <span className="auth-logo" aria-hidden="true"><House size={23} strokeWidth={1.8} /></span>
          <header className="auth-heading">
            <h1 id="registration-title">{complete ? 'Registration received' : 'Join Peaceville'}</h1>
            <p>{complete ? 'Your account is waiting for administrator approval.' : 'Complete the details for your invited estate account.'}</p>
          </header>
          {loading ? <p className="auth-notice" role="status">Checking registration link…</p> : complete ? (
            <div className="registration-success"><Check size={24} /><strong>Submitted for approval</strong><span>You can sign in after estate management activates your account.</span></div>
          ) : invitation ? (
            <form className="auth-form" onSubmit={submitRegistration}>
              <div className="registration-role-summary"><span>Invited account</span><strong>{invitation.role.replaceAll('_', ' ')}</strong><small>{invitation.assignment ? `${invitation.assignment} · ` : ''}Expires {new Date(invitation.expires_at).toLocaleDateString('en-NG')}</small></div>
              <label className="auth-field"><span>Email address</span><input type="email" value={invitation.email} readOnly aria-readonly="true" /></label>
              <label className="auth-field"><span>Full name</span><input autoComplete="name" maxLength={120} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required /></label>
              <label className="auth-field"><span>Phone number</span><input type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></label>
              <label className="auth-field"><span>Profile photo (optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)} /></label>
              <label className="auth-field"><span>Create password</span><input type="password" autoComplete="new-password" minLength={10} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
              <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit registration'}</button>
            </form>
          ) : null}
          {notice && !complete && <p className="auth-notice" role="alert">{notice}</p>}
        </div>
        <p className="auth-footnote">Your selected account type is set by estate management. Your access stays inactive until it is approved.</p>
      </section>
    </main>
  )
}

export default RegistrationPage
