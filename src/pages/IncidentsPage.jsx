import PageHeading from '../components/PageHeading'
import WorkspaceEmptyState from '../components/WorkspaceEmptyState'

function IncidentsPage({ onNavigate }) {
  return <><PageHeading title="Incidents" description="Security reports and follow-up." /><WorkspaceEmptyState section="Incidents" description="Incident details will be visible only to authorized users after API and RLS policies are in place." onBack={() => onNavigate('Overview')} /></>
}

export default IncidentsPage
