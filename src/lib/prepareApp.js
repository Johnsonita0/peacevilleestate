import { api } from './api'

export async function prepareApp() {
  const apiCheck = api.get('/health', { signal: AbortSignal.timeout(1500) })
    .then(() => true)
    .catch(() => false)

  const fontReady = typeof document !== 'undefined'
    ? document.fonts.ready.catch(() => undefined)
    : Promise.resolve()

  const routeWarmup = Promise.allSettled([
    import('../pages/SignInPage'),
    import('../pages/EstateDashboardPage'),
  ])

  const [, apiOnline] = await Promise.all([
    Promise.all([fontReady, routeWarmup]),
    apiCheck,
  ])

  return { apiOnline }
}
