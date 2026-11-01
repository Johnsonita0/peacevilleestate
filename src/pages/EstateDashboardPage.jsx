import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import OverviewPage from './OverviewPage'
import ResidentsPage from './ResidentsPage'
import VisitorsPage from './VisitorsPage'
import PaymentsPage from './PaymentsPage'
import IncidentsPage from './IncidentsPage'
import MessagesPage from './MessagesPage'

const pages = {
  Overview: OverviewPage,
  Residents: ResidentsPage,
  Visitors: VisitorsPage,
  Payments: PaymentsPage,
  Incidents: IncidentsPage,
  Messages: MessagesPage,
}

function EstateDashboardPage() {
  const [activeSection, setActiveSection] = useState('Overview')
  const ActivePage = pages[activeSection]

  return (
    <div className="app-shell">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <main className="main-area">
        <Topbar activeSection={activeSection} />
        <div className="content-wrap">
          <ActivePage onNavigate={setActiveSection} />
        </div>
      </main>
    </div>
  )
}

export default EstateDashboardPage
