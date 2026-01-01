'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  FileText,
  Settings,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
} from 'lucide-react'
import type { Game, RulesContent, SetupContent, ReferenceContent } from '@/types/database'

interface ReviewContentStepProps {
  game: Game
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
  onComplete: () => void
}

export function ReviewContentStep({ game, updateField, onComplete }: ReviewContentStepProps) {
  const [editMode, setEditMode] = useState<'rules' | 'setup' | 'reference' | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    rules: true,
    setup: true,
    reference: true,
  })

  // Parse JSONB content with fallbacks
  const rulesContent = (game.rules_content as unknown as RulesContent) || {
    quickStart: [],
    overview: '',
    tips: [],
  }

  const setupContent = (game.setup_content as unknown as SetupContent) || {
    firstPlayerRule: '',
    quickTips: [],
  }

  const referenceContent = (game.reference_content as unknown as ReferenceContent) || {
    endGame: '',
    quickReminders: [],
  }

  const hasRulesContent = rulesContent.overview || (rulesContent.quickStart?.length ?? 0) > 0
  const hasSetupContent = setupContent.firstPlayerRule || (setupContent.quickTips?.length ?? 0) > 0
  const hasReferenceContent = referenceContent.endGame || (referenceContent.quickReminders?.length ?? 0) > 0
  const hasAnyContent = hasRulesContent || hasSetupContent || hasReferenceContent

  const toggleSection = (section: 'rules' | 'setup' | 'reference') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <CardTitle>Review Generated Content</CardTitle>
              <CardDescription>
                Review the AI-generated content and make any necessary edits before publishing.
              </CardDescription>
            </div>
            <Button onClick={onComplete} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Content Looks Good
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* No content warning */}
      {!hasAnyContent && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">No content generated yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Go back to Step 2 to generate content from the rulebook, or add content manually below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Content */}
      <Collapsible open={expandedSections.rules} onOpenChange={() => toggleSection('rules')}>
        <Card>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Rules Content
                    {hasRulesContent && <Badge variant="outline" className="text-xs">Has content</Badge>}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditMode(editMode === 'rules' ? null : 'rules')
                  }}
                  className="gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
                {expandedSections.rules ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {editMode === 'rules' ? (
                <>
                  <div className="space-y-2">
                    <Label>Overview</Label>
                    <Textarea
                      value={rulesContent.overview}
                      onChange={(e) =>
                        updateField('rules_content', { ...rulesContent, overview: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quick Start Steps (one per line)</Label>
                    <Textarea
                      value={rulesContent.quickStart?.join('\n') || ''}
                      onChange={(e) =>
                        updateField('rules_content', {
                          ...rulesContent,
                          quickStart: e.target.value.split('\n').filter(Boolean),
                        })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Strategy Tips (one per line)</Label>
                    <Textarea
                      value={rulesContent.tips?.join('\n') || ''}
                      onChange={(e) =>
                        updateField('rules_content', {
                          ...rulesContent,
                          tips: e.target.value.split('\n').filter(Boolean),
                        })
                      }
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  {rulesContent.overview && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Overview</Label>
                      <p className="text-sm mt-1">{rulesContent.overview}</p>
                    </div>
                  )}
                  {rulesContent.quickStart && rulesContent.quickStart.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Quick Start</Label>
                      <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                        {rulesContent.quickStart.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {rulesContent.tips && rulesContent.tips.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Strategy Tips</Label>
                      <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                        {rulesContent.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!hasRulesContent && (
                    <p className="text-sm text-muted-foreground italic">No rules content yet</p>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Setup Content */}
      <Collapsible open={expandedSections.setup} onOpenChange={() => toggleSection('setup')}>
        <Card>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Setup Content
                    {hasSetupContent && <Badge variant="outline" className="text-xs">Has content</Badge>}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditMode(editMode === 'setup' ? null : 'setup')
                  }}
                  className="gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
                {expandedSections.setup ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {editMode === 'setup' ? (
                <>
                  <div className="space-y-2">
                    <Label>First Player Rule</Label>
                    <Input
                      value={setupContent.firstPlayerRule}
                      onChange={(e) =>
                        updateField('setup_content', { ...setupContent, firstPlayerRule: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Setup Tips (one per line)</Label>
                    <Textarea
                      value={setupContent.quickTips?.join('\n') || ''}
                      onChange={(e) =>
                        updateField('setup_content', {
                          ...setupContent,
                          quickTips: e.target.value.split('\n').filter(Boolean),
                        })
                      }
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  {setupContent.firstPlayerRule && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">First Player</Label>
                      <p className="text-sm mt-1">{setupContent.firstPlayerRule}</p>
                    </div>
                  )}
                  {setupContent.quickTips && setupContent.quickTips.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Setup Tips</Label>
                      <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                        {setupContent.quickTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!hasSetupContent && (
                    <p className="text-sm text-muted-foreground italic">No setup content yet</p>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Reference Content */}
      <Collapsible open={expandedSections.reference} onOpenChange={() => toggleSection('reference')}>
        <Card>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-pink-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Reference Content
                    {hasReferenceContent && <Badge variant="outline" className="text-xs">Has content</Badge>}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditMode(editMode === 'reference' ? null : 'reference')
                  }}
                  className="gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
                {expandedSections.reference ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {editMode === 'reference' ? (
                <>
                  <div className="space-y-2">
                    <Label>End Game Condition</Label>
                    <Textarea
                      value={referenceContent.endGame}
                      onChange={(e) =>
                        updateField('reference_content', { ...referenceContent, endGame: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quick Reminders (one per line)</Label>
                    <Textarea
                      value={referenceContent.quickReminders?.join('\n') || ''}
                      onChange={(e) =>
                        updateField('reference_content', {
                          ...referenceContent,
                          quickReminders: e.target.value.split('\n').filter(Boolean),
                        })
                      }
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  {referenceContent.endGame && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">End Game</Label>
                      <p className="text-sm mt-1">{referenceContent.endGame}</p>
                    </div>
                  )}
                  {referenceContent.quickReminders && referenceContent.quickReminders.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Quick Reminders</Label>
                      <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                        {referenceContent.quickReminders.map((reminder, i) => (
                          <li key={i}>{reminder}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!hasReferenceContent && (
                    <p className="text-sm text-muted-foreground italic">No reference content yet</p>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
