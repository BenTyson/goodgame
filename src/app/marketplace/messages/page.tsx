import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getUserConversations } from '@/lib/supabase/conversation-queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConversationList } from '@/components/marketplace/messaging'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/marketplace/messages')
  }

  const conversations = await getUserConversations(user.id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button variant="ghost" asChild className="-ml-3 mb-2">
            <Link href="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Conversations about your listings and purchases
          </p>
        </div>
      </div>

      {/* Conversations */}
      {conversations.length > 0 ? (
        <ConversationList conversations={conversations} currentUserId={user.id} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-lg font-semibold mb-2">No messages yet</h2>
            <p className="text-muted-foreground mb-4">
              When you contact a seller or receive a message, it will appear here.
            </p>
            <Button asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
