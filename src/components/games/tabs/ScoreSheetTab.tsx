'use client'

import { ScoreSheetGenerator } from '@/components/score-sheet'
import type { GameRow } from '@/types/database'

// Database config type - matches what getScoreSheetConfig returns
interface ScoreSheetConfig {
  id: string
  game_id: string | null
  layout_type: string | null
  orientation: string | null
  show_total_row: boolean | null
  color_scheme: string | null
  player_min: number | null
  player_max: number | null
  custom_styles?: {
    instructions?: string[]
    tiebreaker?: string | null
  } | null
  fields: {
    id: string
    config_id: string | null
    name: string | null
    label: string | null
    field_type: string | null
    section?: string | null
    description?: string | null
    display_order: number
    min_value?: number | null
    max_value?: number | null
    is_required?: boolean | null
    per_player?: boolean | null
    placeholder?: string | null
  }[]
}

export interface ScoreSheetTabProps {
  game: GameRow
  scoreSheetConfig: ScoreSheetConfig | null
}

export function ScoreSheetTab({ game, scoreSheetConfig }: ScoreSheetTabProps) {
  return (
    <div className="max-w-4xl">
      <ScoreSheetGenerator
        game={game}
        minPlayers={game.player_count_min || 2}
        maxPlayers={Math.min(game.player_count_max || 6, 6)}
        scoreSheetConfig={scoreSheetConfig}
      />
    </div>
  )
}
