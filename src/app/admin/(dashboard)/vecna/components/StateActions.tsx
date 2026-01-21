'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  Eye,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { VecnaState } from '@/lib/vecna'
import { VECNA_STATE_CONFIG } from '@/lib/vecna'
import { useVecnaStateUpdate } from '@/hooks/admin'

interface StateActionsProps {
  gameId: string
  gameName: string
  currentState: VecnaState
  hasRulebook: boolean
  rulebookUrl: string | null
  hasContent: boolean
  isPublished: boolean
  onStateChange: (newState: VecnaState) => void
}

export function StateActions({
  gameId,
  gameName,
  currentState,
  hasRulebook,
  rulebookUrl,
  hasContent,
  isPublished,
  onStateChange,
}: StateActionsProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  // Hook for state updates
  const { updateState, isUpdating, error: stateError } = useVecnaStateUpdate({
    gameId,
    onSuccess: onStateChange,
  })

  // Combined error from local operations and state updates
  const error = localError || stateError

  // Actually parse the rulebook (calls the parse API)
  const startParsing = async () => {
    if (!rulebookUrl) {
      setLocalError('No rulebook URL set')
      return
    }

    setIsProcessing(true)
    setLocalError(null)
    setProcessingMessage('Parsing rulebook PDF...')

    try {
      // First set state to parsing
      await fetch(`/api/admin/vecna/${gameId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'parsing' }),
      })
      onStateChange('parsing')

      // Actually parse the rulebook
      setProcessingMessage('Extracting text and analyzing complexity...')
      const parseResponse = await fetch('/api/admin/rulebook/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, url: rulebookUrl }),
      })

      const parseResult = await parseResponse.json()

      if (!parseResponse.ok || !parseResult.success) {
        throw new Error(parseResult.error || 'Parsing failed')
      }

      // Update state to parsed
      setProcessingMessage('Parsing complete!')
      await updateState('parsed')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Parsing failed')
      // Reset state to rulebook_ready on failure
      await updateState('rulebook_ready', false)
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  // Generate content (calls the generate-content API)
  const startGenerating = async () => {
    setIsProcessing(true)
    setLocalError(null)
    setProcessingMessage('Generating content with AI...')

    try {
      // First set state to generating
      await fetch(`/api/admin/vecna/${gameId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'generating' }),
      })
      onStateChange('generating')

      // Actually generate content
      setProcessingMessage('Creating rules summary, setup guide, and reference card...')
      const generateResponse = await fetch('/api/admin/rulebook/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, contentTypes: ['rules', 'setup', 'reference'] }),
      })

      const generateResult = await generateResponse.json()

      if (!generateResponse.ok || !generateResult.success) {
        throw new Error(generateResult.error || 'Content generation failed')
      }

      // Update state to generated
      setProcessingMessage('Content generated!')
      await updateState('generated')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Generation failed')
      // Reset state to taxonomy_assigned on failure
      await updateState('taxonomy_assigned', false)
    } finally {
      setIsProcessing(false)
      setProcessingMessage(null)
    }
  }

  const config = VECNA_STATE_CONFIG[currentState]

  // Determine available actions based on current state
  const getActions = () => {
    const actions: Array<{
      label: string
      icon: typeof Play
      state: VecnaState
      variant: 'default' | 'outline' | 'destructive'
      requireConfirm?: boolean
      disabled?: boolean
      disabledReason?: string
      customAction?: () => Promise<void>  // For actions that call APIs
    }> = []

    switch (currentState) {
      case 'imported':
        actions.push({
          label: 'Mark as Enriched',
          icon: CheckCircle2,
          state: 'enriched',
          variant: 'default',
        })
        break

      case 'enriched':
        if (hasRulebook) {
          actions.push({
            label: 'Rulebook Ready',
            icon: FileText,
            state: 'rulebook_ready',
            variant: 'default',
          })
        } else {
          actions.push({
            label: 'Mark Missing Rulebook',
            icon: AlertCircle,
            state: 'rulebook_missing',
            variant: 'outline',
          })
        }
        break

      case 'rulebook_missing':
        actions.push({
          label: 'Rulebook Added',
          icon: FileText,
          state: 'rulebook_ready',
          variant: 'default',
          disabled: !hasRulebook,
          disabledReason: 'Add rulebook URL first',
        })
        // Allow skipping if has Wikipedia
        actions.push({
          label: 'Skip (Use Wikipedia Only)',
          icon: SkipForward,
          state: 'taxonomy_assigned',
          variant: 'outline',
        })
        break

      case 'rulebook_ready':
        actions.push({
          label: 'Parse Rulebook',
          icon: Play,
          state: 'parsing',
          variant: 'default',
          customAction: startParsing,  // Actually calls the parse API
        })
        break

      case 'parsing':
        // Show a manual override in case parsing is stuck
        actions.push({
          label: 'Mark as Parsed (Manual)',
          icon: CheckCircle2,
          state: 'parsed',
          variant: 'outline',
        })
        break

      case 'parsed':
        actions.push({
          label: 'Assign Taxonomy',
          icon: CheckCircle2,
          state: 'taxonomy_assigned',
          variant: 'default',
        })
        break

      case 'taxonomy_assigned':
        actions.push({
          label: 'Generate Content',
          icon: Sparkles,
          state: 'generating',
          variant: 'default',
          customAction: startGenerating,  // Actually calls the generate API
        })
        break

      case 'generating':
        // Show a manual override in case generation is stuck
        actions.push({
          label: 'Mark as Generated (Manual)',
          icon: CheckCircle2,
          state: 'generated',
          variant: 'outline',
        })
        break

      case 'generated':
        actions.push({
          label: 'Ready for Review',
          icon: Eye,
          state: 'review_pending',
          variant: 'default',
        })
        break

      case 'review_pending':
        actions.push({
          label: 'Approve & Publish',
          icon: Globe,
          state: 'published',
          variant: 'default',
          requireConfirm: true,
        })
        actions.push({
          label: 'Regenerate Content',
          icon: RotateCcw,
          state: 'generating',
          customAction: startGenerating,
          variant: 'outline',
        })
        break

      case 'published':
        actions.push({
          label: 'Unpublish',
          icon: XCircle,
          state: 'review_pending',
          variant: 'destructive',
          requireConfirm: true,
        })
        break
    }

    return actions
  }

  // Get reset/rollback options based on current state
  const getResetOptions = (): Array<{ label: string; state: VecnaState }> => {
    const options: Array<{ label: string; state: VecnaState }> = []

    // Allow going back to earlier states
    switch (currentState) {
      case 'parsed':
      case 'parsing':
        options.push({ label: 'Back to Rulebook Ready', state: 'rulebook_ready' })
        break
      case 'taxonomy_assigned':
        options.push({ label: 'Back to Parsed', state: 'parsed' })
        options.push({ label: 'Back to Rulebook Ready', state: 'rulebook_ready' })
        break
      case 'generating':
      case 'generated':
        options.push({ label: 'Back to Taxonomy', state: 'taxonomy_assigned' })
        options.push({ label: 'Back to Rulebook Ready', state: 'rulebook_ready' })
        break
      case 'review_pending':
        options.push({ label: 'Back to Generated', state: 'generated' })
        options.push({ label: 'Regenerate from Taxonomy', state: 'taxonomy_assigned' })
        break
    }

    return options
  }

  const actions = getActions()
  const resetOptions = getResetOptions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Pipeline Actions
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Current: <span className={config.color}>{config.label}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Processing message */}
        {processingMessage && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Loader2 className="h-4 w-4 text-blue-500 flex-shrink-0 animate-spin mt-0.5" />
            <span className="text-sm text-blue-700 break-words">{processingMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {actions.length === 0 && !isProcessing && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No actions available for this state
          </div>
        )}

        <div className="flex flex-col gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            // Use customAction if provided, otherwise use updateState
            const handleClick = action.customAction
              ? action.customAction
              : () => updateState(action.state)

            const button = (
              <Button
                key={index}
                variant={action.variant}
                className="w-full justify-start gap-2"
                disabled={isProcessing || isUpdating || action.disabled}
                onClick={action.requireConfirm ? undefined : handleClick}
                title={action.disabled ? action.disabledReason : undefined}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            )

            if (action.requireConfirm) {
              return (
                <AlertDialog key={index}>
                  <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm {action.label}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {action.state === 'published'
                          ? `This will publish "${gameName}" and make it visible to users. Are you sure?`
                          : `This will change the state of "${gameName}". Are you sure?`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClick}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            }

            return button
          })}
        </div>

        {/* Reset/Rollback options */}
        {resetOptions.length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Reset State</div>
            <div className="flex flex-wrap gap-2">
              {resetOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing || isUpdating}
                  onClick={() => updateState(option.state)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick links to game editor */}
        <div className="pt-3 border-t">
          <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/games/${gameId}`)}
            >
              Open Editor
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/games/${gameId}?tab=wizard`)}
            >
              Setup Wizard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
