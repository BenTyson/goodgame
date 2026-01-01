'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Settings, User, Link2, Eye, Globe, Twitter, Gamepad2, MessageCircle, MapPin, UserCircle, ExternalLink, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { updateUserProfile } from '@/lib/supabase/user-queries'
import { useAuth } from '@/lib/auth/AuthContext'
import { UsernameInput } from '@/components/settings/UsernameInput'
import { ProfileImageUpload } from '@/components/settings/ProfileImageUpload'
import { BGGImportSection } from '@/components/settings/BGGImportSection'
import type { UserProfile, SocialLinks, Json } from '@/types/database'

interface SettingsContentProps {
  profile: UserProfile | null
  userEmail: string
  stripeStatus?: string
}

const STRIPE_MESSAGES = {
  connected: {
    type: 'success' as const,
    text: 'Payment setup complete! You can now receive payments for marketplace sales.',
    icon: CheckCircle2,
  },
  pending: {
    type: 'warning' as const,
    text: 'Almost there! Stripe is verifying your details. This usually takes 1-2 business days.',
    icon: Clock,
  },
  error: {
    type: 'error' as const,
    text: 'Payment setup incomplete. Please try again or contact support if the issue persists.',
    icon: AlertCircle,
  },
}

export function SettingsContent({ profile, userEmail, stripeStatus }: SettingsContentProps) {
  const { refreshProfile } = useAuth()
  const router = useRouter()

  // Profile image
  const [customAvatarUrl, setCustomAvatarUrl] = useState(profile?.custom_avatar_url || null)

  // Profile fields
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [location, setLocation] = useState(profile?.location || '')

  // Social links
  const existingSocialLinks = (profile?.social_links || {}) as SocialLinks
  const [bggUsername, setBggUsername] = useState(existingSocialLinks.bgg_username || '')
  const [twitterHandle, setTwitterHandle] = useState(existingSocialLinks.twitter_handle || '')
  const [instagramHandle, setInstagramHandle] = useState(existingSocialLinks.instagram_handle || '')
  const [discordUsername, setDiscordUsername] = useState(existingSocialLinks.discord_username || '')
  const [websiteUrl, setWebsiteUrl] = useState(existingSocialLinks.website_url || '')

  // Privacy settings (default to public if not set)
  const [profileVisibility, setProfileVisibility] = useState(profile?.profile_visibility !== 'private')
  const [shelfVisibility, setShelfVisibility] = useState(profile?.shelf_visibility !== 'private')

  // Form state
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [usernameValid, setUsernameValid] = useState(true)

  // Stripe callback notification
  const [stripeNotification, setStripeNotification] = useState<{
    type: 'success' | 'warning' | 'error'
    text: string
    icon: typeof CheckCircle2
  } | null>(null)

  // Handle Stripe callback on mount
  useEffect(() => {
    if (stripeStatus && stripeStatus in STRIPE_MESSAGES) {
      const messageConfig = STRIPE_MESSAGES[stripeStatus as keyof typeof STRIPE_MESSAGES]
      setStripeNotification(messageConfig)
      // Clear the query param from URL without triggering a re-render
      router.replace('/settings', { scroll: false })
    }
  }, [stripeStatus, router])

  const handleSave = async () => {
    if (!profile) return
    if (!usernameValid) {
      setMessage({ type: 'error', text: 'Please fix the username before saving' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // Build social links object (only include non-empty values)
      const socialLinks: SocialLinks = {}
      if (bggUsername.trim()) socialLinks.bgg_username = bggUsername.trim()
      if (twitterHandle.trim()) socialLinks.twitter_handle = twitterHandle.trim().replace(/^@/, '')
      if (instagramHandle.trim()) socialLinks.instagram_handle = instagramHandle.trim().replace(/^@/, '')
      if (discordUsername.trim()) socialLinks.discord_username = discordUsername.trim()
      if (websiteUrl.trim()) socialLinks.website_url = websiteUrl.trim()

      await updateUserProfile(profile.id, {
        display_name: displayName || null,
        username: username || null,
        bio: bio || null,
        location: location || null,
        social_links: (Object.keys(socialLinks).length > 0 ? socialLinks : {}) as Json,
        profile_visibility: profileVisibility ? 'public' : 'private',
        shelf_visibility: shelfVisibility ? 'public' : 'private',
      })

      await refreshProfile()
      setMessage({ type: 'success', text: 'Settings saved successfully' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const bioCharCount = bio.length
  const bioMaxChars = 500

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and profile</p>
        </div>
      </div>

      {/* Stripe callback notification */}
      {stripeNotification && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
            stripeNotification.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : stripeNotification.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <stripeNotification.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">
              {stripeNotification.type === 'success'
                ? 'Payment Setup Complete'
                : stripeNotification.type === 'warning'
                ? 'Verification In Progress'
                : 'Setup Incomplete'}
            </p>
            <p className="text-sm mt-1 opacity-90">{stripeNotification.text}</p>
          </div>
          <button
            onClick={() => setStripeNotification(null)}
            className="text-current opacity-50 hover:opacity-100"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Avatar Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Upload a custom avatar for your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <ProfileImageUpload
                imageType="avatar"
                currentUrl={customAvatarUrl}
                onImageChange={(url) => {
                  setCustomAvatarUrl(url)
                  refreshProfile()
                }}
                placeholder={profile?.avatar_url ? "Upload a custom avatar to replace your Google profile picture" : "Upload an avatar image"}
              />
              {profile?.avatar_url && !customAvatarUrl && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <p className="text-sm text-muted-foreground">
                    Currently using your Google profile picture
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Your public profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <UsernameInput
              value={username}
              currentUsername={profile?.username}
              onChange={setUsername}
              onValidChange={setUsernameValid}
            />

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, bioMaxChars))}
                placeholder="Tell others about yourself..."
                rows={3}
              />
              <p className={`text-xs ${bioCharCount > bioMaxChars - 50 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {bioCharCount}/{bioMaxChars} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Social Links
            </CardTitle>
            <CardDescription>
              Connect your other profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bgg">BoardGameGeek</Label>
              <div className="relative">
                <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bgg"
                  value={bggUsername}
                  onChange={(e) => setBggUsername(e.target.value)}
                  placeholder="Your BGG username"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="twitter"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  placeholder="username (without @)"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
                <Input
                  id="instagram"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="username (without @)"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord">Discord</Label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="discord"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  placeholder="username#1234 or username"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BGG Import Section */}
        <BGGImportSection />

        {/* Privacy Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>
              Control who can see your profile and collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility" className="text-base">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to view your profile at /u/{username || 'username'}
                </p>
              </div>
              <Switch
                id="profile-visibility"
                checked={profileVisibility}
                onCheckedChange={setProfileVisibility}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shelf-visibility" className="text-base">Public Shelf</Label>
                <p className="text-sm text-muted-foreground">
                  Show your game collection on your public profile
                </p>
              </div>
              <Switch
                id="shelf-visibility"
                checked={shelfVisibility}
                onCheckedChange={setShelfVisibility}
                disabled={!profileVisibility}
              />
            </div>

            {!profileVisibility && (
              <p className="text-xs text-muted-foreground">
                Your profile must be public for others to see your shelf.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving || !usernameValid}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          {username && (
            <Button variant="outline" asChild>
              <Link href={`/u/${username}`}>
                View Profile
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
