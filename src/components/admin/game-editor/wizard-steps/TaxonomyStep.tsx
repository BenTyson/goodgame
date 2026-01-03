'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TaxonomySelector } from '../TaxonomySelector'
import { Tags, Sparkles, Users, AlertCircle } from 'lucide-react'
import type { Game, Theme, PlayerExperience, TaxonomySuggestion } from '@/types/database'
import type { SelectedTaxonomyItem } from '@/lib/admin/wizard'
import { WizardStepHeader } from './WizardStepHeader'

interface TaxonomyStepProps {
  game: Game
  onComplete: () => void
  onSkip: () => void
}

interface TaxonomyData {
  themes: Theme[]
  playerExperiences: PlayerExperience[]
  currentThemes: { theme_id: string; is_primary: boolean }[]
  currentExperiences: { player_experience_id: string; is_primary: boolean }[]
  suggestions: TaxonomySuggestion[]
}

export function TaxonomyStep({ game, onComplete, onSkip }: TaxonomyStepProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TaxonomyData | null>(null)

  // Selected state
  const [selectedThemes, setSelectedThemes] = useState<SelectedTaxonomyItem[]>([])
  const [selectedExperiences, setSelectedExperiences] = useState<SelectedTaxonomyItem[]>([])

  // Track which suggestions were originally suggested by AI
  const [themeSuggestionIds, setThemeSuggestionIds] = useState<Set<string>>(new Set())
  const [experienceSuggestionIds, setExperienceSuggestionIds] = useState<Set<string>>(new Set())

  // Track initial state for detecting unsaved changes
  const initialStateRef = useRef<{ themes: SelectedTaxonomyItem[]; experiences: SelectedTaxonomyItem[] } | null>(null)

  // Ref to track if save is needed on unmount
  const saveOnUnmountRef = useRef<(() => Promise<void>) | null>(null)

  // Load taxonomy data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/games/taxonomy?gameId=${game.id}`)
        if (!response.ok) {
          throw new Error('Failed to load taxonomy data')
        }

        const result: TaxonomyData = await response.json()
        setData(result)

        // Initialize selected items from current assignments
        const currentThemeSelections = result.currentThemes.map(t => ({
          id: t.theme_id,
          isPrimary: t.is_primary ?? false,
        }))

        const currentExperienceSelections = result.currentExperiences.map(e => ({
          id: e.player_experience_id,
          isPrimary: e.is_primary ?? false,
        }))

        // If no current assignments, pre-select AI suggestions
        let initialThemes: SelectedTaxonomyItem[]
        let initialExperiences: SelectedTaxonomyItem[]

        if (currentThemeSelections.length === 0) {
          const themeSuggestions = result.suggestions
            .filter(s => s.suggestion_type === 'theme' && s.target_id)
            .map(s => ({
              id: s.target_id!,
              isPrimary: s.is_primary ?? false,
            }))
          initialThemes = themeSuggestions
          setSelectedThemes(themeSuggestions)
          setThemeSuggestionIds(new Set(themeSuggestions.map(t => t.id)))
        } else {
          initialThemes = currentThemeSelections
          setSelectedThemes(currentThemeSelections)
        }

        if (currentExperienceSelections.length === 0) {
          const expSuggestions = result.suggestions
            .filter(s => s.suggestion_type === 'player_experience' && s.target_id)
            .map(s => ({
              id: s.target_id!,
              isPrimary: s.is_primary ?? false,
            }))
          initialExperiences = expSuggestions
          setSelectedExperiences(expSuggestions)
          setExperienceSuggestionIds(new Set(expSuggestions.map(e => e.id)))
        } else {
          initialExperiences = currentExperienceSelections
          setSelectedExperiences(currentExperienceSelections)
        }

        // Store initial state for change detection
        initialStateRef.current = { themes: initialThemes, experiences: initialExperiences }

        // Mark step as complete (data loaded, Next button enabled)
        onComplete()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load taxonomy data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [game.id])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialStateRef.current) return false
    const { themes: initialThemes, experiences: initialExperiences } = initialStateRef.current

    // Compare themes
    if (selectedThemes.length !== initialThemes.length) return true
    const themeChanged = selectedThemes.some(t => {
      const initial = initialThemes.find(it => it.id === t.id)
      return !initial || initial.isPrimary !== t.isPrimary
    })
    if (themeChanged) return true

    // Compare experiences
    if (selectedExperiences.length !== initialExperiences.length) return true
    const expChanged = selectedExperiences.some(e => {
      const initial = initialExperiences.find(ie => ie.id === e.id)
      return !initial || initial.isPrimary !== e.isPrimary
    })
    return expChanged
  }, [selectedThemes, selectedExperiences])

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      setError(null)

      // Determine which suggestions were accepted vs rejected
      const acceptedSuggestionIds: string[] = []
      const rejectedSuggestionIds: string[] = []

      if (data) {
        for (const suggestion of data.suggestions) {
          if (suggestion.target_id) {
            const isSelected = suggestion.suggestion_type === 'theme'
              ? selectedThemes.some(t => t.id === suggestion.target_id)
              : selectedExperiences.some(e => e.id === suggestion.target_id)

            if (isSelected) {
              acceptedSuggestionIds.push(suggestion.id)
            } else {
              rejectedSuggestionIds.push(suggestion.id)
            }
          }
        }
      }

      const response = await fetch('/api/admin/games/taxonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          themes: selectedThemes.map(t => ({
            themeId: t.id,
            isPrimary: t.isPrimary,
          })),
          experiences: selectedExperiences.map(e => ({
            experienceId: e.id,
            isPrimary: e.isPrimary,
          })),
          acceptedSuggestionIds,
          rejectedSuggestionIds,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to save taxonomy')
      }

      // Update initial state to reflect saved state
      initialStateRef.current = { themes: [...selectedThemes], experiences: [...selectedExperiences] }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save taxonomy')
    } finally {
      setSaving(false)
    }
  }, [game.id, selectedThemes, selectedExperiences, data])

  // Update ref for auto-save on unmount
  useEffect(() => {
    saveOnUnmountRef.current = handleSave
  }, [handleSave])

  // Auto-save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      // Fire-and-forget save on unmount if needed
      if (initialStateRef.current && saveOnUnmountRef.current) {
        // We can't check hasUnsavedChanges here directly since it's computed
        // So we store a ref to the save function and call it
        // The save will only POST if there are changes (the API handles this gracefully)
        saveOnUnmountRef.current()
      }
    }
  }, []) // Empty deps - only runs on unmount

  // Count AI suggestions
  const themeSuggestionsCount = data?.suggestions.filter(s => s.suggestion_type === 'theme').length ?? 0
  const expSuggestionsCount = data?.suggestions.filter(s => s.suggestion_type === 'player_experience').length ?? 0
  const newSuggestionsCount = data?.suggestions.filter(
    s => s.suggestion_type === 'new_theme' || s.suggestion_type === 'new_experience'
  ).length ?? 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalSuggestions = themeSuggestionsCount + expSuggestionsCount

  return (
    <Card>
      <WizardStepHeader
        stepNumber={3}
        title="Taxonomy"
        description="Assign themes and player experiences to this game. AI suggestions are pre-selected based on rulebook analysis."
        icon={<Tags className="h-5 w-5" />}
        badge={totalSuggestions > 0 ? `${totalSuggestions} AI suggestions` : undefined}
      />
      <CardContent className="space-y-6 pt-0">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Themes Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Themes</h3>
            <span className="text-sm text-muted-foreground">
              ({selectedThemes.length} selected)
            </span>
          </div>
          <TaxonomySelector
            items={data?.themes ?? []}
            selected={selectedThemes}
            suggestions={data?.suggestions ?? []}
            onChange={setSelectedThemes}
            type="theme"
            allowPrimary={true}
          />
        </div>

        {/* Player Experiences Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Player Experiences</h3>
            <span className="text-sm text-muted-foreground">
              ({selectedExperiences.length} selected)
            </span>
          </div>
          <TaxonomySelector
            items={data?.playerExperiences ?? []}
            selected={selectedExperiences}
            suggestions={data?.suggestions ?? []}
            onChange={setSelectedExperiences}
            type="player_experience"
            allowPrimary={false}
          />
        </div>

        {/* New Suggestions Notice */}
        {newSuggestionsCount > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">AI suggested {newSuggestionsCount} new taxonomy items</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              These suggestions will be queued for admin review. You can add them from the Taxonomy admin page.
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
