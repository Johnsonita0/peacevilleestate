import { useState } from 'react'
import { House } from 'lucide-react'
import '../css/auth.css'

function SignInPage({ apiOnline }) {
  const [mode, setMode] = useState('signin')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [notice, setNotice] = useState('')

  function changeMode(nextMode) {
    setNotice('')
    setMode(nextMode)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!apiOnline) {
      setNotice('The service is temporarily unavailable. Please try again shortly.')
      return
    }
    setNotice('Sign-in will be available when the Supabase project is connected.')
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
              {isInvitation ? 'Join Peaceville' : isReset ? 'Reset your password' : 'Welcome to Peaceville'}
            </h1>
            <p>
              {isInvitation
                ? 'Enter the invitation code shared by your estate management.'
                : isReset
                  ? 'Enter your phone or email and we will help you regain access.'
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
                  <span>Phone or email</span>
                  <input
                    type="text"
                    autoComplete="username"
                    inputMode="email"
                    value={emailOrPhone}
                    onChange={(event) => setEmailOrPhone(event.target.value)}
                    placeholder="08012345678"
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

            <button className="auth-submit" type="submit">
              {isInvitation ? 'Continue' : isReset ? 'Send reset link' : 'Sign in'}
            </button>

            {mode === 'signin' ? (
              <button className="auth-secondary" type="button" onClick={() => changeMode('invitation')}>
                I have an invitation code
              </button>
            ) : (
              <button className="auth-text-button auth-back" type="button" onClick={() => changeMode('signin')}>
                Back to sign in
              </button>
            )}

            {notice && <p className="auth-notice" role="status">{notice}</p>}
          </form>
        </div>

        <p className="auth-footnote">Accounts are created by estate management. Never share your password or codes.</p>
      </section>
    </main>
  )
}

export default SignInPage
