'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ExternalLink,
  Loader2,
  MapPin,
  Calendar,
  Dices,
  Star,
  MessageSquare,
  Users,
  UserPlus,
  Package,
  ShoppingCart,
  CreditCard,
  Shield,
  ShieldOff,
  Globe,
} from 'lucide-react'
import type { AdminUserDetail } from '@/lib/supabase/admin-user-queries'

interface UserDetailPanelProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays} days ago`
  if (diffHours > 0) return `${diffHours} hours ago`
  if (diffMinutes > 0) return `${diffMinutes} minutes ago`
  return 'Just now'
}

function getInitials(displayName: string | null, username: string | null): string {
  if (displayName) {
    return displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }
  if (username) {
    return username.slice(0, 2).toUpperCase()
  }
  return '?'
}

export function UserDetailPanel({ userId, open, onOpenChange }: UserDetailPanelProps) {
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)

  useEffect(() => {
    if (!userId || !open) {
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/api/admin/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user')
        return res.json()
      })
      .then((data) => setUser(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId, open])

  const handleRoleChange = async () => {
    if (!user) return

    setUpdatingRole(true)
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin'
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) throw new Error('Failed to update role')

      setUser({ ...user, role: newRole })
      setRoleDialogOpen(false)
    } catch (err) {
      console.error('Error updating role:', err)
    } finally {
      setUpdatingRole(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {loading && (
            <SheetHeader>
              <SheetTitle>Loading user...</SheetTitle>
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </SheetHeader>
          )}

          {error && !loading && (
            <SheetHeader>
              <SheetTitle>Error</SheetTitle>
              <div className="flex items-center justify-center h-64">
                <p className="text-destructive">{error}</p>
              </div>
            </SheetHeader>
          )}

          {!user && !loading && !error && (
            <SheetHeader>
              <SheetTitle>User Details</SheetTitle>
              <SheetDescription>Select a user to view details</SheetDescription>
            </SheetHeader>
          )}

          {user && !loading && !error && (
            <>
              <SheetHeader className="space-y-4">
                {/* User Avatar & Name */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={user.custom_avatar_url || user.avatar_url || undefined}
                      alt={user.display_name || user.username || 'User'}
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.display_name, user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SheetTitle className="text-xl truncate">
                        {user.display_name || user.username || 'Anonymous'}
                      </SheetTitle>
                      {user.role === 'admin' && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-0 shrink-0">
                          Admin
                        </Badge>
                      )}
                    </div>
                    {user.username && (
                      <SheetDescription className="text-base">
                        @{user.username}
                      </SheetDescription>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {user.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {user.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                )}
              </SheetHeader>

              <div className="mt-2 px-4 pb-4 space-y-6">
                {/* Quick Stats Grid */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Activity</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard icon={Dices} label="Games" value={user.games_count} />
                    <StatCard icon={Star} label="Ratings" value={user.ratings_count} />
                    <StatCard icon={MessageSquare} label="Reviews" value={user.reviews_count} />
                    <StatCard icon={Users} label="Followers" value={user.followers_count} />
                    <StatCard icon={UserPlus} label="Following" value={user.following_count} />
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Last Active</div>
                      <div className="text-sm font-medium mt-0.5">
                        {formatRelativeTime(user.last_active_at)}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Shelf Breakdown */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Shelf Breakdown</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <ShelfRow label="Owned" count={user.shelf_owned} />
                    <ShelfRow label="Want to Buy" count={user.shelf_want_to_buy} />
                    <ShelfRow label="Want to Play" count={user.shelf_want_to_play} />
                    <ShelfRow label="Wishlist" count={user.shelf_wishlist} />
                    <ShelfRow label="Previously Owned" count={user.shelf_previously_owned} />
                  </div>
                </div>

                {/* Marketplace Stats (if seller) */}
                {user.is_seller && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Marketplace</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={Package} label="Sales" value={user.total_sales} />
                        <StatCard icon={ShoppingCart} label="Purchases" value={user.total_purchases} />
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        {user.seller_rating !== null && (
                          <span className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="font-medium">{user.seller_rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">seller rating</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className={user.stripe_onboarding_complete ? 'text-emerald-600' : 'text-muted-foreground'}>
                            {user.stripe_onboarding_complete ? 'Stripe connected' : 'Stripe not connected'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Social Links */}
                {user.social_links && Object.keys(user.social_links).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Social Links</h3>
                      <div className="space-y-2">
                        {user.social_links.bgg_username && (
                          <SocialLink
                            label="BoardGameGeek"
                            value={user.social_links.bgg_username}
                            href={`https://boardgamegeek.com/user/${user.social_links.bgg_username}`}
                          />
                        )}
                        {user.social_links.twitter_handle && (
                          <SocialLink
                            label="Twitter"
                            value={`@${user.social_links.twitter_handle}`}
                            href={`https://twitter.com/${user.social_links.twitter_handle}`}
                          />
                        )}
                        {user.social_links.instagram_handle && (
                          <SocialLink
                            label="Instagram"
                            value={`@${user.social_links.instagram_handle}`}
                            href={`https://instagram.com/${user.social_links.instagram_handle}`}
                          />
                        )}
                        {user.social_links.discord_username && (
                          <SocialLink
                            label="Discord"
                            value={user.social_links.discord_username}
                          />
                        )}
                        {user.social_links.website_url && (
                          <SocialLink
                            label="Website"
                            value={user.social_links.website_url}
                            href={user.social_links.website_url}
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions</h3>
                  {user.username && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={`/u/${user.username}`} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        View Public Profile
                        <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setRoleDialogOpen(true)}
                  >
                    {user.role === 'admin' ? (
                      <>
                        <ShieldOff className="h-4 w-4 mr-2" />
                        Remove Admin Role
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Grant Admin Role
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user?.role === 'admin' ? 'Remove Admin Role?' : 'Grant Admin Role?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user?.role === 'admin'
                ? `This will remove admin privileges from ${user?.display_name || user?.username || 'this user'}. They will no longer be able to access the admin panel.`
                : `This will grant admin privileges to ${user?.display_name || user?.username || 'this user'}. They will have full access to the admin panel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingRole}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={updatingRole}
              className={user?.role === 'admin' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {updatingRole && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {user?.role === 'admin' ? 'Remove Role' : 'Grant Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-lg font-semibold mt-0.5 tabular-nums">{value}</div>
    </div>
  )
}

function ShelfRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{count}</span>
    </div>
  )
}

function SocialLink({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  const content = (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 -mx-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        {value}
        {href && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
      </span>
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return content
}
