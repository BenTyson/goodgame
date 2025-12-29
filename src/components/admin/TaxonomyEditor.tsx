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
  FolderTree,
  Cog,
  Wand2,
  Users,
  Gamepad2,
  ExternalLink,
  Hash,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { generateSlug } from '@/lib/utils/slug'
import type { Category, Mechanic, Theme, PlayerExperience, Game } from '@/types/database'

type TaxonomyType = 'category' | 'mechanic' | 'theme' | 'player-experience'

interface TaxonomyEditorProps {
  type: TaxonomyType
  item?: (Category | Mechanic | Theme | PlayerExperience) & { games?: Game[] }
  isNew?: boolean
}

const typeConfig = {
  category: {
    name: 'Category',
    namePlural: 'Categories',
    icon: FolderTree,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    backHref: '/admin/taxonomy/categories',
    apiEndpoint: '/api/admin/taxonomy/categories',
    viewPath: '/categories',
  },
  mechanic: {
    name: 'Mechanic',
    namePlural: 'Mechanics',
    icon: Cog,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    backHref: '/admin/taxonomy/mechanics',
    apiEndpoint: '/api/admin/taxonomy/mechanics',
    viewPath: '/mechanics',
  },
  theme: {
    name: 'Theme',
    namePlural: 'Themes',
    icon: Wand2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    backHref: '/admin/taxonomy/themes',
    apiEndpoint: '/api/admin/taxonomy/themes',
    viewPath: '/themes',
  },
  'player-experience': {
    name: 'Player Experience',
    namePlural: 'Player Experiences',
    icon: Users,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    backHref: '/admin/taxonomy/player-experiences',
    apiEndpoint: '/api/admin/taxonomy/player-experiences',
    viewPath: '/player-experiences',
  },
}

export function TaxonomyEditor({ type, item: initialItem, isNew = false }: TaxonomyEditorProps) {
  const router = useRouter()
  const config = typeConfig[type]
  const Icon = config.icon

  const [item, setItem] = useState(
    initialItem || {
      id: '',
      name: '',
      slug: '',
      description: null,
      icon: null,
      display_order: 0,
      is_primary: false,
      bgg_id: null,
      created_at: null,
      updated_at: null,
    }
  )
  const [games] = useState<Game[]>((initialItem as { games?: Game[] })?.games || [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: string, value: any) => {
    setItem((prev) => ({ ...prev, [field]: value }))
  }

  const handleNameChange = (name: string) => {
    updateField('name', name)
    // Auto-generate slug for new items or if slug matches old auto-generated slug
    if (isNew || item.slug === generateSlug(item.name)) {
      updateField('slug', generateSlug(name))
    }
  }

  const saveItem = async () => {
    if (!item.name || !item.slug) {
      alert('Name and slug are required')
      return
    }

    setSaving(true)

    try {
      const payload = {
        name: item.name,
        slug: item.slug,
        description: item.description || null,
        icon: (item as Category).icon || null,
        display_order: (item as Category).display_order || 0,
        is_primary: (item as Category).is_primary || false,
        bgg_id: (item as Mechanic).bgg_id || null,
      }

      if (isNew) {
        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `Failed to create ${config.name.toLowerCase()}`)
        }

        router.push(`${config.backHref}/${data.item.id}`)
        router.refresh()
      } else {
        const response = await fetch(config.apiEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            data: payload,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to save ${config.name.toLowerCase()}`)
        }

        router.refresh()
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async () => {
    setDeleting(true)

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to delete ${config.name.toLowerCase()}`)
      }

      router.push(config.backHref)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href={config.backHref} className="self-start">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {config.namePlural}
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Icon className={`h-6 w-6 ${config.color}`} />
            {isNew ? `New ${config.name}` : item.name}
          </h1>
          {!isNew && item.slug && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {config.viewPath}/{item.slug}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {!isNew && (
            <>
              <Link href={`${config.viewPath}/${item.slug}`} target="_blank">
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
                    <DialogTitle>Delete {config.name}</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{item.name}&quot;?
                      {games.length > 0 && (
                        <> This {config.name.toLowerCase()} is linked to {games.length} game(s). They will be unlinked but not deleted.</>
                      )}
                      {' '}This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deleteItem}
                      disabled={deleting}
                    >
                      {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Delete {config.name}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          <Button onClick={saveItem} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isNew ? `Create ${config.name}` : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{config.name} Details</CardTitle>
              <CardDescription>Basic information about this {config.name.toLowerCase()}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={item.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={`e.g., ${type === 'category' ? 'Strategy' : 'Worker Placement'}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {config.viewPath}/
                </span>
                <Input
                  id="slug"
                  value={item.slug}
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
              value={item.description || ''}
              onChange={(e) => updateField('description', e.target.value || null)}
              rows={3}
              placeholder={`Describe this ${config.name.toLowerCase()}...`}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Lucide name)</Label>
              <Input
                id="icon"
                value={(item as Category).icon || ''}
                onChange={(e) => updateField('icon', e.target.value || null)}
                placeholder="e.g., brain, users, handshake"
              />
              <p className="text-xs text-muted-foreground">
                See <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev</a> for icon names
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={(item as Category).display_order || 0}
                onChange={(e) => updateField('display_order', parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>

          {type === 'category' && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_primary"
                checked={(item as Category).is_primary || false}
                onCheckedChange={(checked) => updateField('is_primary', checked)}
              />
              <Label htmlFor="is_primary">Primary category (shown prominently in filters)</Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BGG Integration Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Hash className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">BGG Integration</CardTitle>
              <CardDescription>Link to BoardGameGeek for imports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bgg_id">BGG ID</Label>
            <Input
              id="bgg_id"
              type="number"
              value={(item as Mechanic).bgg_id || ''}
              onChange={(e) => updateField('bgg_id', parseInt(e.target.value) || null)}
              placeholder="e.g., 2082 (for Worker Placement)"
            />
            <p className="text-xs text-muted-foreground">
              The BGG ID allows automatic linking when importing games from BoardGameGeek
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Linked Games - only show for existing items */}
      {!isNew && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Gamepad2 className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Linked Games</CardTitle>
                  <CardDescription>Games with this {config.name.toLowerCase()}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">
                {games.length} {games.length === 1 ? 'game' : 'games'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {games.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
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
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                      </div>
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
                No games linked to this {config.name.toLowerCase()} yet.
                Games are linked via the BGG import or game editor.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
