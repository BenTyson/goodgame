'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/AuthContext'
import { RecommendToFriendDialog } from './RecommendToFriendDialog'

interface RecommendToFriendButtonProps {
  gameId: string
  gameName: string
  gameSlug: string
}

export function RecommendToFriendButton({
  gameId,
  gameName,
  gameSlug,
}: RecommendToFriendButtonProps) {
  const { user, signInWithGoogle } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleClick = () => {
    if (!user) {
      signInWithGoogle()
      return
    }
    setIsDialogOpen(true)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Recommend to Friend
      </Button>

      {user && (
        <RecommendToFriendDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          gameId={gameId}
          gameName={gameName}
          gameSlug={gameSlug}
          userId={user.id}
        />
      )}
    </>
  )
}
