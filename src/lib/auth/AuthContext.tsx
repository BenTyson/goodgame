'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const supabase = createClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check admin status from profile role
  const isAdmin = profile?.role === 'admin'

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Failsafe timeout - never stay loading for more than 2 seconds
    const timeout = setTimeout(() => {
      console.log('Auth timeout triggered')
      setIsLoading(false)
    }, 2000)

    // Get initial session
    console.log('Getting initial session...')
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('Initial session result:', session?.user?.email, 'error:', error)
      if (session?.user) {
        setUser(session.user)

        // Try to get profile, create if doesn't exist
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (existingProfile) {
          setProfile(existingProfile)
        } else {
          // Profile doesn't exist - create it
          console.log('Creating missing user profile...')
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              display_name: session.user.user_metadata?.full_name ||
                           session.user.user_metadata?.name ||
                           session.user.email?.split('@')[0] || 'User',
              avatar_url: session.user.user_metadata?.avatar_url || null,
            })
            .select()
            .single()
          setProfile(newProfile)
        }
        setIsLoading(false)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)

        if (event === 'INITIAL_SESSION') {
          // Initial session is handled by getSession above
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null)
          if (session?.user) {
            // Try to get profile, create if doesn't exist
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (existingProfile) {
              setProfile(existingProfile)
            } else {
              // Profile doesn't exist - create it
              const { data: newProfile } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  display_name: session.user.user_metadata?.full_name ||
                               session.user.user_metadata?.name ||
                               session.user.email?.split('@')[0] || 'User',
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                })
                .select()
                .single()
              setProfile(newProfile)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('SIGNED_OUT event received')
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithGoogle(redirectTo?: string) {
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    if (redirectTo) {
      callbackUrl.searchParams.set('next', redirectTo)
    } else {
      callbackUrl.searchParams.set('next', window.location.pathname)
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

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
