'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Trash2,
  Plus,
  Users2,
  Gamepad2,
  CheckCircle2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GamePicker } from './GamePicker'
import { FamilyTreeView } from './FamilyTreeView'
import { WikipediaEnrichment } from './WikipediaEnrichment'
import { useAsyncAction, useAutoSlug } from '@/hooks/admin'
import type { Database } from '@/types/supabase'
import type { Game, GameFamily, GameRelation } from '@/types/database'

interface FamilyEditorProps {
  family?: GameFamily & { games?: Game[]; relations?: GameRelation[] }
  isNew?: boolean
}

export function FamilyEditor({ family: initialFamily, isNew = false }: FamilyEditorProps) {
  const router = useRouter()
  const [family, setFamily] = useState(
    initialFamily || {
      id: '',
      name: '',
      slug: '',
      description: null,
      hero_image_url: null,
      base_game_id: null,
      created_at: null,
      updated_at: null,
    }
  )
  const [games, setGames] = useState<Game[]>(initialFamily?.games || [])
  const [relations, setRelations] = useState<GameRelation[]>(initialFamily?.relations || [])
  const { saving, saved, execute, markUnsaved } = useAsyncAction()
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { handleNameChange: autoSlugNameChange } = useAutoSlug({
    isNew,
    currentSlug: family.slug,
    currentName: family.name,
  })

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load games and relations if editing existing family
  // Note: Initial data comes from server, this is for refreshing after edits
  useEffect(() => {
    // Skip if we already have data from server
    if (initialFamily?.games && initialFamily.games.length > 0) {
      return
    }

    if (!isNew && initialFamily?.id) {
      const loadGamesAndRelations = async () => {
        // Load games
        const { data: gamesData } = await supabase
          .from('games')
          .select('*')
          .eq('family_id', initialFamily.id)
          .order('year_published', { ascending: true, nullsFirst: false })

        setGames(gamesData || [])

        // Load relations between games in this family
        if (gamesData && gamesData.length > 0) {
          const gameIds = gamesData.map(g => g.id)
          // First get relations where source is in family
          const { data: sourceRelations } = await supabase
            .from('game_relations')
            .select('*')
            .in('source_game_id', gameIds)

          // Filter to only include relations where target is also in family
          const filteredRelations = (sourceRelations || []).filter(r =>
            gameIds.includes(r.target_game_id)
          )
          setRelations(filteredRelations)
        }
      }
      loadGamesAndRelations()
    }
  }, [initialFamily?.id, initialFamily?.games, isNew, supabase])

  const updateField = <K extends keyof typeof family>(
    field: K,
    value: (typeof family)[K]
  ) => {
    setFamily((prev) => ({ ...prev, [field]: value }))
    markUnsaved()
  }

  const handleNameChange = (name: string) => {
    autoSlugNameChange(
      name,
      (n) => setFamily((prev) => ({ ...prev, name: n })),
      (s) => setFamily((prev) => ({ ...prev, slug: s }))
    )
    markUnsaved()
  }

  const saveFamily = async () => {
    if (!family.name || !family.slug) {
      alert('Name and slug are required')
      return
    }

    await execute(async () => {
      if (isNew) {
        const response = await fetch('/api/admin/families', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: family.name,
            slug: family.slug,
            description: family.description,
            hero_image_url: family.hero_image_url,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create family')
        }

        router.push(`/admin/families/${data.family.id}`)
        router.refresh()
      } else {
        const response = await fetch('/api/admin/families', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyId: family.id,
            data: {
              name: family.name,
              slug: family.slug,
              description: family.description,
              hero_image_url: family.hero_image_url,
            },
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save family')
        }

        router.refresh()
      }
    })
  }

  const deleteFamily = async () => {
    setDeleting(true)

    try {
      const response = await fetch('/api/admin/families', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: family.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete family')
      }

      router.push('/admin/families')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Add game to family
  const addGameToFamily = useCallback(
    async (game: Game) => {
      if (!family.id) return

      try {
        const response = await fetch('/api/admin/games', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            data: { family_id: family.id },
          }),
        })

        if (response.ok) {
          setGames((prev) => [...prev, game].sort((a, b) => a.name.localeCompare(b.name)))
        }
      } catch (error) {
        console.error('Error adding game to family:', error)
      }
    },
    [family.id]
  )

  // Remove game from family
  const removeGameFromFamily = useCallback(async (gameId: string) => {
    try {
      const response = await fetch('/api/admin/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          data: { family_id: null },
        }),
      })

      if (response.ok) {
        setGames((prev) => prev.filter((g) => g.id !== gameId))
      }
    } catch (error) {
      console.error('Error removing game from family:', error)
    }
  }, [])

  // Get excluded game IDs (games already in this family)
  const excludedGameIds = games.map((g) => g.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/families" className="self-start">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Families
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? 'New Family' : family.name}
          </h1>
          {!isNew && family.slug && (
            <p className="text-muted-foreground text-sm mt-0.5">/{family.slug}</p>
          )}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {!isNew && (
            <>
              <Link href={`/families/${family.slug}`} target="_blank">
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
                    <DialogTitle>Delete Family</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{family.name}&quot;? This will remove
                      all games from this family. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deleteFamily}
                      disabled={deleting}
                    >
                      {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Delete Family
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          <Button
            onClick={saveFamily}
            disabled={saving}
            className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isNew ? 'Create Family' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Family Details */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Family Details</CardTitle>
              <CardDescription>Basic information about this game family</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Family Name</Label>
              <Input
                id="name"
                value={family.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Catan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  /families/
                </span>
                <Input
                  id="slug"
                  value={family.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  className="pl-20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={family.description || ''}
              onChange={(e) => updateField('description', e.target.value || null)}
              rows={3}
              placeholder="Describe this game family and what connects the games..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero_image_url">Hero Image URL</Label>
            <Input
              id="hero_image_url"
              value={family.hero_image_url || ''}
              onChange={(e) => updateField('hero_image_url', e.target.value || null)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Optional banner image for the family page
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Wikipedia Enrichment - only show for existing families */}
      {!isNew && (
        <WikipediaEnrichment
          familyId={family.id}
          familyName={family.name}
          hasWikipediaUrl={games.some(g => g.wikipedia_url)}
          onGamesLinked={async () => {
            // Refresh games list after linking
            const { data: gamesData } = await supabase
              .from('games')
              .select('*')
              .eq('family_id', family.id)
              .order('year_published', { ascending: true, nullsFirst: false })
            setGames(gamesData || [])
          }}
        />
      )}

      {/* Games in Family - only show for existing families */}
      {!isNew && (
        <div className="space-y-4">
          {/* Add Game Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {games.length} {games.length === 1 ? 'game' : 'games'} in family
              </span>
            </div>
            <GamePicker
              onSelect={addGameToFamily}
              excludeGameIds={excludedGameIds}
              trigger={
                <>
                  <Plus className="h-4 w-4" />
                  Add Game
                </>
              }
            />
          </div>

          {/* Family Tree Visualization */}
          <FamilyTreeView
            games={games}
            relations={relations}
            baseGameId={family.base_game_id}
            familyId={family.id}
            onRelationCreated={async () => {
              // Refresh relations after a new one is created
              if (games.length > 0) {
                const gameIds = games.map(g => g.id)
                const { data: sourceRelations } = await supabase
                  .from('game_relations')
                  .select('*')
                  .in('source_game_id', gameIds)

                const filteredRelations = (sourceRelations || []).filter(r =>
                  gameIds.includes(r.target_game_id)
                )
                setRelations(filteredRelations)
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
