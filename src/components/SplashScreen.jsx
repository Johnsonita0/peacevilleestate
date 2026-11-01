import { useEffect, useState } from 'react'
import { House } from 'lucide-react'
import { prepareApp } from '../lib/prepareApp'

const SPLASH_DURATION_MS = 5700

function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const startedAt = performance.now()
    let frameId
    let completionTimer
    let isPrepared = false
    let hasReachedDuration = false
    let apiOnline = false
    let disposed = false

    const finishSplash = () => {
      if (disposed || !isPrepared || !hasReachedDuration) return
      setProgress(100)
      completionTimer = window.setTimeout(() => onComplete({ apiOnline }), 180)
    }

    prepareApp()
      .then((result) => {
        apiOnline = result.apiOnline
      })
      .catch(() => {
        apiOnline = false
      })
      .finally(() => {
        isPrepared = true
        finishSplash()
      })

    const updateProgress = (now) => {
      const elapsed = now - startedAt
      const nextProgress = Math.min(99, Math.floor((elapsed / SPLASH_DURATION_MS) * 100))
      setProgress(nextProgress)

      if (elapsed >= SPLASH_DURATION_MS) {
        hasReachedDuration = true
        finishSplash()
        return
      }

      frameId = window.requestAnimationFrame(updateProgress)
    }

    frameId = window.requestAnimationFrame(updateProgress)
    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(completionTimer)
    }
  }, [onComplete])

  return (
    <main className="splash-stage">
      <section className="splash-screen" aria-label="Peaceville Estate loading screen">
        <div className="splash-brand">
          <span className="splash-emblem" aria-hidden="true">
            <House size={43} strokeWidth={1.7} />
          </span>
          <div className="splash-wordmark">Peaceville</div>
          <div className="splash-estate">ESTATE</div>
          <p className="splash-tagline">Safe. Connected. Together.</p>
        </div>

        <div className="splash-progress" aria-label={`Loading your estate: ${progress} percent`}>
          <div className="splash-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
            <span className="splash-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="splash-progress-caption">
            <span>Loading your estate...</span>
            <span>{progress}%</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default SplashScreen
