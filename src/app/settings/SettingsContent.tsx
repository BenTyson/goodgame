'use client'

import { useState } from 'react'
import { Settings, User, Link2, Eye, Globe, Twitter, Gamepad2, MessageCircle, MapPin, ImageIcon } from 'lucide-react'
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
import type { UserProfile, SocialLinks, Json } from '@/types/database'

interface SettingsContentProps {
  profile: UserProfile | null
  userEmail: string
}

export function SettingsContent({ profile, userEmail }: SettingsContentProps) {
  const { refreshProfile } = useAuth()

  // Profile images
  const [headerImageUrl, setHeaderImageUrl] = useState(profile?.header_image_url || null)
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

      <div className="space-y-6">
        {/* Profile Images Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Profile Images
            </CardTitle>
            <CardDescription>
              Customize your profile with a header banner and avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfileImageUpload
              imageType="header"
              currentUrl={headerImageUrl}
              onImageChange={(url) => {
                setHeaderImageUrl(url)
                refreshProfile()
              }}
              placeholder="A banner image displayed at the top of your profile"
            />

            <div className="border-t pt-6">
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

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving || !usernameValid}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
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
