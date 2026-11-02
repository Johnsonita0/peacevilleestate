import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import '../css/api-status.css'

function ApiConnectionStatus() {
  const [status, setStatus] = useState('checking')
  const [missingConfiguration, setMissingConfiguration] = useState([])

  useEffect(() => {
    let mounted = true
    api.get('/health')
      .then((health) => {
        if (!mounted) return
        setMissingConfiguration(health.missingConfiguration ?? [])
        setStatus(health.status === 'degraded' ? 'setup' : 'online')
      })
      .catch(() => mounted && setStatus('offline'))

    return () => {
      mounted = false
    }
  }, [])

  const label = {
    checking: 'API checking',
    online: 'API connected',
    setup: 'API setup needed',
    offline: 'API unavailable',
  }[status]

  return (
    <span className={`api-status api-status-${status}`} title={missingConfiguration.length ? `Missing: ${missingConfiguration.join(', ')}` : undefined} role="status" aria-live="polite">
      <span className="api-status-dot" />{label}
    </span>
  )
}

export default ApiConnectionStatus
