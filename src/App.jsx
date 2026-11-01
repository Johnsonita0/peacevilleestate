import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import OverviewPage from './pages/OverviewPage'
import ResidentsPage from './pages/ResidentsPage'
import VisitorsPage from './pages/VisitorsPage'
import PaymentsPage from './pages/PaymentsPage'
import IncidentsPage from './pages/IncidentsPage'
import MessagesPage from './pages/MessagesPage'

const pages = {
  Overview: OverviewPage,
  Residents: ResidentsPage,
  Visitors: VisitorsPage,
  Payments: PaymentsPage,
  Incidents: IncidentsPage,
  Messages: MessagesPage,
}

function App() {
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

export default App
