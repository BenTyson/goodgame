'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { GameRelationsEditor } from '@/components/admin/GameRelationsEditor'
import { Link2 } from 'lucide-react'
import type { Game } from '@/types/database'
import { WizardStepHeader } from './WizardStepHeader'

interface RelationsStepProps {
  game: Game
  onComplete: () => void
  onSkip: () => void
}

export function RelationsStep({
  game,
  onComplete,
  onSkip,
}: RelationsStepProps) {
  // Auto-complete this step on mount since "No Family" + "No Relations" is a valid state
  // User can still make changes, but Next button will be enabled
  useEffect(() => {
    onComplete()
  }, [onComplete])

  return (
    <Card>
      <WizardStepHeader
        stepNumber={6}
        title="Game Relations"
        description="Assign this game to a family and define relationships with other games (expansions, sequels, etc.)."
        icon={<Link2 className="h-5 w-5" />}
      />
      <CardContent className="pt-0">
        <GameRelationsEditor game={game} />
      </CardContent>
    </Card>
  )
}
