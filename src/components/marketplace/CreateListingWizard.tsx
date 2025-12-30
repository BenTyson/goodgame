'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, Loader2, Camera } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LISTING_LIMITS } from '@/lib/config/marketplace-constants'
import { GameSelector, ListingDetailsForm, PricingForm, ListingImageUpload } from './forms'
import type { ListingType, GameCondition, ShippingPreference, ListingImage } from '@/types/marketplace'

interface GameOption {
  id: string
  name: string
  slug: string
  thumbnail_url: string | null
  year_published?: number | null
}

interface WizardStep {
  id: string
  title: string
  description: string
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'game', title: 'Select Game', description: 'Choose the game you want to list' },
  { id: 'details', title: 'Details', description: 'Add condition and description' },
  { id: 'pricing', title: 'Pricing & Shipping', description: 'Set your price and location' },
  { id: 'photos', title: 'Photos', description: 'Add photos of your game (optional)' },
]

interface CreateListingWizardProps {
  ownedGames?: GameOption[]
  defaultLocationCity?: string
  defaultLocationState?: string
  className?: string
}

export function CreateListingWizard({
  ownedGames = [],
  defaultLocationCity = '',
  defaultLocationState = '',
  className,
}: CreateListingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form state
  const [selectedGame, setSelectedGame] = React.useState<GameOption | null>(null)
  const [listingType, setListingType] = React.useState<ListingType>('sell')
  const [condition, setCondition] = React.useState<GameCondition | null>(null)
  const [description, setDescription] = React.useState('')
  const [priceDollars, setPriceDollars] = React.useState('')
  const [shippingCostDollars, setShippingCostDollars] = React.useState('')
  const [shippingPreference, setShippingPreference] = React.useState<ShippingPreference>('will_ship')
  const [locationCity, setLocationCity] = React.useState(defaultLocationCity)
  const [locationState, setLocationState] = React.useState(defaultLocationState)
  const [durationDays, setDurationDays] = React.useState<number>(LISTING_LIMITS.DEFAULT_DURATION_DAYS)

  // Listing state (after creation)
  const [createdListingId, setCreatedListingId] = React.useState<string | null>(null)
  const [listingImages, setListingImages] = React.useState<ListingImage[]>([])

  // Validation
  const canProceed = (step: number): boolean => {
    switch (step) {
      case 0:
        return selectedGame !== null
      case 1:
        if (listingType === 'want') return true
        return condition !== null
      case 2:
        if (listingType === 'sell') {
          const price = parseFloat(priceDollars)
          if (isNaN(price) || price <= 0) return false
        }
        return locationCity.trim() !== '' && locationState !== ''
      case 3:
        // Photos are optional
        return true
      default:
        return true
    }
  }

  const createListing = async (): Promise<string | null> => {
    if (!selectedGame) return null

    const priceCents = priceDollars ? Math.round(parseFloat(priceDollars) * 100) : null
    const shippingCostCents = shippingCostDollars ? Math.round(parseFloat(shippingCostDollars) * 100) : null

    const listing = {
      game_id: selectedGame.id,
      listing_type: listingType,
      condition: listingType === 'want' ? null : condition,
      description: description || null,
      price_cents: listingType === 'sell' ? priceCents : null,
      shipping_cost_cents: shippingPreference !== 'local_only' ? shippingCostCents : null,
      shipping_preference: shippingPreference,
      location_city: locationCity,
      location_state: locationState,
      location_country: 'US',
      currency: 'USD',
      status: 'draft', // Create as draft first
    }

    const response = await fetch('/api/marketplace/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing, durationDays }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to create listing')
    }

    const { listing: createdListing } = await response.json()
    return createdListing.id
  }

  const handleNext = async () => {
    // When moving from pricing step to photos step, create the listing first
    if (currentStep === 2 && !createdListingId) {
      setIsSubmitting(true)
      setError(null)
      try {
        const listingId = await createListing()
        if (listingId) {
          setCreatedListingId(listingId)
          setCurrentStep(currentStep + 1)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
      setIsSubmitting(false)
    } else if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    // Don't allow going back from photos step (listing already created)
    if (currentStep === 3) return
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePublish = async () => {
    if (!createdListingId) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Publish the listing (change status from draft to active)
      const response = await fetch(`/api/marketplace/listings/${createdListingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { status: 'active' },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to publish listing')
      }

      // Redirect to the listing
      router.push(`/marketplace/listings/${createdListingId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const handleSkipPhotos = () => {
    // Publish without photos
    handlePublish()
  }

  const step = WIZARD_STEPS[currentStep]
  const isLastStep = currentStep === WIZARD_STEPS.length - 1

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((s, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors',
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-2 hidden sm:block',
                      isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4',
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Game */}
          {currentStep === 0 && (
            <GameSelector
              selectedGame={selectedGame}
              onSelect={setSelectedGame}
              ownedGames={ownedGames}
            />
          )}

          {/* Step 2: Details */}
          {currentStep === 1 && (
            <ListingDetailsForm
              listingType={listingType}
              condition={condition}
              description={description}
              onListingTypeChange={setListingType}
              onConditionChange={setCondition}
              onDescriptionChange={setDescription}
            />
          )}

          {/* Step 3: Pricing & Shipping */}
          {currentStep === 2 && (
            <PricingForm
              listingType={listingType}
              priceDollars={priceDollars}
              shippingCostDollars={shippingCostDollars}
              shippingPreference={shippingPreference}
              locationCity={locationCity}
              locationState={locationState}
              durationDays={durationDays}
              onPriceChange={setPriceDollars}
              onShippingCostChange={setShippingCostDollars}
              onShippingPreferenceChange={setShippingPreference}
              onLocationCityChange={setLocationCity}
              onLocationStateChange={setLocationState}
              onDurationChange={setDurationDays}
            />
          )}

          {/* Step 4: Photos */}
          {currentStep === 3 && createdListingId && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add photos of the actual game to help buyers see its condition.
                Photos are optional but highly recommended for faster sales.
              </p>
              <ListingImageUpload
                listingId={createdListingId}
                images={listingImages}
                onImagesChange={setListingImages}
                maxImages={6}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || currentStep === 3}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          {/* Photos step: Skip or Publish buttons */}
          {currentStep === 3 ? (
            <>
              {listingImages.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleSkipPhotos}
                  disabled={isSubmitting}
                >
                  Skip Photos
                </Button>
              )}
              <Button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Listing
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          ) : currentStep === 2 ? (
            /* Step 3 (Pricing): Create listing and go to photos */
            <Button
              onClick={handleNext}
              disabled={!canProceed(currentStep) || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue to Photos
                  <Camera className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            /* Other steps: Regular Next button */
            <Button
              onClick={handleNext}
              disabled={!canProceed(currentStep)}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
