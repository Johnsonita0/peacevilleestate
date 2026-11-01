import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import '../css/api-status.css'

function ApiConnectionStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let mounted = true
    api.get('/health')
      .then(() => mounted && setStatus('online'))
      .catch(() => mounted && setStatus('offline'))

    return () => {
      mounted = false
    }
  }, [])

  const label = {
    checking: 'API checking',
    online: 'API connected',
    offline: 'API unavailable',
  }[status]

  return (
    <span className={`api-status api-status-${status}`} role="status" aria-live="polite">
      <span className="api-status-dot" />{label}
    </span>
  )
}

export default ApiConnectionStatus
