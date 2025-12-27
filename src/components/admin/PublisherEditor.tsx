'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Trash2,
  Building2,
  Gamepad2,
  ExternalLink,
  Globe,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LogoUpload } from './LogoUpload'
import { getInitials, getInitialsColor } from '@/components/publishers/utils'
import type { Publisher, Game } from '@/types/database'

interface PublisherEditorProps {
  publisher?: Publisher & { games?: Game[] }
  isNew?: boolean
}

export function PublisherEditor({ publisher: initialPublisher, isNew = false }: PublisherEditorProps) {
  const router = useRouter()
  const [publisher, setPublisher] = useState(
    initialPublisher || {
      id: '',
      name: '',
      slug: '',
      description: null,
      logo_url: null,
      website: null,
      bgg_id: null,
      created_at: null,
      updated_at: null,
    }
  )
  const [games] = useState<Game[]>(initialPublisher?.games || [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const updateField = <K extends keyof typeof publisher>(
    field: K,
    value: (typeof publisher)[K]
  ) => {
    setPublisher((prev) => ({ ...prev, [field]: value }))
  }

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    updateField('name', name)
    if (isNew || publisher.slug === generateSlug(publisher.name)) {
      updateField('slug', generateSlug(name))
    }
  }

  const savePublisher = async () => {
    if (!publisher.name || !publisher.slug) {
      alert('Name and slug are required')
      return
    }

    setSaving(true)

    try {
      if (isNew) {
        const response = await fetch('/api/admin/publishers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: publisher.name,
            slug: publisher.slug,
            description: publisher.description,
            website: publisher.website,
            logo_url: publisher.logo_url,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create publisher')
        }

        router.push(`/admin/publishers/${data.publisher.id}`)
        router.refresh()
      } else {
        const response = await fetch('/api/admin/publishers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publisherId: publisher.id,
            data: {
              name: publisher.name,
              slug: publisher.slug,
              description: publisher.description,
              website: publisher.website,
              logo_url: publisher.logo_url,
            },
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save publisher')
        }

        router.refresh()
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deletePublisher = async () => {
    setDeleting(true)

    try {
      const response = await fetch('/api/admin/publishers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publisherId: publisher.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete publisher')
      }

      router.push('/admin/publishers')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleLogoChange = (logoUrl: string | null) => {
    updateField('logo_url', logoUrl)
  }

  const initials = getInitials(publisher.name || 'New')
  const colorClass = getInitialsColor(publisher.name || 'New')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/publishers" className="self-start">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Publishers
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? 'New Publisher' : publisher.name}
          </h1>
          {!isNew && publisher.slug && (
            <p className="text-muted-foreground text-sm mt-0.5">/publishers/{publisher.slug}</p>
          )}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {!isNew && (
            <>
              <Link href={`/publishers/${publisher.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">View Live</span>
                </Button>
              </Link>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Publisher</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{publisher.name}&quot;? Games will remain
                      in the system but will no longer be linked to this publisher. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deletePublisher}
                      disabled={deleting}
                    >
                      {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Delete Publisher
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          <Button onClick={savePublisher} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isNew ? 'Create Publisher' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Publisher Details */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Publisher Details</CardTitle>
              <CardDescription>Basic information about this publisher</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Publisher Name</Label>
              <Input
                id="name"
                value={publisher.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Fantasy Flight Games"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  /publishers/
                </span>
                <Input
                  id="slug"
                  value={publisher.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  className="pl-24"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={publisher.description || ''}
              onChange={(e) => updateField('description', e.target.value || null)}
              rows={3}
              placeholder="Describe this publisher and their catalog of games..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  value={publisher.website || ''}
                  onChange={(e) => updateField('website', e.target.value || null)}
                  placeholder="https://www.publisher.com"
                  className="pl-9"
                />
              </div>
              {publisher.website && (
                <a href={publisher.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Publisher Logo</CardTitle>
              <CardDescription>Upload a logo for this publisher</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isNew ? (
            <LogoUpload
              publisherId={publisher.id}
              publisherSlug={publisher.slug}
              currentLogoUrl={publisher.logo_url}
              onLogoChange={handleLogoChange}
            />
          ) : (
            <div className="text-center py-8">
              <div className={`mx-auto h-24 w-24 rounded-xl ${colorClass} flex items-center justify-center text-white font-bold text-3xl mb-4`}>
                {initials}
              </div>
              <p className="text-sm text-muted-foreground">
                Save the publisher first, then you can upload a logo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo Preview (fallback) */}
      {!isNew && !publisher.logo_url && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Logo Preview</CardTitle>
            <CardDescription>This is how the publisher will appear without a logo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-xl ${colorClass} flex items-center justify-center text-white font-bold text-xl`}>
                {initials}
              </div>
              <div>
                <p className="font-medium">{publisher.name}</p>
                <p className="text-sm text-muted-foreground">
                  Colored initials will be used until you upload a logo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Games linked to this publisher - only show for existing publishers */}
      {!isNew && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Gamepad2 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Published Games</CardTitle>
                  <CardDescription>Games linked to this publisher</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">
                {games.length} {games.length === 1 ? 'game' : 'games'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {games.length > 0 ? (
              <div className="space-y-2">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    {game.thumbnail_url ? (
                      <div className="relative h-10 w-10 rounded overflow-hidden shrink-0">
                        <Image
                          src={game.thumbnail_url}
                          alt={game.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <Gamepad2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <Link
                      href={`/admin/games/${game.id}`}
                      className="font-medium hover:text-primary transition-colors flex-1 truncate"
                    >
                      {game.name}
                    </Link>
                    {game.year_published && (
                      <span className="text-sm text-muted-foreground">
                        {game.year_published}
                      </span>
                    )}
                    {game.is_published && (
                      <Link
                        href={`/games/${game.slug}`}
                        target="_blank"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No games linked to this publisher yet. Games are linked via the BGG import or game editor.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
