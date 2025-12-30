'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Edit, Trash2, Loader2, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MakeOfferDialog } from '@/components/marketplace/offers'
import { cn } from '@/lib/utils'
import type { ListingWithDetails } from '@/types/marketplace'

interface ListingDetailActionsProps {
  listingId: string
  sellerId: string
  isOwner: boolean
  userId?: string
  listing?: ListingWithDetails // Full listing for Make Offer dialog
}

export function ListingDetailActions({
  listingId,
  sellerId,
  isOwner,
  userId,
  listing,
}: ListingDetailActionsProps) {
  const router = useRouter()
  const [isSaved, setIsSaved] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [checkingSaved, setCheckingSaved] = React.useState(!!userId)
  const [isOfferDialogOpen, setIsOfferDialogOpen] = React.useState(false)

  // Check if listing is saved on mount
  React.useEffect(() => {
    if (!userId) return

    const checkSaved = async () => {
      try {
        const response = await fetch(`/api/marketplace/listings/${listingId}/saved`)
        if (response.ok) {
          const data = await response.json()
          setIsSaved(data.saved)
        }
      } catch (error) {
        console.error('Error checking saved status:', error)
      } finally {
        setCheckingSaved(false)
      }
    }

    checkSaved()
  }, [listingId, userId])

  const handleSaveToggle = async () => {
    if (!userId) {
      router.push(`/login?redirect=/marketplace/listings/${listingId}`)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/save`, {
        method: isSaved ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        setIsSaved(!isSaved)
      }
    } catch (error) {
      console.error('Error toggling save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const [isContacting, setIsContacting] = React.useState(false)
  const [contactError, setContactError] = React.useState<string | null>(null)

  const handleContact = async () => {
    if (!userId) {
      router.push(`/login?redirect=/marketplace/listings/${listingId}`)
      return
    }

    setIsContacting(true)
    setContactError(null)

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
    } catch (error) {
      console.error('Error starting conversation:', error)
      setContactError(error instanceof Error ? error.message : 'Failed to start conversation')
      setIsContacting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/marketplace/my-listings')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete listing')
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
      alert('Failed to delete listing')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isOwner) {
    return (
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/marketplace/listings/${listingId}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Listing
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Listing
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Listing</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this listing? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Can make offer if listing accepts offers and listing data is available
  const canMakeOffer = listing && listing.accepts_offers && listing.listing_type === 'sell'

  const handleMakeOffer = () => {
    if (!userId) {
      router.push(`/login?redirect=/marketplace/listings/${listingId}`)
      return
    }
    setIsOfferDialogOpen(true)
  }

  return (
    <div className="space-y-3">
      {/* Make Offer Button (if listing accepts offers) */}
      {canMakeOffer && (
        <Button
          className="w-full"
          onClick={handleMakeOffer}
        >
          <Tag className="h-4 w-4 mr-2" />
          Make an Offer
        </Button>
      )}

      <Button
        className={cn('w-full', canMakeOffer && 'variant-outline')}
        variant={canMakeOffer ? 'outline' : 'default'}
        onClick={handleContact}
        disabled={isContacting}
      >
        {isContacting ? (
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
      {contactError && (
        <p className="text-sm text-destructive">{contactError}</p>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={handleSaveToggle}
        disabled={isSaving || checkingSaved}
      >
        {isSaving || checkingSaved ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Heart
            className={cn(
              'h-4 w-4 mr-2',
              isSaved && 'fill-red-500 text-red-500'
            )}
          />
        )}
        {isSaved ? 'Saved' : 'Save Listing'}
      </Button>

      {/* Make Offer Dialog */}
      {listing && userId && (
        <MakeOfferDialog
          listing={listing}
          currentUserId={userId}
          open={isOfferDialogOpen}
          onOpenChange={setIsOfferDialogOpen}
        />
      )}
    </div>
  )
}
