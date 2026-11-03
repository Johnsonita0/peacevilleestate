import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Ellipsis, LayoutGrid, Shield, UsersRound } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import OverviewPage from './OverviewPage'
import ResidentsPage from './ResidentsPage'
import VisitorsPage from './VisitorsPage'
import PaymentsPage from './PaymentsPage'
import IncidentsPage from './IncidentsPage'
import MessagesPage from './MessagesPage'
import EstateAdsPage from './EstateAdsPage'
import AdminProfilePage from './AdminProfilePage'
import AdminMorePage from './AdminMorePage'
import AdminWorkspacePage from './AdminWorkspacePage'

const workspace = (section) => (props) => <AdminWorkspacePage {...props} section={section} />

const pages = {
  Overview: OverviewPage,
  Residents: workspace('Residents'),
  Visitors: workspace('Visitors'),
  Payments: workspace('Payments'),
  Security: workspace('Security'),
  Incidents: workspace('Security'),
  Messages: MessagesPage,
  Ads: EstateAdsPage,
  'Estate ads': EstateAdsPage,
  'Levies and fees': workspace('Levies and fees'),
  Announcements: workspace('Announcements'),
  Meetings: workspace('Meetings'),
  'Compounds and units': workspace('Compounds and units'),
  'Staff and roles': workspace('Staff and roles'),
  'Businesses and institutions': workspace('Businesses and institutions'),
  'Commercial levy rates': workspace('Commercial levy rates'),
  Reports: workspace('Reports'),
  'Audit log': workspace('Audit log'),
  Settings: workspace('Settings'),
  Profile: AdminProfilePage,
  More: AdminMorePage,
}

const mobileNavigation = [
  { label: 'Overview', section: 'Overview', icon: LayoutGrid },
  { label: 'Residents', section: 'Residents', icon: UsersRound },
  { label: 'Payments', section: 'Payments', icon: CreditCard },
  { label: 'Security', section: 'Security', icon: Shield },
  { label: 'More', section: 'More', icon: Ellipsis },
]

function EstateDashboardPage() {
  const [activeSection, setActiveSection] = useState('Overview')
  const [logoutError, setLogoutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const ActivePage = pages[activeSection]

  function navigateToSection(section) {
    setActiveSection(section === 'Estate ads' ? 'Ads' : section)
  }

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    setLogoutError('')
    try {
      await signOut()
      navigate('/admin', { replace: true })
    } catch (error) {
      console.error('Administrator sign-out failed:', error)
      setLogoutError(error.message || 'We could not sign you out. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <div className="app-shell admin-app-shell">
      <Sidebar activeSection={activeSection} onNavigate={navigateToSection} onSignOut={handleSignOut} />
      <main className="main-area">
        <Topbar activeSection={activeSection} onNavigate={navigateToSection} />
        {logoutError && <p className="admin-toast" role="alert">{logoutError}</p>}
        <div className="content-wrap">
          <ActivePage onNavigate={navigateToSection} onSignOut={handleSignOut} />
        </div>
      </main>
      <nav className="admin-mobile-nav" aria-label="Administrator navigation">
        {mobileNavigation.map(({ label, section, icon: Icon }) => (
          <button
            className={activeSection === section ? 'active' : ''}
            key={label}
            type="button"
            onClick={() => navigateToSection(section)}
            aria-current={activeSection === section || (section === 'Security' && activeSection === 'Incidents') ? 'page' : undefined}
          >
            <Icon size={17} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default EstateDashboardPage
