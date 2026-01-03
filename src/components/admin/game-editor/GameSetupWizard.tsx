'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WizardStepIndicator } from './WizardStepIndicator'
import { useWizardProgress } from '@/hooks/admin/useWizardProgress'
import { useAsyncAction } from '@/hooks/admin'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle2,
  PanelRightOpen,
  SkipForward,
  RotateCcw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Game, GameImage } from '@/types/database'
import type { GameWithRelations, WizardStep } from '@/lib/admin/wizard'


// Import wizard step components
import { RulebookStep } from './wizard-steps/RulebookStep'
import { ParseAnalyzeStep } from './wizard-steps/ParseAnalyzeStep'
import { TaxonomyStep } from './wizard-steps/TaxonomyStep'
import { GenerateContentStep } from './wizard-steps/GenerateContentStep'
import { ImagesStep } from './wizard-steps/ImagesStep'
import { RelationsStep } from './wizard-steps/RelationsStep'
import { ReviewContentStep } from './wizard-steps/ReviewContentStep'
import { PublishStep } from './wizard-steps/PublishStep'

interface GameSetupWizardProps {
  game: GameWithRelations
  onExitToAdvanced: () => void
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Rulebook', description: 'Find rulebook URL' },
  { id: 2, title: 'Analyze', description: 'Parse & score' },
  { id: 3, title: 'Taxonomy', description: 'Themes & experiences' },
  { id: 4, title: 'Content', description: 'Generate guides' },
  { id: 5, title: 'Images', description: 'Upload artwork' },
  { id: 6, title: 'Relations', description: 'Game connections' },
  { id: 7, title: 'Review', description: 'Check content' },
  { id: 8, title: 'Publish', description: 'Go live' },
]

export function GameSetupWizard({ game: initialGame, onExitToAdvanced }: GameSetupWizardProps) {

  const router = useRouter()
  const [game, setGame] = useState(initialGame)
  const [images, setImages] = useState(initialGame.images)
  const { saving, saved, execute, markUnsaved } = useAsyncAction()

  // Sync state when server data changes (e.g., after router.refresh())
  useEffect(() => {
    setGame(initialGame)
    setImages(initialGame.images)
  }, [initialGame])

  const {
    currentStep,
    completedSteps,
    skippedSteps,
    isStepComplete,
    canNavigateToStep,
    goToStep,
    nextStep,
    prevStep,
    completeStep,
    skipStep,
    resetProgress,
    isHydrated,
  } = useWizardProgress(game.id, { totalSteps: 8 })

  const [resetting, setResetting] = useState(false)

  const updateField = useCallback(<K extends keyof Game>(field: K, value: Game[K]) => {
    setGame(prev => ({ ...prev, [field]: value }))
    markUnsaved()
  }, [markUnsaved])

  const saveGame = async () => {
    const primaryImage = images.find(img => img.is_primary)

    // Ensure content_status is 'published' when publishing
    const contentStatus = game.is_published ? 'published' : (game.content_status || 'none')

    await execute(async () => {
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
            publisher: game.publisher,
            designers: game.designers,
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
            hero_image_url: primaryImage?.url || game.hero_image_url,
            box_image_url: primaryImage?.url || game.box_image_url,
            thumbnail_url: primaryImage?.url || game.thumbnail_url,
          }
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Save failed')
      }

      router.refresh()
    })
  }

  // Mark step complete (enables Next button) - does NOT navigate
  const handleMarkComplete = useCallback(() => {
    completeStep()
  }, [completeStep])

  // Complete step AND navigate to next - used by Next button
  const handleStepComplete = useCallback(() => {
    completeStep()
    nextStep()
  }, [completeStep, nextStep])

  const handleSkip = useCallback(() => {
    skipStep()
    nextStep()
  }, [skipStep, nextStep])

  // Reset wizard - clears progress and optionally all game data
  const resetWizard = useCallback(async (resetData: boolean = false) => {
    setResetting(true)
    try {
      if (resetData) {
        // Reset all game data via API
        const response = await fetch(`/api/admin/games/${game.id}/reset-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetAll: true }),
        })
        if (!response.ok) {
          throw new Error('Failed to reset game data')
        }
      }
      // Reset wizard progress (localStorage)
      resetProgress()
      // Refresh to get clean state
      router.refresh()
    } catch (error) {
      console.error('Reset failed:', error)
    } finally {
      setResetting(false)
    }
  }, [game.id, resetProgress, router])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RulebookStep
            game={game}
            updateField={updateField}
            onComplete={handleMarkComplete}
            onSkip={handleSkip}
          />
        )
      case 2:
        return (
          <ParseAnalyzeStep
            game={game}
            onComplete={handleMarkComplete}
            onSkip={handleSkip}
          />
        )
      case 3:
        return (
          <TaxonomyStep
            game={game}
            onComplete={handleMarkComplete}
            onSkip={handleSkip}
          />
        )
      case 4:
        return (
          <GenerateContentStep
            game={game}
            onComplete={handleMarkComplete}
            onSkip={handleSkip}
          />
        )
      case 5:
        return (
          <ImagesStep
            game={game}
            images={images}
            onImagesChange={(newImages) => {
              setImages(newImages)
              markUnsaved()
            }}
            onComplete={handleMarkComplete}
            onSkip={handleSkip}
          />
        )
      case 6:
        return (
          <RelationsStep
            game={game}
            onComplete={handleMarkComplete}
            onSkip={handleSkip}
          />
        )
      case 7:
        return (
          <ReviewContentStep
            game={game}
            updateField={updateField}
            onComplete={handleMarkComplete}
          />
        )
      case 8:
        return (
          <PublishStep
            game={game}
            images={images}
            updateField={updateField}
            onSave={saveGame}
            saving={saving}
            saved={saved}
          />
        )
      default:
        return null
    }
  }

  // Check if current step can proceed
  const canProceed = isStepComplete(currentStep)

  // Show loading state until client-side hydration completes
  // This prevents flash of incorrect state from SSR
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/games" className="self-start">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Games
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight truncate">{game.name}</h1>
            <span className="shrink-0 inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
              Wizard
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5 font-mono">/{game.slug}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={resetting}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => resetWizard(false)}>
                Reset Progress Only
                <span className="ml-2 text-xs text-muted-foreground">Go back to step 1</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => resetWizard(true)}
                className="text-destructive focus:text-destructive"
              >
                Reset Everything
                <span className="ml-2 text-xs text-muted-foreground">Clear all data</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitToAdvanced}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <PanelRightOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </Button>
          <Button
            onClick={saveGame}
            disabled={saving}
            size="sm"
            variant={saved ? 'default' : 'outline'}
            className={saved ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="ml-1.5">{saved ? 'Saved' : 'Save'}</span>
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <Card className="border-0 shadow-sm bg-card/50">
        <CardContent className="py-5 px-4 sm:px-6">
          <WizardStepIndicator
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            skippedSteps={skippedSteps}
            onStepClick={goToStep}
            canNavigateToStep={canNavigateToStep}
          />
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
        <div className="flex items-center justify-between max-w-none">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < 8 && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleStepComplete}
                  disabled={!canProceed && currentStep !== 7}
                  className="gap-2 min-w-[100px]"
                >
                  {currentStep === 7 ? 'Continue' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
