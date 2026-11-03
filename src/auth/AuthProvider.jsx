import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const ADMIN_ROLES = ['super_admin', 'estate_admin']
export const SECURITY_ROLES = ['estate_security', 'compound_security']
export const RESIDENT_ROLES = ['compound_rep', 'landlord', 'tenant']
const SUPPORTED_ROLES = [...ADMIN_ROLES, ...SECURITY_ROLES, ...RESIDENT_ROLES]

const AuthContext = createContext(null)

export function dashboardPathForRole(role) {
  if (ADMIN_ROLES.includes(role)) return '/admin/dashboard'
  if (SECURITY_ROLES.includes(role)) return '/security/dashboard'
  if (RESIDENT_ROLES.includes(role)) return '/dashboard'
  return '/'
}

function normalizeNigerianPhone(value) {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')

  if (trimmed.startsWith('+')) return `+${digits}`
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `+234${digits.slice(1)}`
  if (digits.length === 10) return `+234${digits}`
  return trimmed
}

async function getActiveProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, status, profile_photo_path')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error('We could not verify your account permissions.')
  if (!data || data.status !== 'active' || !SUPPORTED_ROLES.includes(data.role)) {
    throw new Error('This account is not active. Contact estate management.')
  }

  return data
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ session: null, profile: null, loading: true })

  useEffect(() => {
    let mounted = true

    if (!supabase) {
      setAuth({ session: null, profile: null, loading: false })
      return () => { mounted = false }
    }

    const syncSession = async (session) => {
      if (!session) {
        if (mounted) setAuth({ session: null, profile: null, loading: false })
        return
      }

      if (mounted) setAuth((current) => ({ ...current, session, loading: true }))
      try {
        const profile = await getActiveProfile(session.user.id)
        if (mounted) setAuth({ session, profile, loading: false })
      } catch {
        if (mounted) setAuth({ session, profile: null, loading: false })
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => { void syncSession(session) })
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (mounted) setAuth({ session: null, profile: null, loading: false })
        return
      }
      void syncSession(data.session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn({ identifier, password, portal }) {
    if (!supabase) {
      throw new Error('Authentication is not configured yet. Add the Supabase project URL and anon key to frontend environment settings.')
    }

    const credentials = portal === 'admin'
      ? { email: identifier.trim().toLowerCase(), password }
      : { phone: normalizeNigerianPhone(identifier), password }
    const { data, error } = await supabase.auth.signInWithPassword(credentials)

    if (error) {
      console.error('Supabase sign-in failed:', error)
      throw new Error('We could not sign you in. Please check your details and try again.')
    }

    let profile
    try {
      profile = await getActiveProfile(data.user.id)
    } catch (profileError) {
      console.error('Profile validation failed during sign in:', profileError)
      await supabase.auth.signOut()
      throw new Error('We could not verify this account. Please contact estate management.')
    }

    const isAdmin = ADMIN_ROLES.includes(profile.role)
    if (portal === 'admin' && !isAdmin) {
      await supabase.auth.signOut()
      throw new Error('This account does not have administrator access.')
    }
    if (portal !== 'admin' && isAdmin) {
      await supabase.auth.signOut()
      throw new Error('Administrators must sign in through /admin.')
    }

    setAuth({ session: data.session, profile, loading: false })
    return profile
  }

  async function signOut() {
    let signOutError = null
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut({ scope: 'local' })
        signOutError = error
      }
    } catch (error) {
      signOutError = error
    } finally {
      setAuth({ session: null, profile: null, loading: false })
    }
    if (signOutError) {
      console.error('Supabase sign-out failed:', signOutError)
      throw new Error('Your session was cleared on this device, but sign-out could not be confirmed. Please try again when online.')
    }
  }

  async function refreshProfile() {
    if (!auth.session?.user?.id) throw new Error('Sign in to update your profile.')
    const profile = await getActiveProfile(auth.session.user.id)
    setAuth((current) => ({ ...current, profile }))
    return profile
  }

  return (
    <AuthContext.Provider value={{ ...auth, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
