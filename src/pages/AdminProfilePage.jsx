import ProfilePhotoUpload from '../components/ProfilePhotoUpload'
import { useAuth } from '../auth/AuthProvider'
import '../css/admin-dashboard.css'
import '../css/admin-workspace.css'

function AdminProfilePage() {
  const { profile } = useAuth()
  return (
    <section className="admin-workspace">
      <div className="admin-workspace-heading">
        <div><h1>Administrator profile</h1><p>Account identity and profile photo.</p></div>
      </div>
      <div className="admin-profile-card">
        <ProfilePhotoUpload />
        <dl>
          <div><dt>Role</dt><dd>{profile?.role?.replaceAll('_', ' ')}</dd></div>
          <div><dt>Account status</dt><dd>{profile?.status}</dd></div>
        </dl>
      </div>
    </section>
  )
}

export default AdminProfilePage
