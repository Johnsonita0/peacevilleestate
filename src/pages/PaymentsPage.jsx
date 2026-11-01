import PageHeading from '../components/PageHeading'
import WorkspaceEmptyState from '../components/WorkspaceEmptyState'

function PaymentsPage({ onNavigate }) {
  return <><PageHeading title="Payments" description="Levy status and payment activity." /><WorkspaceEmptyState section="Payments" description="Payment records and provider verification will be handled by the protected API." onBack={() => onNavigate('Overview')} /></>
}

export default PaymentsPage
