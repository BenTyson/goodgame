'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, X, Loader2, AtSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkUsernameAvailable } from '@/lib/supabase/user-queries'

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'settings', 'login', 'logout', 'signup', 'register',
  'shelf', 'profile', 'user', 'users', 'api', 'auth', 'callback', 'games',
  'game', 'categories', 'collections', 'designers', 'publishers', 'artists',
  'about', 'help', 'support', 'contact', 'privacy', 'terms', 'search',
  'boardnomads', 'goodgame', 'null', 'undefined', 'u'
]

interface UsernameInputProps {
  value: string
  currentUsername?: string | null // User's existing username (for editing)
  onChange: (value: string) => void
  onValidChange?: (isValid: boolean) => void
}

export function UsernameInput({ value, currentUsername, onChange, onValidChange }: UsernameInputProps) {
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Validate username format
  const validateFormat = (username: string): string | null => {
    if (!username) return null
    if (username.length < 3) return 'Username must be at least 3 characters'
    if (username.length > 20) return 'Username must be 20 characters or less'
    if (!/^[a-z0-9_]+$/.test(username)) return 'Only lowercase letters, numbers, and underscores'
    if (RESERVED_USERNAMES.includes(username)) return 'This username is reserved'
    return null
  }

  // Format input to lowercase and remove invalid chars
  const formatUsername = (input: string): string => {
    return input.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
  }

  // Debounced availability check
  const checkAvailability = useCallback(async (username: string) => {
    // Skip if it's the user's current username
    if (currentUsername && username === currentUsername) {
      setIsAvailable(true)
      setChecking(false)
      onValidChange?.(true)
      return
    }

    try {
      const available = await checkUsernameAvailable(username)
      setIsAvailable(available)
      setError(available ? null : 'Username is taken')
      onValidChange?.(available)
    } catch (err) {
      console.error('Error checking username:', err)
      setError('Error checking availability')
      onValidChange?.(false)
    } finally {
      setChecking(false)
    }
  }, [currentUsername, onValidChange])

  // Check availability when value changes (debounced)
  useEffect(() => {
    const formatError = validateFormat(value)

    if (!value) {
      setIsAvailable(null)
      setError(null)
      setChecking(false)
      onValidChange?.(true) // Empty is valid (optional)
      return
    }

    if (formatError) {
      setError(formatError)
      setIsAvailable(null)
      setChecking(false)
      onValidChange?.(false)
      return
    }

    // Clear previous state and start checking
    setError(null)
    setChecking(true)

    const timer = setTimeout(() => {
      checkAvailability(value)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, checkAvailability, onValidChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUsername(e.target.value)
    onChange(formatted)
  }

  // Determine status icon
  const renderStatus = () => {
    if (!value) return null

    if (checking) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }

    if (error) {
      return <X className="h-4 w-4 text-destructive" />
    }

    if (isAvailable) {
      return <Check className="h-4 w-4 text-green-600" />
    }

    return null
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <AtSign className="h-4 w-4" />
        </span>
        <Input
          id="username"
          value={value}
          onChange={handleChange}
          placeholder="your_username"
          className="pl-9 pr-9"
          maxLength={20}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {renderStatus()}
        </span>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {!error && value && isAvailable && (
        <p className="text-xs text-green-600">Username is available</p>
      )}
      {!value && (
        <p className="text-xs text-muted-foreground">
          Your profile URL will be boardnomads.com/u/{'{username}'}
        </p>
      )}
      {value && !error && (
        <p className="text-xs text-muted-foreground">
          boardnomads.com/u/{value}
        </p>
      )}
    </div>
  )
}
