import { useEffect, useState } from 'react'
import { Bell, Search, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import ApiConnectionStatus from './ApiConnectionStatus'
import ProfilePhotoUpload from './ProfilePhotoUpload'
import '../css/admin-notifications.css'

function Topbar({ activeSection, onNavigate }) {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    let active = true
    async function loadNotifications() {
      if (!session?.access_token) return
      try {
        const { data } = await api.get('/admin/notifications', { accessToken: session.access_token })
        if (active) setNotifications(data ?? [])
      } catch (error) {
        console.error('Admin notifications could not be loaded:', error)
      }
    }
    void loadNotifications()
    const timer = window.setInterval(loadNotifications, 20000)
    return () => { active = false; window.clearInterval(timer) }
  }, [session?.access_token])

  async function openNotification(notification) {
    if (!session?.access_token) return
    if (!notification.read_at) {
      try {
        await api.post(`/admin/notifications/${notification.id}/read`, {}, { accessToken: session.access_token })
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item))
      } catch (error) {
        console.error('Admin notification could not be marked read:', error)
      }
    }
    if (notification.data?.type === 'registration_submitted') onNavigate?.('Residents')
    setShowNotifications(false)
  }

  const unreadCount = notifications.filter((notification) => !notification.read_at).length

  return (
    <header className="topbar">
      <div className="mobile-brand"><span className="brand-mark"><ShieldCheck size={19} /></span><strong>Peaceville</strong></div>
      <div className="breadcrumb"><span>Peaceville Estate</span><span className="breadcrumb-divider">/</span><strong>{activeSection}</strong></div>
      <div className="topbar-actions">
        <ApiConnectionStatus />
        <label className="search-box">
          <Search size={16} />
          <input aria-label="Search" placeholder="Search anything" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="admin-notification-anchor">
          <button className="icon-button notification-button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={showNotifications} onClick={() => setShowNotifications((current) => !current)}><Bell size={18} />{unreadCount > 0 && <span className="admin-notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>
          {showNotifications && <section className="admin-notification-menu" aria-label="Notifications"><header><strong>Notifications</strong><small>{unreadCount} unread</small></header>{notifications.length ? notifications.map((notification) => <button className={`admin-notification-item${notification.read_at ? '' : ' unread'}`} type="button" key={notification.id} onClick={() => openNotification(notification)}><strong>{notification.title}</strong><span>{notification.body}</span><small>{new Date(notification.created_at).toLocaleString('en-NG')}</small></button>) : <p className="admin-notification-empty">No notifications yet.</p>}</section>}
        </div>
        <ProfilePhotoUpload compact onOpenProfile={() => onNavigate?.('Profile')} />
      </div>
    </header>
  )
}

export default Topbar
