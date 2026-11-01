import PageHeading from '../components/PageHeading'
import WorkspaceEmptyState from '../components/WorkspaceEmptyState'

function ResidentsPage({ onNavigate }) {
  return <><PageHeading title="Residents" description="Resident records and household access." /><WorkspaceEmptyState section="Residents" description="Resident records will appear here after the API and database access policies are connected." onBack={() => onNavigate('Overview')} /></>
}

export default ResidentsPage
