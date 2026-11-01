import PageHeading from '../components/PageHeading'
import WorkspaceEmptyState from '../components/WorkspaceEmptyState'

function VisitorsPage({ onNavigate }) {
  return <><PageHeading title="Visitors" description="Visitor requests, passes and gate activity." /><WorkspaceEmptyState section="Visitors" description="Visitor records and pass verification will be connected through the protected API." onBack={() => onNavigate('Overview')} /></>
}

export default VisitorsPage
