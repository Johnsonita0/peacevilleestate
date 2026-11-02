import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { getProfilePhotoUrl, removeProfilePhoto, uploadProfilePhoto } from '../lib/profilePhotos'
import '../css/profile-photo.css'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'
}

function ProfilePhotoUpload({ compact = false }) {
  const inputRef = useRef(null)
  const { profile, refreshProfile } = useAuth()
  const [photoUrl, setPhotoUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getProfilePhotoUrl(profile?.profile_photo_path).then((url) => {
      if (active) setPhotoUrl(url)
    })
    return () => { active = false }
  }, [profile?.profile_photo_path])

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !profile) return

    setBusy(true)
    setError('')
    const previousPath = profile.profile_photo_path
    try {
      await uploadProfilePhoto(file, profile.id)
      const refreshedProfile = await refreshProfile()
      setPhotoUrl(await getProfilePhotoUrl(refreshedProfile.profile_photo_path))
      if (previousPath) await removeProfilePhoto(previousPath, profile.id)
    } catch (uploadError) {
      console.error('Profile photo upload failed:', uploadError)
      setError('We could not update this photo. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const name = profile?.full_name || 'Your profile'

  return (
    <div className={`profile-photo-uploader${compact ? ' compact' : ''}`}>
      <input
        ref={inputRef}
        className="profile-photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose profile photo"
        onChange={handleFileChange}
      />
      <button
        className="profile-photo-button"
        type="button"
        aria-label={busy ? 'Uploading profile photo' : 'Change profile photo'}
        title={busy ? 'Uploading profile photo' : 'Change profile photo'}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <span className="profile-photo-avatar">
          {photoUrl ? <img src={photoUrl} alt="" /> : <span>{initials(name)}</span>}
        </span>
        {!compact && (
          <span className="profile-photo-copy">
            <strong>{name}</strong>
            <small>{busy ? 'Uploading photo…' : 'Change profile photo'}</small>
          </span>
        )}
        <Camera className="profile-photo-camera" size={compact ? 16 : 15} />
      </button>
      {error && <span className="profile-photo-error" role="alert">{error}</span>}
    </div>
  )
}

export default ProfilePhotoUpload
