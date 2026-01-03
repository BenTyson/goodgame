'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TaxonomySelector } from './TaxonomySelector'
import {
  Grid3X3,
  Puzzle,
  Palette,
  Users,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import type { Game, Category, Mechanic, Theme, PlayerExperience, TaxonomySuggestion } from '@/types/database'
import type { SelectedTaxonomyItem } from '@/lib/admin/wizard'

interface TaxonomyTabProps {
  game: Game
}

interface TaxonomyData {
  categories: Category[]
  mechanics: Mechanic[]
  themes: Theme[]
  playerExperiences: PlayerExperience[]
  currentCategories: { category_id: string; is_primary: boolean | null }[]
  currentMechanics: { mechanic_id: string }[]
  currentThemes: { theme_id: string; is_primary: boolean | null }[]
  currentExperiences: { player_experience_id: string; is_primary: boolean | null }[]
  suggestions: TaxonomySuggestion[]
}

export function TaxonomyTab({ game }: TaxonomyTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TaxonomyData | null>(null)

  // Selected state for all 4 taxonomy types
  const [selectedCategories, setSelectedCategories] = useState<SelectedTaxonomyItem[]>([])
  const [selectedMechanics, setSelectedMechanics] = useState<SelectedTaxonomyItem[]>([])
  const [selectedThemes, setSelectedThemes] = useState<SelectedTaxonomyItem[]>([])
  const [selectedExperiences, setSelectedExperiences] = useState<SelectedTaxonomyItem[]>([])

  // Track initial state for detecting unsaved changes
  const initialStateRef = useRef<{
    categories: SelectedTaxonomyItem[]
    mechanics: SelectedTaxonomyItem[]
    themes: SelectedTaxonomyItem[]
    experiences: SelectedTaxonomyItem[]
  } | null>(null)

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
        const initialCategories = result.currentCategories.map(c => ({
          id: c.category_id,
          isPrimary: c.is_primary ?? false,
        }))
        const initialMechanics = result.currentMechanics.map(m => ({
          id: m.mechanic_id,
          isPrimary: false, // Mechanics don't have primary
        }))
        const initialThemes = result.currentThemes.map(t => ({
          id: t.theme_id,
          isPrimary: t.is_primary ?? false,
        }))
        const initialExperiences = result.currentExperiences.map(e => ({
          id: e.player_experience_id,
          isPrimary: e.is_primary ?? false,
        }))

        setSelectedCategories(initialCategories)
        setSelectedMechanics(initialMechanics)
        setSelectedThemes(initialThemes)
        setSelectedExperiences(initialExperiences)

        // Store initial state for change detection
        initialStateRef.current = {
          categories: initialCategories,
          mechanics: initialMechanics,
          themes: initialThemes,
          experiences: initialExperiences,
        }
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
    const initial = initialStateRef.current

    // Helper to compare selections
    const selectionsEqual = (a: SelectedTaxonomyItem[], b: SelectedTaxonomyItem[]) => {
      if (a.length !== b.length) return false
      return a.every(item => {
        const match = b.find(i => i.id === item.id)
        return match && match.isPrimary === item.isPrimary
      })
    }

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

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      setSaved(false)
      setError(null)

      // Determine which suggestions were accepted vs rejected (for themes/experiences)
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

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save taxonomy')
    } finally {
      setSaving(false)
    }
  }, [game.id, selectedCategories, selectedMechanics, selectedThemes, selectedExperiences, data])

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map(j => (
                  <Skeleton key={j} className="h-10" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">You have unsaved changes</p>
        </div>
      )}

      {/* Categories */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Grid3X3 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Categories</CardTitle>
              <CardDescription>
                Game categories like Strategy, Economic, or Abstract ({selectedCategories.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaxonomySelector
            items={data?.categories ?? []}
            selected={selectedCategories}
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
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Puzzle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Mechanics</CardTitle>
              <CardDescription>
                Game mechanics like Worker Placement or Deck Building ({selectedMechanics.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaxonomySelector
            items={data?.mechanics ?? []}
            selected={selectedMechanics}
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
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Palette className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Themes</CardTitle>
              <CardDescription>
                Thematic elements like Medieval, Sci-Fi, or Trading ({selectedThemes.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaxonomySelector
            items={data?.themes ?? []}
            selected={selectedThemes}
            suggestions={data?.suggestions}
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
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Player Experiences</CardTitle>
              <CardDescription>
                What players experience like Strategic Depth or Social Deduction ({selectedExperiences.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaxonomySelector
            items={data?.playerExperiences ?? []}
            selected={selectedExperiences}
            suggestions={data?.suggestions}
            onChange={setSelectedExperiences}
            type="player_experience"
            allowPrimary={false}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Taxonomy
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
