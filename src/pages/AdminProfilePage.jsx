import { useState } from 'react'
import { KeyRound, LogOut, Save } from 'lucide-react'
import ProfilePhotoUpload from '../components/ProfilePhotoUpload'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import '../css/admin-dashboard.css'
import '../css/admin-workspace.css'
import '../css/admin-profile.css'

function AdminProfilePage({ onSignOut }) {
  const { profile, session, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function saveProfile(event) {
    event.preventDefault()
    const name = fullName.trim()
    if (!supabase || !profile?.id || !name) return

    setSavingProfile(true)
    setProfileMessage('')
    try {
      const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      setProfileMessage('Profile details saved.')
    } catch (error) {
      console.error('Administrator profile update failed:', error)
      setProfileMessage('We could not save your profile details. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setPasswordMessage('')
    if (newPassword !== confirmPassword) {
      setPasswordMessage('The passwords do not match.')
      return
    }
    if (!supabase) {
      setPasswordMessage('Password changes are unavailable right now.')
      return
    }

    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated.')
    } catch (error) {
      console.error('Administrator password update failed:', error)
      setPasswordMessage('We could not update your password. Please try again.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <section className="admin-workspace">
      <div className="admin-workspace-heading">
        <div><h1>Administrator profile</h1><p>Manage your account details and access.</p></div>
      </div>
      <div className="admin-profile-card">
        <div className="admin-profile-identity">
          <ProfilePhotoUpload />
          <dl>
            <div><dt>Role</dt><dd>{profile?.role?.replaceAll('_', ' ')}</dd></div>
            <div><dt>Account status</dt><dd>{profile?.status}</dd></div>
          </dl>
        </div>
        <form className="admin-profile-section" onSubmit={saveProfile}>
          <h2>Personal details</h2>
          <label className="admin-profile-field">
            <span>Full name</span>
            <input autoComplete="name" maxLength={120} required value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label className="admin-profile-field">
            <span>Email address</span>
            <input autoComplete="email" readOnly value={session?.user?.email || ''} />
          </label>
          <button className="admin-profile-action" type="submit" disabled={savingProfile || !fullName.trim()}>
            <Save size={16} />{savingProfile ? 'Saving…' : 'Save details'}
          </button>
          {profileMessage && <p className="admin-profile-message" role="status">{profileMessage}</p>}
        </form>
        <form className="admin-profile-section" onSubmit={changePassword}>
          <h2>Change password</h2>
          <label className="admin-profile-field">
            <span>New password</span>
            <input autoComplete="new-password" minLength={8} required type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </label>
          <label className="admin-profile-field">
            <span>Confirm new password</span>
            <input autoComplete="new-password" minLength={8} required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
          <button className="admin-profile-action" type="submit" disabled={savingPassword || !newPassword || !confirmPassword}>
            <KeyRound size={16} />{savingPassword ? 'Updating…' : 'Update password'}
          </button>
          {passwordMessage && <p className="admin-profile-message" role="status">{passwordMessage}</p>}
        </form>
        <div className="admin-profile-signout">
          <div><strong>Sign out</strong><span>End this administrator session on this device.</span></div>
          <button type="button" onClick={onSignOut}><LogOut size={16} />Sign out</button>
        </div>
      </div>
    </section>
  )
}

export default AdminProfilePage
