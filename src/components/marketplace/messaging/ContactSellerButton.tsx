'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ContactSellerButtonProps {
  listingId: string
  sellerId: string
  currentUserId: string | null
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

export function ContactSellerButton({
  listingId,
  sellerId,
  currentUserId,
  className,
  variant = 'default',
  size = 'default',
}: ContactSellerButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Don't show if user is the seller or not logged in
  if (!currentUserId || currentUserId === sellerId) {
    return null
  }

  const handleContact = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/marketplace/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start conversation')
      }

      const data = await response.json()
      router.push(`/marketplace/messages/${data.conversation_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
      setIsLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={handleContact}
        disabled={isLoading}
        variant={variant}
        size={size}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Starting conversation...
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Seller
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  )
}
