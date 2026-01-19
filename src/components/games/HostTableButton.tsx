'use client'

import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/AuthContext'

interface HostTableButtonProps {
  gameId: string
  gameName: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function HostTableButton({
  gameId,
  gameName,
  variant = 'outline',
  size = 'default',
  className,
}: HostTableButtonProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const handleClick = () => {
    if (!user) {
      // Redirect to login, then back to create table with game preselected
      router.push(`/login?redirect=${encodeURIComponent(`/tables/new?gameId=${gameId}`)}`)
      return
    }

    router.push(`/tables/new?gameId=${gameId}`)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      title={`Host a table for ${gameName}`}
    >
      <Users className="h-4 w-4 mr-2" />
      Host a Table
    </Button>
  )
}
