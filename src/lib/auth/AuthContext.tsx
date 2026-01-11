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
  signInWithGoogle: (redirectTo?: string) => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isAdmin = profile?.role === 'admin'

  // Fetch profile helper
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }, [supabase])

  // Create profile if it doesn't exist
  const fetchOrCreateProfile = useCallback(async (authUser: User) => {
    const { data: existingProfile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (existingProfile) {
      setProfile(existingProfile)
      return
    }

    // Profile doesn't exist, create it
    if (error?.code === 'PGRST116') {
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
      setProfile(newProfile)
    }
  }, [supabase])

  // Update last active timestamp
  const updateLastActive = useCallback(async (userId: string) => {
    await supabase
      .from('user_profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId)
  }, [supabase])

  // Initialize session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchOrCreateProfile(session.user)
        updateLastActive(session.user.id)
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchOrCreateProfile(session.user)
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            updateLastActive(session.user.id)
          }
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchOrCreateProfile, updateLastActive])

  // Periodic last active update
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      updateLastActive(user.id)
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(interval)
  }, [user, updateLastActive])

  // Sign in with Google OAuth
  function signInWithGoogle(redirectTo?: string) {
    const next = redirectTo || window.location.pathname
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  }

  // Sign out
  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

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
