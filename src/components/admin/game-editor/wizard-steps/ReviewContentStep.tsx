'use client'

import { useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Game, Json, RulesContent, SetupContent, ReferenceContent } from '@/types/database'
import { parseGameContent, hasGeneratedContent } from '@/lib/admin/wizard'
import {
  RulesContentSection,
  SetupContentSection,
  ReferenceContentSection,
} from './review-content'

interface ReviewContentStepProps {
  game: Game
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
  onComplete: () => void
}

export function ReviewContentStep({ game, updateField, onComplete }: ReviewContentStepProps) {
  // Parse JSONB content with type-safe fallbacks
  const { rulesContent, setupContent, referenceContent } = parseGameContent(game)
  const {
    hasRules: hasRulesContent,
    hasSetup: hasSetupContent,
    hasReference: hasReferenceContent,
    hasAny: hasAnyContent,
  } = hasGeneratedContent(game)

  const handleRulesUpdate = useCallback(
    (content: RulesContent) => {
      updateField('rules_content', content as unknown as Json)
    },
    [updateField]
  )

  const handleSetupUpdate = useCallback(
    (content: SetupContent) => {
      updateField('setup_content', content as unknown as Json)
    },
    [updateField]
  )

  const handleReferenceUpdate = useCallback(
    (content: ReferenceContent) => {
      updateField('reference_content', content as unknown as Json)
    },
    [updateField]
  )

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
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  No content generated yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Go back to Step 2 to generate content from the rulebook, or add content manually
                  below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Sections */}
      <RulesContentSection
        content={rulesContent}
        hasContent={hasRulesContent}
        onUpdate={handleRulesUpdate}
      />

      <SetupContentSection
        content={setupContent}
        hasContent={hasSetupContent}
        onUpdate={handleSetupUpdate}
      />

      <ReferenceContentSection
        content={referenceContent}
        hasContent={hasReferenceContent}
        onUpdate={handleReferenceUpdate}
      />
    </div>
  )
}
