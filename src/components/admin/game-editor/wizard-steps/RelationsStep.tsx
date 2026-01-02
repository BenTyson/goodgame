'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GameRelationsEditor } from '@/components/admin/GameRelationsEditor'
import { Link2 } from 'lucide-react'
import type { Game } from '@/types/database'

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
  // This step doesn't auto-complete - user should review relations manually
  // The GameRelationsEditor handles its own loading state

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Link2 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle>Game Relations</CardTitle>
            <CardDescription>
              Assign this game to a family and define relationships with other games (expansions, sequels, etc.).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <GameRelationsEditor game={game} />
      </CardContent>
    </Card>
  )
}
