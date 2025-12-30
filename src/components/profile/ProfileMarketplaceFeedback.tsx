'use client'

import { useState, useEffect } from 'react'
import { Star, Loader2, Store, ShoppingBag, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ReputationStats } from '@/components/marketplace/feedback'
import { FeedbackCard } from '@/components/marketplace/feedback'
import type { UserReputationStats, FeedbackWithDetails } from '@/types/marketplace'

interface ProfileMarketplaceFeedbackProps {
  userId: string
  username?: string | null
  isOwnProfile?: boolean
}

/**
 * ProfileMarketplaceFeedback - Display marketplace reputation and feedback on user profiles
 */
export function ProfileMarketplaceFeedback({
  userId,
  username,
  isOwnProfile = false,
}: ProfileMarketplaceFeedbackProps) {
  const [reputation, setReputation] = useState<UserReputationStats | null>(null)
  const [feedback, setFeedback] = useState<FeedbackWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'seller' | 'buyer'>('seller')

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/marketplace/reputation/${userId}?include_feedback=true&include_breakdown=true&feedback_limit=5`
        )
        if (response.ok) {
          const data = await response.json()
          setReputation(data.reputation)
          if (data.recent_feedback) {
            setFeedback(data.recent_feedback)
          }
        }
      } catch (error) {
        console.error('Error fetching marketplace feedback:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5" />
            Marketplace Reputation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Don't show if no marketplace activity
  if (!reputation || (reputation.total_sales === 0 && reputation.total_purchases === 0 && reputation.total_feedback_count === 0)) {
    // Only show for own profile to encourage marketplace participation
    if (isOwnProfile) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Marketplace Reputation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t made any marketplace transactions yet.
            </p>
            <Button asChild>
              <Link href="/marketplace">
                Browse Marketplace
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5" />
            Marketplace Reputation
          </CardTitle>
          {username && (
            <Link
              href={`/marketplace?seller=${username}`}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View listings
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reputation Stats */}
        <ReputationStats stats={reputation} />

        {/* Feedback Tabs */}
        {feedback.length > 0 && (
          <div className="pt-4 border-t">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'seller' | 'buyer')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="seller" className="gap-2">
                  <Store className="h-4 w-4" />
                  As Seller
                  {reputation.seller_feedback_count > 0 && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {reputation.seller_feedback_count}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="buyer" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  As Buyer
                  {reputation.buyer_feedback_count > 0 && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {reputation.buyer_feedback_count}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="seller" className="mt-4 space-y-3">
                {feedback
                  .filter(f => f.role === 'buyer') // buyer left feedback = seller received
                  .slice(0, 3)
                  .map((item) => (
                    <FeedbackCard
                      key={item.id}
                      feedback={item}
                      showGame={true}
                      showRole={false}
                    />
                  ))}
                {reputation.seller_feedback_count === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No seller feedback yet
                  </p>
                )}
              </TabsContent>

              <TabsContent value="buyer" className="mt-4 space-y-3">
                {feedback
                  .filter(f => f.role === 'seller') // seller left feedback = buyer received
                  .slice(0, 3)
                  .map((item) => (
                    <FeedbackCard
                      key={item.id}
                      feedback={item}
                      showGame={true}
                      showRole={false}
                    />
                  ))}
                {reputation.buyer_feedback_count === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No buyer feedback yet
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
