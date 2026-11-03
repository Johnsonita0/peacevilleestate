import { useEffect, useState } from 'react'
import { Download, RefreshCw, WifiOff, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import '../css/pwa.css'

function PwaLifecycle() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [dismissed, setDismissed] = useState(false)
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true })

  useEffect(() => {
    function handleInstallPrompt(event) {
      event.preventDefault()
      setInstallPrompt(event)
    }
    function handleInstalled() {
      setInstalled(true)
      setInstallPrompt(null)
    }
    function handleOnline() { setOnline(true) }
    function handleOffline() { setOnline(false) }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const visible = !dismissed && (
    !online || needRefresh || offlineReady || installPrompt || (isIos && !isStandalone && !installed)
  )
  if (!visible) return null

  return (
    <aside className="pwa-notice" aria-live="polite" aria-label="App status">
      <div className="pwa-notice-icon" aria-hidden="true">
        {!online ? <WifiOff size={17} /> : needRefresh ? <RefreshCw size={17} /> : <Download size={17} />}
      </div>
      <div className="pwa-notice-copy">
        <strong>{!online ? 'You are offline' : needRefresh ? 'Update ready' : offlineReady ? 'Ready to use offline' : installed ? 'App installed' : 'Install Peaceville'}</strong>
        <span>
          {!online
            ? 'The app shell is available; live estate data needs a connection.'
            : needRefresh
              ? 'Install the latest version to continue.'
              : offlineReady
                ? 'The app shell is saved on this device.'
                : isIos && !installPrompt
                  ? 'Open Share, then choose Add to Home Screen.'
                  : 'Add the estate app to your home screen.'}
        </span>
      </div>
      {needRefresh ? (
        <button className="pwa-notice-action" type="button" onClick={() => updateServiceWorker(true)}>Reload</button>
      ) : installPrompt ? (
        <button className="pwa-notice-action" type="button" onClick={installApp}>Install</button>
      ) : null}
      <button className="pwa-notice-close" type="button" aria-label="Dismiss app message" onClick={() => {
        setDismissed(true)
        setOfflineReady(false)
        setNeedRefresh(false)
      }}><X size={16} /></button>
    </aside>
  )
}

export default PwaLifecycle