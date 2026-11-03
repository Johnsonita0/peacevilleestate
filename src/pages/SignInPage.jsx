import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { House } from 'lucide-react'
import { dashboardPathForRole, useAuth } from '../auth/AuthProvider'
import '../css/auth.css'

function SignInPage({ portal = 'resident' }) {
  const [mode, setMode] = useState('signin')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const isAdminPortal = portal === 'admin'
  const isBusinessPortal = portal === 'business'

  function updateIdentifier(value) {
    if (isAdminPortal || isBusinessPortal) {
      setIdentifier(value)
      return
    }

    const phoneCharacters = value.replace(/[^\d+]/g, '')
    setIdentifier(phoneCharacters.startsWith('+')
      ? `+${phoneCharacters.slice(1).replace(/\+/g, '')}`
      : phoneCharacters.replace(/\+/g, ''))
  }

  function changeMode(nextMode) {
    setNotice('')
    setMode(nextMode)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')

    if (mode === 'invitation') {
      if (isBusinessPortal && invitationCode.trim()) {
        navigate(`/business-register?invite=${encodeURIComponent(invitationCode.trim())}`)
        return
      }
      setNotice('Invitation verification will be available when registration is connected.')
      return
    }
    if (mode === 'reset') {
      setNotice('For account recovery, contact estate management until password recovery is configured.')
      return
    }

    setIsSubmitting(true)
    try {
      const profile = await signIn({ identifier, password, portal })
      navigate(dashboardPathForRole(profile.role), { replace: true })
    } catch (error) {
      console.error('Sign-in failed:', error)
      setNotice('We could not sign you in. Please check your details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isInvitation = mode === 'invitation'
  const isReset = mode === 'reset'

  return (
    <main className="auth-stage">
      <section className="auth-screen" aria-labelledby="auth-title">
        <div className="auth-content">
          <span className="auth-logo" aria-hidden="true"><House size={23} strokeWidth={1.8} /></span>

          <header className="auth-heading">
            <h1 id="auth-title">
              {isInvitation
                ? 'Join Peaceville'
                : isReset
                  ? 'Reset your password'
                  : isAdminPortal
                    ? 'Administrator sign in'
                    : 'Welcome to Peaceville'}
            </h1>
                <p>
                    {isInvitation
                ? 'Enter the invitation code shared by your estate management.'
                : isReset
                        ? `Enter your ${isAdminPortal ? 'email' : isBusinessPortal ? 'phone number or email' : 'phone number'} to recover your account.`
                  : isAdminPortal
                    ? 'Authorized estate administrators only. Sign in with your registered email.'
                          : isBusinessPortal
                            ? 'Sign in to manage your business levy, visitors and estate notices.'
                            : 'Sign in to pay levies, invite visitors and stay informed.'}
            </p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isInvitation ? (
              <label className="auth-field">
                <span>Invitation code</span>
                <input
                  autoComplete="one-time-code"
                  value={invitationCode}
                  onChange={(event) => setInvitationCode(event.target.value)}
                  placeholder="Enter your code"
                  required
                />
              </label>
            ) : (
              <>
                <label className="auth-field">
                  <span>{isAdminPortal ? 'Email address' : isBusinessPortal ? 'Phone number or email' : 'Phone number'}</span>
                  <input
                    type={isAdminPortal ? 'email' : isBusinessPortal ? 'text' : 'tel'}
                    autoComplete={isAdminPortal ? 'email' : isBusinessPortal ? 'username' : 'tel-national'}
                    inputMode={isAdminPortal ? 'email' : isBusinessPortal ? 'text' : 'tel'}
                    value={identifier}
                    onChange={(event) => updateIdentifier(event.target.value)}
                    placeholder={isAdminPortal ? 'admin@peaceville.ng' : isBusinessPortal ? 'Phone number or business email' : '08012345678'}
                    pattern={isAdminPortal || isBusinessPortal ? undefined : '\\+?[0-9]{10,15}'}
                    minLength={isAdminPortal || isBusinessPortal ? undefined : 10}
                    maxLength={isAdminPortal || isBusinessPortal ? undefined : 120}
                    required
                  />
                </label>
                {!isReset && (
                  <label className="auth-field">
                    <span>Password</span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Your password"
                      required
                    />
                  </label>
                )}
              </>
            )}

            {mode === 'signin' && (
              <button className="auth-text-button forgot-link" type="button" onClick={() => changeMode('reset')}>
                Forgot password?
              </button>
            )}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isInvitation ? 'Continue' : isReset ? 'Send reset link' : isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            {mode === 'signin' && !isAdminPortal ? (
              <button className="auth-secondary" type="button" onClick={() => isBusinessPortal ? changeMode('invitation') : changeMode('invitation')}>
                I have an invitation code
              </button>
            ) : mode !== 'signin' ? (
              <button className="auth-text-button auth-back" type="button" onClick={() => changeMode('signin')}>
                Back to sign in
              </button>
            ) : null}

            {notice && <p className="auth-notice" role="alert">{notice}</p>}
          </form>
        </div>

        <p className="auth-footnote">
          {isAdminPortal
            ? 'Administrator access is limited to authorized estate management.'
            : isBusinessPortal
              ? 'Business accounts are invited by estate management. Never share your password or codes.'
              : 'Accounts are created by estate management. Never share your password or codes.'}
        </p>
      </section>
    </main>
  )
}

export default SignInPage
