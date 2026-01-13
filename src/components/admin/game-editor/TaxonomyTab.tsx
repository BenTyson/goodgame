'use client'

import { useState, useEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TaxonomySelector } from './TaxonomySelector'
import {
  Grid3X3,
  Puzzle,
  Palette,
  Users,
  AlertCircle,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { TaxonomyData } from '@/lib/supabase/game-queries'
import type { SelectedTaxonomyItem } from '@/lib/admin/wizard'
import { filterHighConfidenceSuggestions, selectionsEqual } from '@/lib/admin/utils'

export interface TaxonomyTabRef {
  /** Save taxonomy data. Returns true on success, false on error. */
  save: () => Promise<boolean>
  /** Whether there are unsaved taxonomy changes */
  hasUnsavedChanges: boolean
}

interface TaxonomyTabProps {
  game: Game
  /** Preloaded taxonomy data from server */
  initialData: TaxonomyData
  /** Called when taxonomy unsaved state changes (for parent to track) */
  onUnsavedChange?: (hasUnsaved: boolean) => void
}

export const TaxonomyTab = forwardRef<TaxonomyTabRef, TaxonomyTabProps>(
  function TaxonomyTab({ game, initialData, onUnsavedChange }, ref) {
  const [error, setError] = useState<string | null>(null)
  // Used to reset hasUnsavedChanges after navigation
  const [saved, setSaved] = useState(false)

  // Compute initial selections from preloaded data (only on mount/data change)
  const computeInitialSelections = useCallback(() => {
    const initialCategories = initialData.currentCategories.map(c => ({
      id: c.category_id,
      isPrimary: c.is_primary ?? false,
    }))
    const initialMechanics = initialData.currentMechanics.map(m => ({
      id: m.mechanic_id,
      isPrimary: false, // Mechanics don't have primary
    }))
    const initialThemes = initialData.currentThemes.map(t => ({
      id: t.theme_id,
      isPrimary: t.is_primary ?? false,
    }))
    const initialExperiences = initialData.currentExperiences.map(e => ({
      id: e.player_experience_id,
      isPrimary: e.is_primary ?? false,
    }))

    // Auto-select AI suggestions with 70%+ confidence that aren't already selected
    const existingCategoryIds = new Set(initialCategories.map(c => c.id))
    const existingMechanicIds = new Set(initialMechanics.map(m => m.id))
    const existingThemeIds = new Set(initialThemes.map(t => t.id))
    const existingExperienceIds = new Set(initialExperiences.map(e => e.id))

    initialCategories.push(...filterHighConfidenceSuggestions(initialData.suggestions, 'category', existingCategoryIds))
    initialMechanics.push(...filterHighConfidenceSuggestions(initialData.suggestions, 'mechanic', existingMechanicIds))
    initialThemes.push(...filterHighConfidenceSuggestions(initialData.suggestions, 'theme', existingThemeIds))
    initialExperiences.push(...filterHighConfidenceSuggestions(initialData.suggestions, 'player_experience', existingExperienceIds))

    return { initialCategories, initialMechanics, initialThemes, initialExperiences }
  }, [initialData])

  // Get initial selections
  const initialSelections = useMemo(() => computeInitialSelections(), [computeInitialSelections])

  // Selected state for all 4 taxonomy types
  const [selectedCategories, setSelectedCategories] = useState<SelectedTaxonomyItem[]>(initialSelections.initialCategories)
  const [selectedMechanics, setSelectedMechanics] = useState<SelectedTaxonomyItem[]>(initialSelections.initialMechanics)
  const [selectedThemes, setSelectedThemes] = useState<SelectedTaxonomyItem[]>(initialSelections.initialThemes)
  const [selectedExperiences, setSelectedExperiences] = useState<SelectedTaxonomyItem[]>(initialSelections.initialExperiences)

  // Track initial state for detecting unsaved changes
  const initialStateRef = useRef<{
    categories: SelectedTaxonomyItem[]
    mechanics: SelectedTaxonomyItem[]
    themes: SelectedTaxonomyItem[]
    experiences: SelectedTaxonomyItem[]
  }>({
    categories: initialSelections.initialCategories,
    mechanics: initialSelections.initialMechanics,
    themes: initialSelections.initialThemes,
    experiences: initialSelections.initialExperiences,
  })

  // Sync state when initialData changes (e.g., after navigation or refresh)
  useEffect(() => {
    const selections = computeInitialSelections()
    setSelectedCategories(selections.initialCategories)
    setSelectedMechanics(selections.initialMechanics)
    setSelectedThemes(selections.initialThemes)
    setSelectedExperiences(selections.initialExperiences)
    initialStateRef.current = {
      categories: selections.initialCategories,
      mechanics: selections.initialMechanics,
      themes: selections.initialThemes,
      experiences: selections.initialExperiences,
    }
    setSaved(false)
  }, [initialData, computeInitialSelections])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialStateRef.current) return false
    const initial = initialStateRef.current

    return (
      !selectionsEqual(selectedCategories, initial.categories) ||
      !selectionsEqual(selectedMechanics, initial.mechanics) ||
      !selectionsEqual(selectedThemes, initial.themes) ||
      !selectionsEqual(selectedExperiences, initial.experiences)
    )
  }, [selectedCategories, selectedMechanics, selectedThemes, selectedExperiences])

  // Clear saved state when changes are made
  useEffect(() => {
    if (hasUnsavedChanges && saved) {
      setSaved(false)
    }
  }, [hasUnsavedChanges, saved])

  // Notify parent of unsaved changes state
  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges)
  }, [hasUnsavedChanges, onUnsavedChange])

  // Save function that can be called by parent
  const save = useCallback(async (): Promise<boolean> => {
    // Skip if no changes
    if (!hasUnsavedChanges) return true

    try {
      setError(null)

      // Determine which suggestions were accepted vs rejected (for themes/experiences)
      const acceptedSuggestionIds: string[] = []
      const rejectedSuggestionIds: string[] = []

      for (const suggestion of initialData.suggestions) {
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

      const response = await fetch('/api/admin/games/taxonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          categories: selectedCategories.map(c => ({
            categoryId: c.id,
            isPrimary: c.isPrimary,
          })),
          mechanics: selectedMechanics.map(m => ({
            mechanicId: m.id,
          })),
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
      initialStateRef.current = {
        categories: [...selectedCategories],
        mechanics: [...selectedMechanics],
        themes: [...selectedThemes],
        experiences: [...selectedExperiences],
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save taxonomy')
      return false
    }
  }, [game.id, selectedCategories, selectedMechanics, selectedThemes, selectedExperiences, initialData, hasUnsavedChanges])

  // Expose save function and hasUnsavedChanges to parent via ref
  useImperativeHandle(ref, () => ({
    save,
    hasUnsavedChanges,
  }), [save, hasUnsavedChanges])

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Categories */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Grid3X3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Categories</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">
                Game categories like Strategy, Economic, or Abstract ({selectedCategories.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaxonomySelector
            items={initialData.categories ?? []}
            selected={selectedCategories}
            suggestions={initialData.suggestions}
            onChange={setSelectedCategories}
            type="category"
            allowPrimary={true}
          />
        </CardContent>
      </Card>

      {/* Mechanics */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Puzzle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Mechanics</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">
                Game mechanics like Worker Placement or Deck Building ({selectedMechanics.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaxonomySelector
            items={initialData.mechanics ?? []}
            selected={selectedMechanics}
            suggestions={initialData.suggestions}
            onChange={setSelectedMechanics}
            type="mechanic"
            allowPrimary={false}
          />
        </CardContent>
      </Card>

      {/* Themes */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Themes</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">
                Thematic elements like Medieval, Sci-Fi, or Trading ({selectedThemes.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaxonomySelector
            items={initialData.themes ?? []}
            selected={selectedThemes}
            suggestions={initialData.suggestions}
            onChange={setSelectedThemes}
            type="theme"
            allowPrimary={true}
          />
        </CardContent>
      </Card>

      {/* Player Experiences */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Player Experiences</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">
                What players experience like Strategic Depth or Social Deduction ({selectedExperiences.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaxonomySelector
            items={initialData.playerExperiences ?? []}
            selected={selectedExperiences}
            suggestions={initialData.suggestions}
            onChange={setSelectedExperiences}
            type="player_experience"
            allowPrimary={false}
          />
        </CardContent>
      </Card>
    </div>
  )
})
