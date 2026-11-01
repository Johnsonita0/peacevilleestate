import PageHeading from '../components/PageHeading'
import WorkspaceEmptyState from '../components/WorkspaceEmptyState'

function MessagesPage({ onNavigate }) {
  return <><PageHeading title="Messages" description="Estate and compound communications." /><WorkspaceEmptyState section="Messages" description="Messages will be connected to room membership and Supabase Realtime policies." onBack={() => onNavigate('Overview')} /></>
}

export default MessagesPage
