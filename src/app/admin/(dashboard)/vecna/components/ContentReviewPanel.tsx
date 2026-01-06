'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  ListChecks,
  ClipboardList,
  CheckCircle2,
  Circle,
  Globe,
  Loader2,
  ChevronDown,
  Eye,
  Sparkles,
  Pencil,
  Save,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Zap,
  Brain,
  Gem,
  ExternalLink,
  EyeOff,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { cn } from '@/lib/utils'
import type { VecnaGame, RulesContent, SetupContent, ReferenceContent } from '@/lib/vecna'
import { DataSourceBadge } from '@/lib/vecna'

type ContentType = 'rules' | 'setup' | 'reference'
type ModelType = 'haiku' | 'sonnet' | 'opus'

const MODEL_OPTIONS: { value: ModelType; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'haiku', label: 'Haiku', description: 'Fast, good for testing', icon: Zap },
  { value: 'sonnet', label: 'Sonnet', description: 'Balanced (recommended)', icon: Brain },
  { value: 'opus', label: 'Opus', description: 'Best quality', icon: Gem },
]

interface ContentReviewPanelProps {
  game: VecnaGame
  onPublish?: () => void
}

// Compact source preview
function SourcePreview({
  label,
  source,
  content,
}: {
  label: string
  source: string
  content: string | null | undefined
}) {
  if (!content) return null
  const truncated = content.length > 120 ? content.slice(0, 120) + '...' : content

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium">{label}</span>
        <DataSourceBadge source={source} size="sm" showTooltip={false} />
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">{truncated}</p>
    </div>
  )
}

// JSON Editor component
function JsonEditor({
  value,
  onChange,
  onSave,
  onReset,
  isSaving,
  hasChanges,
}: {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onReset: () => void
  isSaving: boolean
  hasChanges: boolean
}) {
  const [isValid, setIsValid] = useState(true)

  const handleChange = (newValue: string) => {
    onChange(newValue)
    try {
      JSON.parse(newValue)
      setIsValid(true)
    } catch {
      setIsValid(false)
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(value)
      onChange(JSON.stringify(parsed, null, 2))
      setIsValid(true)
    } catch {
      // Keep as-is if invalid
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isValid && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Invalid JSON
            </Badge>
          )}
          {hasChanges && isValid && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={formatJson}
            className="h-7 text-xs"
            disabled={!isValid}
          >
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs"
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            className="h-7 text-xs"
            disabled={!hasChanges || !isValid || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          'font-mono text-xs min-h-[200px] resize-y',
          !isValid && 'border-destructive focus-visible:ring-destructive'
        )}
        placeholder="No content"
      />
    </div>
  )
}

// Regenerate button with model selector
function RegenerateButton({
  contentType,
  gameId,
  onComplete,
  disabled,
}: {
  contentType: ContentType
  gameId: string
  onComplete: () => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegenerate = async (model: ModelType) => {
    setIsRegenerating(true)
    setError(null)
    setIsOpen(false)

    try {
      const response = await fetch('/api/admin/rulebook/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          contentTypes: [contentType],
          model,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Regeneration failed')
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate')
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isRegenerating) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Regenerating...
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 p-2"
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 pb-1">
              Select model
            </p>
            {MODEL_OPTIONS.map((option) => {
              const OptionIcon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => handleRegenerate(option.value)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-left"
                >
                  <OptionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {option.value === 'sonnet' && '(rec)'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Content section with collapsible details
function ContentSection({
  title,
  icon: Icon,
  iconColor,
  hasContent,
  sourceContent,
  generatedContent,
  contentType,
  jsonValue,
  onJsonSave,
  gameId,
  onRegenerate,
  hasRulebook,
  defaultOpen = false,
}: {
  title: string
  icon: React.ElementType
  iconColor: string
  hasContent: boolean
  sourceContent: React.ReactNode
  generatedContent: React.ReactNode
  contentType: ContentType
  jsonValue: object | null
  onJsonSave: (contentType: ContentType, value: object) => Promise<void>
  gameId: string
  onRegenerate: () => void
  hasRulebook: boolean
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [editMode, setEditMode] = useState(false)
  const originalJson = jsonValue ? JSON.stringify(jsonValue, null, 2) : ''
  const [editedJson, setEditedJson] = useState(originalJson)
  const [isSaving, setIsSaving] = useState(false)
  const hasChanges = editedJson !== originalJson

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const parsed = JSON.parse(editedJson)
      await onJsonSave(contentType, parsed)
      setEditMode(false)
    } catch {
      // Error handled by validation
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setEditedJson(originalJson)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <CollapsibleTrigger className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity text-left">
          <div className={cn('p-2 rounded-md', iconColor)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-medium">{title}</span>
            {hasContent ? (
              <Badge variant="outline" className="ml-2 text-xs text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">
                Missing
              </Badge>
            )}
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-muted-foreground transition-transform ml-auto',
            isOpen && 'rotate-180'
          )} />
        </CollapsibleTrigger>
        <div className="flex items-center gap-2 ml-2">
          <RegenerateButton
            contentType={contentType}
            gameId={gameId}
            onComplete={onRegenerate}
            disabled={!hasRulebook}
          />
        </div>
      </div>

      <CollapsibleContent>
        <div className="mt-2 p-4 rounded-lg border bg-muted/30">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
            {/* Source Data */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Source Data
              </h4>
              <div className="space-y-4">
                {sourceContent}
              </div>
            </div>

            {/* Generated Content */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Generated
              </h4>
              {generatedContent}
            </div>

            {/* Final Output / JSON Editor */}
            <div className="lg:col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Pencil className="h-3 w-3" />
                  Final Output
                </h4>
                {!editMode && hasContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditMode(true)
                    }}
                    className="h-6 text-xs"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {editMode ? (
                <JsonEditor
                  value={editedJson}
                  onChange={setEditedJson}
                  onSave={handleSave}
                  onReset={handleReset}
                  isSaving={isSaving}
                  hasChanges={hasChanges}
                />
              ) : hasContent ? (
                <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md overflow-auto max-h-[200px] font-mono">
                  {originalJson.length > 500 ? originalJson.slice(0, 500) + '\n...' : originalJson}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No content to edit</p>
              )}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Rules content display
function RulesDisplay({ content }: { content: RulesContent | null }) {
  if (!content) return <p className="text-sm text-muted-foreground">No content generated</p>

  return (
    <div className="space-y-3">
      {content.quickStart && content.quickStart.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1">Quick Start</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {content.quickStart.slice(0, 3).map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
            {content.quickStart.length > 3 && (
              <li className="text-muted-foreground/60">+{content.quickStart.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
      {content.winCondition && (
        <div>
          <p className="text-xs font-medium mb-1">Win Condition</p>
          <p className="text-xs text-muted-foreground">{content.winCondition}</p>
        </div>
      )}
      {content.coreRules && content.coreRules.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1">Core Rules ({content.coreRules.length})</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {content.coreRules.slice(0, 3).map((rule, i) => (
              <li key={i}>• {rule.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Setup content display
function SetupDisplay({ content }: { content: SetupContent | null }) {
  if (!content) return <p className="text-sm text-muted-foreground">No content generated</p>

  return (
    <div className="space-y-3">
      {content.estimatedTime && (
        <div>
          <p className="text-xs font-medium mb-1">Setup Time</p>
          <p className="text-xs text-muted-foreground">{content.estimatedTime}</p>
        </div>
      )}
      {content.components && content.components.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1">Components ({content.components.length})</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {content.components.slice(0, 4).map((c, i) => (
              <li key={i}>• {c.name}{c.quantity ? ` (${c.quantity})` : ''}</li>
            ))}
            {content.components.length > 4 && (
              <li className="text-muted-foreground/60">+{content.components.length - 4} more</li>
            )}
          </ul>
        </div>
      )}
      {content.steps && content.steps.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1">Setup Steps ({content.steps.length})</p>
          <ol className="text-xs text-muted-foreground space-y-1">
            {content.steps.slice(0, 3).map((s, i) => (
              <li key={i}>{i + 1}. {s.step || s.details}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// Reference content display
function ReferenceDisplay({ content }: { content: ReferenceContent | null }) {
  if (!content) return <p className="text-sm text-muted-foreground">No content generated</p>

  return (
    <div className="space-y-3">
      {content.turnSummary && content.turnSummary.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1">Turn Summary</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {content.turnSummary.slice(0, 3).map((item, i) => {
              const text = typeof item === 'string' ? item : (item as { phase?: string }).phase || ''
              return <li key={i}>• {text}</li>
            })}
          </ul>
        </div>
      )}
      {content.keyActions && content.keyActions.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1">Key Actions ({content.keyActions.length})</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {content.keyActions.slice(0, 3).map((a, i) => (
              <li key={i}>• {a.name}</li>
            ))}
          </ul>
        </div>
      )}
      {content.endGame && (
        <div>
          <p className="text-xs font-medium mb-1">End Game</p>
          <p className="text-xs text-muted-foreground">
            {typeof content.endGame === 'string' ? content.endGame : content.endGame.winner}
          </p>
        </div>
      )}
    </div>
  )
}

// Readiness checklist item
function ChecklistItem({
  label,
  checked,
  href,
}: {
  label: string
  checked: boolean
  href?: string
}) {
  const content = (
    <>
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40" />
      )}
      <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      {!checked && href && (
        <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
      )}
    </>
  )

  if (!checked && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm hover:text-foreground transition-colors"
        title={`Edit ${label.toLowerCase()}`}
      >
        {content}
      </a>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {content}
    </div>
  )
}

export function ContentReviewPanel({ game, onPublish }: ContentReviewPanelProps) {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)

  const gameEditorUrl = `/admin/games/${game.id}`

  const checks = [
    { label: 'Rules content', ok: !!game.rules_content },
    { label: 'Setup guide', ok: !!game.setup_content },
    { label: 'Quick reference', ok: !!game.reference_content },
    { label: 'Thumbnail', ok: !!game.thumbnail_url, href: gameEditorUrl },
    { label: 'Categories', ok: game.categories.length > 0, href: gameEditorUrl },
  ]
  const passedCount = checks.filter(c => c.ok).length
  const canPublish = checks.every(c => c.ok) && !game.is_published

  const hasRulebook = !!game.rulebook_url

  // Content summary for publish confirmation
  const contentSummary = {
    rules: game.rules_content ? {
      quickStart: (game.rules_content.quickStart?.length || 0),
      coreRules: (game.rules_content.coreRules?.length || 0),
    } : null,
    setup: game.setup_content ? {
      steps: (game.setup_content.steps?.length || 0),
      components: (game.setup_content.components?.length || 0),
    } : null,
    reference: game.reference_content ? {
      actions: (game.reference_content.keyActions?.length || 0),
    } : null,
  }

  const handleJsonSave = useCallback(async (contentType: ContentType, value: object) => {
    const fieldMap: Record<ContentType, string> = {
      rules: 'rules_content',
      setup: 'setup_content',
      reference: 'reference_content',
    }

    const response = await fetch(`/api/admin/vecna/${game.id}/content`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: fieldMap[contentType],
        value,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save content')
    }

    router.refresh()
  }, [game.id, router])

  const handleRegenerate = useCallback(() => {
    router.refresh()
  }, [router])

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch(`/api/admin/vecna/${game.id}/publish`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to publish')
      onPublish?.()
      router.refresh()
    } catch (error) {
      console.error('Publish error:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    setIsUnpublishing(true)
    try {
      const response = await fetch(`/api/admin/vecna/${game.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'review_pending' }),
      })
      if (!response.ok) throw new Error('Failed to unpublish')
      router.refresh()
    } catch (error) {
      console.error('Unpublish error:', error)
    } finally {
      setIsUnpublishing(false)
    }
  }

  const previewLinks = [
    { label: 'Rules', href: `/games/${game.slug}/rules`, hasContent: !!game.rules_content },
    { label: 'Setup', href: `/games/${game.slug}/setup`, hasContent: !!game.setup_content },
    { label: 'Reference', href: `/games/${game.slug}/reference`, hasContent: !!game.reference_content },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Content Review</h2>
            <p className="text-sm text-muted-foreground">
              {game.is_published ? 'This game is live' : 'Review before publishing'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview dropdown - always visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {previewLinks.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  disabled={!link.hasContent}
                  asChild={link.hasContent}
                >
                  {link.hasContent ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{link.label} (no content)</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {game.is_published ? (
            /* Published state: badge + unpublish option */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600 px-1.5">
                    <Globe className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={`/games/${game.slug}`} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    View public page
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      {isUnpublishing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <EyeOff className="h-4 w-4 mr-2" />
                      )}
                      Unpublish
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unpublish {game.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the game from the public site. You can republish it later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleUnpublish}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Unpublish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Not published: publish button with enhanced confirmation */
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!canPublish || isPublishing}>
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  Publish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish {game.name}?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      <p>This will make the game visible on the public site with:</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="p-2 rounded bg-muted">
                          <p className="font-medium text-foreground">Rules</p>
                          <p className="text-xs">
                            {contentSummary.rules
                              ? `${contentSummary.rules.quickStart} tips, ${contentSummary.rules.coreRules} rules`
                              : 'No content'}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-muted">
                          <p className="font-medium text-foreground">Setup</p>
                          <p className="text-xs">
                            {contentSummary.setup
                              ? `${contentSummary.setup.steps} steps, ${contentSummary.setup.components} items`
                              : 'No content'}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-muted">
                          <p className="font-medium text-foreground">Reference</p>
                          <p className="text-xs">
                            {contentSummary.reference
                              ? `${contentSummary.reference.actions} actions`
                              : 'No content'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePublish}>
                    <Globe className="h-4 w-4 mr-2" />
                    Publish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Checklist - compact inline */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 rounded-lg border bg-card">
        <span className="text-sm font-medium">Checklist</span>
        <Badge variant={passedCount === checks.length ? 'default' : 'secondary'}>
          {passedCount}/{checks.length}
        </Badge>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {checks.map((check, i) => (
            <ChecklistItem
              key={i}
              label={check.label}
              checked={check.ok}
              href={check.href}
            />
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-3">
        <ContentSection
          title="Rules Summary"
          icon={BookOpen}
          iconColor="bg-orange-500"
          hasContent={!!game.rules_content}
          defaultOpen={true}
          contentType="rules"
          jsonValue={game.rules_content}
          onJsonSave={handleJsonSave}
          gameId={game.id}
          onRegenerate={handleRegenerate}
          hasRulebook={hasRulebook}
          sourceContent={
            <>
              <SourcePreview label="Wikipedia Gameplay" source="wikipedia" content={game.wikipedia_gameplay} />
              <SourcePreview label="Wikipedia Origins" source="wikipedia" content={game.wikipedia_origins} />
              <SourcePreview label="BGG Description" source="bgg" content={game.bgg_raw_data?.description} />
            </>
          }
          generatedContent={<RulesDisplay content={game.rules_content} />}
        />

        <ContentSection
          title="Setup Guide"
          icon={ListChecks}
          iconColor="bg-blue-500"
          hasContent={!!game.setup_content}
          contentType="setup"
          jsonValue={game.setup_content}
          onJsonSave={handleJsonSave}
          gameId={game.id}
          onRegenerate={handleRegenerate}
          hasRulebook={hasRulebook}
          sourceContent={
            <>
              <SourcePreview label="Wikipedia Gameplay" source="wikipedia" content={game.wikipedia_gameplay} />
              {game.bgg_raw_data && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Player Info</span>
                    <DataSourceBadge source="bgg" size="sm" showTooltip={false} />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {game.bgg_raw_data.minplayers}-{game.bgg_raw_data.maxplayers} players, {game.bgg_raw_data.minplaytime}-{game.bgg_raw_data.maxplaytime} min
                  </p>
                </div>
              )}
            </>
          }
          generatedContent={<SetupDisplay content={game.setup_content} />}
        />

        <ContentSection
          title="Quick Reference"
          icon={ClipboardList}
          iconColor="bg-violet-500"
          hasContent={!!game.reference_content}
          contentType="reference"
          jsonValue={game.reference_content}
          onJsonSave={handleJsonSave}
          gameId={game.id}
          onRegenerate={handleRegenerate}
          hasRulebook={hasRulebook}
          sourceContent={
            <>
              <SourcePreview label="Wikipedia Reception" source="wikipedia" content={game.wikipedia_reception} />
              {game.wikipedia_awards && game.wikipedia_awards.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Awards</span>
                    <DataSourceBadge source="wikipedia" size="sm" showTooltip={false} />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {game.wikipedia_awards.slice(0, 2).map(a => a.name).join(', ')}
                  </p>
                </div>
              )}
            </>
          }
          generatedContent={<ReferenceDisplay content={game.reference_content} />}
        />
      </div>
    </div>
  )
}
