import { lazy, Suspense, useState } from 'react'
import SplashPage from './pages/SplashPage'

const SignInPage = lazy(() => import('./pages/SignInPage'))

function App() {
  const [bootState, setBootState] = useState(null)

  if (!bootState) {
    return <SplashPage onComplete={setBootState} />
  }

  return (
    <Suspense fallback={<div className="auth-stage" aria-busy="true" />}>
      <SignInPage apiOnline={bootState.apiOnline} />
    </Suspense>
  )
}

export default App
