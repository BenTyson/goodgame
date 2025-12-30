import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getConversationWithMessages, markConversationRead } from '@/lib/supabase/conversation-queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageThread } from '@/components/marketplace/messaging/MessageThread'
import { formatCurrency } from '@/lib/utils'

function formatPriceCents(cents: number | null, currency: string = 'USD'): string {
  if (cents === null) return 'Price TBD'
  return formatCurrency(cents / 100, currency)
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/marketplace/messages/${id}`)
  }

  const conversation = await getConversationWithMessages(id, user.id)

  if (!conversation) {
    notFound()
  }

  // Mark as read
  await markConversationRead(id, user.id)

  const otherUser = conversation.other_user
  const displayName = otherUser.display_name || otherUser.username || 'Unknown User'
  const avatarUrl = otherUser.custom_avatar_url || otherUser.avatar_url
  const initials = displayName.slice(0, 2).toUpperCase()
  const isBuyer = conversation.buyer_id === user.id

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="-ml-3 mb-4">
          <Link href="/marketplace/messages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Link>
        </Button>

        {/* Listing info card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Game thumbnail */}
              <Link href={`/marketplace/listings/${conversation.listing_id}`}>
                <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                  {conversation.listing.game.thumbnail_url ? (
                    <Image
                      src={conversation.listing.game.thumbnail_url}
                      alt={conversation.listing.game.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </Link>

              {/* Listing details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/marketplace/listings/${conversation.listing_id}`}
                      className="font-semibold hover:underline"
                    >
                      {conversation.listing.game.name}
                    </Link>
                    <p className="text-sm text-muted-foreground capitalize">
                      {conversation.listing.listing_type === 'sell' && conversation.listing.price_cents && (
                        <span className="font-medium text-foreground">
                          {formatPriceCents(conversation.listing.price_cents)}
                        </span>
                      )}
                      {conversation.listing.listing_type === 'trade' && 'For Trade'}
                      {conversation.listing.listing_type === 'want' && 'Wanted'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/marketplace/listings/${conversation.listing_id}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Listing
                    </Link>
                  </Button>
                </div>

                {/* Other user info */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/u/${otherUser.username || otherUser.id}`} className="font-medium text-sm hover:underline">
                      {displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {isBuyer ? 'Seller' : 'Buyer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message thread */}
      <MessageThread
        conversationId={conversation.id}
        messages={conversation.messages}
        currentUserId={user.id}
        otherUser={conversation.other_user}
      />
    </div>
  )
}
