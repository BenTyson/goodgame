'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WizardStepIndicator, type WizardStep } from './WizardStepIndicator'
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
} from 'lucide-react'
import type { Game, GameImage } from '@/types/database'

// Import wizard step components
import { RulebookStep } from './wizard-steps/RulebookStep'
import { ParseAnalyzeStep } from './wizard-steps/ParseAnalyzeStep'
import { TaxonomyStep } from './wizard-steps/TaxonomyStep'
import { GenerateContentStep } from './wizard-steps/GenerateContentStep'
import { ImagesStep } from './wizard-steps/ImagesStep'
import { RelationsStep } from './wizard-steps/RelationsStep'
import { ReviewContentStep } from './wizard-steps/ReviewContentStep'
import { PublishStep } from './wizard-steps/PublishStep'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

type GameWithImages = Game & { images: GameImage[]; publishers_list?: Publisher[] }

interface GameSetupWizardProps {
  game: GameWithImages
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
  } = useWizardProgress(game.id, { totalSteps: 8 })

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

  const handleStepComplete = () => {
    completeStep()
    if (currentStep < 8) {
      nextStep()
    }
  }

  const handleSkip = () => {
    skipStep()
    if (currentStep < 8) {
      nextStep()
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RulebookStep
            game={game}
            updateField={updateField}
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        )
      case 2:
        return (
          <ParseAnalyzeStep
            game={game}
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        )
      case 3:
        return (
          <TaxonomyStep
            game={game}
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        )
      case 4:
        return (
          <GenerateContentStep
            game={game}
            onComplete={handleStepComplete}
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
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        )
      case 6:
        return (
          <RelationsStep
            game={game}
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        )
      case 7:
        return (
          <ReviewContentStep
            game={game}
            updateField={updateField}
            onComplete={handleStepComplete}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/games" className="self-start">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{game.name}</h1>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Setup Wizard
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">/{game.slug}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onExitToAdvanced}
            className="gap-2"
          >
            <PanelRightOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced Editor</span>
          </Button>
          <Button
            onClick={saveGame}
            disabled={saving}
            size="sm"
            className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? 'Saved!' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="py-6">
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
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < 8 && (
            <>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="gap-2 text-muted-foreground"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
              <Button
                onClick={handleStepComplete}
                disabled={!canProceed && currentStep !== 7}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
