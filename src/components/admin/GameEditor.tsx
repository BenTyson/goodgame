'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DetailsTab, DocumentsTab, ContentTab, TaxonomyTab, SourcesTab, MediaTab, PurchaseLinksTab, PuffinTab } from './game-editor'
import type { TaxonomyTabRef } from './game-editor'
import { useAsyncAction, useGameEditorShortcuts, useGameEditorCache } from '@/hooks/admin'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  CheckCircle2,
  Info,
  Files,
  FileText,
  Tags,
  Database,
  Film,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Globe,
  Sparkles,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { GameVideo } from '@/components/admin/VideoManager'
import type { Game, GameImage } from '@/types/database'
import type { GameEditorData, GameWithMedia, LinkedEntity } from '@/lib/supabase/game-queries'

interface GameEditorProps {
  editorData: GameEditorData
}

export function GameEditor({ editorData }: GameEditorProps) {
  const { game: initialGame, adjacentGames, taxonomy, documents, purchase } = editorData
  const router = useRouter()
  const { setCache, invalidate } = useGameEditorCache()
  const taxonomyRef = useRef<TaxonomyTabRef>(null)
  const [game, setGame] = useState(initialGame)
  const [images, setImages] = useState(initialGame.images)
  const [videos, setVideos] = useState(initialGame.videos)
  // Entity state (designers, publishers, artists)
  const [designers, setDesigners] = useState<LinkedEntity[]>(initialGame.linked_designers)
  const [publishers, setPublishers] = useState<LinkedEntity[]>(initialGame.linked_publishers)
  const [artists, setArtists] = useState<LinkedEntity[]>(initialGame.linked_artists)
  const [hasDetailsChanges, setHasDetailsChanges] = useState(false)
  const [hasEntitiesChanges, setHasEntitiesChanges] = useState(false)
  const [hasTaxonomyChanges, setHasTaxonomyChanges] = useState(false)
  const { saving, saved, execute } = useAsyncAction({
    onSuccess: () => {
      setHasDetailsChanges(false)
      setHasEntitiesChanges(false)
      setHasTaxonomyChanges(false)
    },
  })

  // Cache the editor data on mount/navigation
  useEffect(() => {
    setCache(initialGame.id, editorData)
  }, [initialGame.id, editorData, setCache])

  // Combined unsaved state (details OR entities OR taxonomy)
  const hasUnsavedChanges = hasDetailsChanges || hasEntitiesChanges || hasTaxonomyChanges

  // Track unsaved changes for details/content/media
  const markUnsaved = useCallback(() => {
    setHasDetailsChanges(true)
  }, [])

  // Track taxonomy unsaved changes (called by TaxonomyTab)
  const handleTaxonomyUnsavedChange = useCallback((hasUnsaved: boolean) => {
    setHasTaxonomyChanges(hasUnsaved)
  }, [])

  // Keyboard shortcuts and navigation
  const { goToPrevious, goToNext } = useGameEditorShortcuts({
    onSave: () => saveGame(),
    previousGameUrl: adjacentGames.previous ? `/admin/games/${adjacentGames.previous.id}` : null,
    nextGameUrl: adjacentGames.next ? `/admin/games/${adjacentGames.next.id}` : null,
    hasUnsavedChanges,
    isSaving: saving,
  })

  // Sync state when server data changes (e.g., after router.refresh() or navigation)
  useEffect(() => {
    setGame(initialGame)
    setImages(initialGame.images)
    setVideos(initialGame.videos)
    setDesigners(initialGame.linked_designers)
    setPublishers(initialGame.linked_publishers)
    setArtists(initialGame.linked_artists)
    setHasDetailsChanges(false)
    setHasEntitiesChanges(false)
    setHasTaxonomyChanges(false)
  }, [initialGame])

  const updateField = useCallback(<K extends keyof Game>(field: K, value: Game[K]) => {
    setGame(prev => ({ ...prev, [field]: value }))
    markUnsaved()
  }, [markUnsaved])

  // Entity change handlers
  const handleDesignersChange = useCallback((entities: LinkedEntity[]) => {
    setDesigners(entities)
    setHasEntitiesChanges(true)
  }, [])

  const handlePublishersChange = useCallback((entities: LinkedEntity[]) => {
    setPublishers(entities)
    setHasEntitiesChanges(true)
  }, [])

  const handleArtistsChange = useCallback((entities: LinkedEntity[]) => {
    setArtists(entities)
    setHasEntitiesChanges(true)
  }, [])

  const saveGame = async () => {
    // Ensure content_status is 'published' when publishing
    const contentStatus = game.is_published ? 'published' : (game.content_status || 'none')

    // Note: Image URLs (hero_image_url, box_image_url, thumbnail_url) are synced
    // automatically by the /api/admin/upload PATCH endpoint when setting primary image.
    // No need to include them here.

    await execute(async () => {
      // Save game details if changed
      if (hasDetailsChanges) {
        const response = await fetch('/api/admin/games', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            data: {
              name: game.name,
              slug: game.slug,
              description: game.description,
              tagline: game.tagline,
              player_count_min: game.player_count_min,
              player_count_max: game.player_count_max,
              play_time_min: game.play_time_min,
              play_time_max: game.play_time_max,
              weight: game.weight,
              min_age: game.min_age,
              year_published: game.year_published,
              is_published: game.is_published,
              is_featured: game.is_featured,
              is_trending: game.is_trending,
              is_top_rated: game.is_top_rated,
              is_staff_pick: game.is_staff_pick,
              is_hidden_gem: game.is_hidden_gem,
              is_new_release: game.is_new_release,
              content_status: contentStatus,
              rules_content: game.rules_content,
              setup_content: game.setup_content,
              reference_content: game.reference_content,
              amazon_asin: game.amazon_asin,
            }
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Save failed')
        }
      }

      // Save entity links if changed (designers, publishers, artists)
      if (hasEntitiesChanges) {
        const entitySavePromises = [
          fetch('/api/admin/entities/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: game.id,
              type: 'designers',
              entities: designers.map((d, i) => ({ id: d.id, is_primary: i === 0 })),
            }),
          }),
          fetch('/api/admin/entities/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: game.id,
              type: 'publishers',
              entities: publishers.map((p, i) => ({ id: p.id, is_primary: i === 0 })),
            }),
          }),
          fetch('/api/admin/entities/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: game.id,
              type: 'artists',
              entities: artists.map(a => ({ id: a.id })),
            }),
          }),
        ]

        const results = await Promise.all(entitySavePromises)
        const failedSave = results.find(r => !r.ok)
        if (failedSave) {
          const data = await failedSave.json()
          throw new Error(data.error || 'Failed to save entity links')
        }
      }

      // Save taxonomy if changed
      if (hasTaxonomyChanges && taxonomyRef.current) {
        const taxonomySaved = await taxonomyRef.current.save()
        if (!taxonomySaved) {
          throw new Error('Failed to save taxonomy')
        }
      }

      // Invalidate cache to ensure fresh data after save
      invalidate(game.id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 self-start">
          <Link href="/admin/games">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Games
            </Button>
          </Link>
          {/* Navigation buttons */}
          <div className="flex items-center border-l pl-2 ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToPrevious}
                  disabled={!adjacentGames.previous}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {adjacentGames.previous ? (
                  <span>{adjacentGames.previous.name} <kbd className="ml-1 text-xs opacity-60">Cmd+[</kbd></span>
                ) : (
                  <span>No previous game</span>
                )}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToNext}
                  disabled={!adjacentGames.next}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {adjacentGames.next ? (
                  <span>{adjacentGames.next.name} <kbd className="ml-1 text-xs opacity-60">Cmd+]</kbd></span>
                ) : (
                  <span>No next game</span>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{game.name}</h1>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Unsaved: {[
                  hasDetailsChanges && 'Details',
                  hasEntitiesChanges && 'Entities',
                  hasTaxonomyChanges && 'Taxonomy',
                ].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">/{game.slug}</p>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-center">
          {/* Publish Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="publish-toggle"
              checked={game.is_published || false}
              onCheckedChange={(checked) => updateField('is_published', checked)}
              className="data-[state=checked]:bg-green-600"
            />
            <Label
              htmlFor="publish-toggle"
              className={`text-sm font-medium flex items-center gap-1.5 cursor-pointer ${
                game.is_published ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              {game.is_published ? (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Published
                </>
              ) : (
                'Draft'
              )}
            </Label>
          </div>
          <div className="h-6 w-px bg-border" />
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {game.slug ? (
            <Link href={`/games/${game.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">{game.is_published ? 'View Live' : 'Preview'}</span>
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="gap-2" disabled title="Add a slug to preview">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={saveGame}
                disabled={saving || !hasUnsavedChanges}
                className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <kbd className="text-xs">Cmd+S</kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Editor Tabs - 8 tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 lg:w-auto lg:inline-grid bg-muted/50 border border-border/50 p-1 rounded-xl">
          <TabsTrigger
            value="details"
            className="gap-2 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Info className="h-4 w-4 hidden sm:block" />
            Details
          </TabsTrigger>
          <TabsTrigger
            value="taxonomy"
            className="gap-2 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Tags className="h-4 w-4 hidden sm:block" />
            Taxonomy
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="gap-2 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Files className="h-4 w-4 hidden sm:block" />
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="gap-2 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <FileText className="h-4 w-4 hidden sm:block" />
            Content
          </TabsTrigger>
          <TabsTrigger
            value="sources"
            className="gap-2 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Database className="h-4 w-4 hidden sm:block" />
            Sources
          </TabsTrigger>
          <TabsTrigger
            value="puffin"
            className="gap-2 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Sparkles className="h-4 w-4 hidden sm:block" />
            Puffin
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="gap-2 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Film className="h-4 w-4 hidden sm:block" />
            Media
          </TabsTrigger>
          <TabsTrigger
            value="purchase"
            className="gap-2 data-[state=active]:!bg-primary/10 data-[state=active]:!text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <ShoppingCart className="h-4 w-4 hidden sm:block" />
            Purchase
          </TabsTrigger>
        </TabsList>

        {/* Details Tab (includes Publishing) */}
        <TabsContent value="details">
          <DetailsTab
            game={game}
            updateField={updateField}
            designers={designers}
            publishers={publishers}
            artists={artists}
            onDesignersChange={handleDesignersChange}
            onPublishersChange={handlePublishersChange}
            onArtistsChange={handleArtistsChange}
          />
        </TabsContent>

        {/* Taxonomy Tab */}
        <TabsContent value="taxonomy">
          <TaxonomyTab ref={taxonomyRef} game={game} initialData={taxonomy} onUnsavedChange={handleTaxonomyUnsavedChange} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentsTab
            game={game}
            initialData={documents}
            onRulebookUrlChange={(url) => updateField('rulebook_url', url)}
          />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <ContentTab game={game} updateField={updateField} />
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources">
          <SourcesTab game={game} />
        </TabsContent>

        {/* Puffin Tab */}
        <TabsContent value="puffin">
          <PuffinTab game={game} />
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <MediaTab
            game={game}
            images={images}
            videos={videos}
            onImagesChange={setImages}
            onVideosChange={setVideos}
            markUnsaved={markUnsaved}
          />
        </TabsContent>

        {/* Purchase Tab */}
        <TabsContent value="purchase">
          <PurchaseLinksTab game={game} initialData={purchase} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
