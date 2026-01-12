'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  signInWithGoogle: (redirectTo?: string) => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Clear stale auth data from localStorage.
 * This is needed because we migrated from @supabase/supabase-js (localStorage)
 * to @supabase/ssr (cookies). Old localStorage tokens can cause conflicts.
 */
function cleanupLegacyStorage() {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key)
    }
  }

  if (keysToRemove.length > 0) {
    console.log('[Auth] Cleaning up legacy localStorage keys:', keysToRemove)
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isAdmin = profile?.role === 'admin'

  // Use ref to track if loading has been set to false (avoids stale closure issue)
  const hasInitialized = useRef(false)

  // Initialize session - runs once on mount
  useEffect(() => {
    let isMounted = true
    console.log('[Auth] Effect starting, initializing auth...')

    // Clean up any stale localStorage auth data from old client
    cleanupLegacyStorage()

    const supabase = createClient()
    console.log('[Auth] Supabase client created')

    // Fetch or create profile helper with timeout
    const fetchOrCreateProfile = async (authUser: User) => {
      console.log('[Auth] Fetching profile for user:', authUser.id)

      // Create an AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.error('[Auth] Profile fetch timeout after 10 seconds')
        controller.abort()
      }, 10000)

      try {
        const { data: existingProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
          .abortSignal(controller.signal)

        clearTimeout(timeoutId)

        if (existingProfile) {
          console.log('[Auth] Found existing profile:', existingProfile.display_name)
          if (isMounted) setProfile(existingProfile)
          return
        }

        // Profile doesn't exist, create it
        if (error?.code === 'PGRST116') {
          console.log('[Auth] No profile found, creating one...')
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({
              id: authUser.id,
              display_name: authUser.user_metadata?.full_name ||
                           authUser.user_metadata?.name ||
                           authUser.email?.split('@')[0] || 'User',
              avatar_url: authUser.user_metadata?.avatar_url || null,
            })
            .select()
            .single()
          console.log('[Auth] Created new profile:', newProfile?.display_name)
          if (isMounted) setProfile(newProfile)
        } else if (error) {
          console.error('[Auth] Profile fetch error:', error)
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('[Auth] Exception fetching/creating profile:', error)
      }
    }

    // Update last active timestamp
    const updateLastActive = async (userId: string) => {
      try {
        await supabase
          .from('user_profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', userId)
      } catch {
        // Silently fail - non-critical
      }
    }

    // Set up auth state listener
    console.log('[Auth] Setting up onAuthStateChange listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] onAuthStateChange fired:', event, session ? 'has session' : 'no session')
        if (!isMounted) {
          console.log('[Auth] Component unmounted, ignoring auth change')
          return
        }

        hasInitialized.current = true
        setUser(session?.user ?? null)

        // Mark as not loading IMMEDIATELY - don't wait for profile fetch
        console.log('[Auth] Setting isLoading = false (from onAuthStateChange)')
        setIsLoading(false)

        if (session?.user) {
          // Fetch profile in background - don't block auth state
          fetchOrCreateProfile(session.user)
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            updateLastActive(session.user.id)
          }
        } else {
          setProfile(null)
        }
      }
    )

    // Call getSession to trigger INITIAL_SESSION event
    console.log('[Auth] Calling getSession...')
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('[Auth] getSession returned:', session ? 'has session' : 'no session', error ? `error: ${error.message}` : '')

        // If onAuthStateChange hasn't fired yet, update state directly
        // This handles cases where the listener doesn't fire
        if (!hasInitialized.current && isMounted) {
          console.log('[Auth] onAuthStateChange not fired yet, updating state directly')
          setUser(session?.user ?? null)
          if (session?.user) {
            fetchOrCreateProfile(session.user)
          }
          setIsLoading(false)
          hasInitialized.current = true
        }
      })
      .catch((error) => {
        console.error('[Auth] getSession exception:', error)
        if (isMounted) {
          setIsLoading(false)
          hasInitialized.current = true
        }
      })

    // Safety timeout - if nothing has happened in 5 seconds, force loading to false
    const timeoutId = setTimeout(() => {
      if (isMounted && !hasInitialized.current) {
        console.warn('[Auth] Timeout reached - forcing isLoading = false')
        setIsLoading(false)
        hasInitialized.current = true
      }
    }, 5000)

    return () => {
      console.log('[Auth] Cleanup running')
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  // Periodic last active update
  useEffect(() => {
    if (!user) return

    const supabase = createClient()
    const updateLastActive = async () => {
      try {
        await supabase
          .from('user_profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', user.id)
      } catch {
        // Silently fail - non-critical
      }
    }

    const interval = setInterval(updateLastActive, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(interval)
  }, [user])

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    console.log('[Auth] signInWithGoogle called')
    try {
      const supabase = createClient()
      const next = redirectTo || window.location.pathname
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      console.log('[Auth] Redirect URL:', redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        console.error('[Auth] OAuth error:', error)
      }
    } catch (error) {
      console.error('[Auth] signInWithGoogle exception:', error)
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    console.log('[Auth] signOut called')
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('[Auth] signOut error:', error)
    }
    // Clear state regardless of error
    setUser(null)
    setProfile(null)
  }, [])

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!user) return
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    } catch (error) {
      console.error('[Auth] refreshProfile error:', error)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      isAdmin,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
