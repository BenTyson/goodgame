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

  // Update last_active_at timestamp
  const updateLastActive = useCallback(async (userId: string) => {
    await supabase
      .from('user_profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  // Helper to fetch or create user profile
  const fetchOrCreateProfile = useCallback(async (authUser: User) => {
    // Try to get existing profile
    const { data: existingProfile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (existingProfile) {
      setProfile(existingProfile)
      return
    }

    // Profile doesn't exist - create it
    // (This is a fallback; the database trigger should create it on signup)
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
  }, [])

  useEffect(() => {
    // Failsafe timeout - never stay loading for more than 3 seconds
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    // Use onAuthStateChange as the single source of truth for auth state
    // This handles INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, and SIGNED_OUT
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // For any event with a valid session, update user state
        if (session?.user) {
          setUser(session.user)
          await fetchOrCreateProfile(session.user)
          // Update last active timestamp on sign in
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            updateLastActive(session.user.id)
          }
        } else {
          setUser(null)
          setProfile(null)
        }

        // Always clear loading state after processing
        setIsLoading(false)
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [fetchOrCreateProfile, updateLastActive])

  // Update last active periodically while user is logged in
  useEffect(() => {
    if (!user) return

    // Update every 5 minutes while active
    const interval = setInterval(() => {
      updateLastActive(user.id)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, updateLastActive])

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
