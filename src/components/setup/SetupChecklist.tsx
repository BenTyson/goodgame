'use client'

import { useState } from 'react'
import { Check, Info, Users, Boxes, Flag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SetupStep {
  title: string
  description: string
  tip?: string
}

interface SetupChecklistProps {
  playerSetup: SetupStep[]
  boardSetup: SetupStep[]
  firstPlayerRule: string
}

export function SetupChecklist({
  playerSetup,
  boardSetup,
  firstPlayerRule,
}: SetupChecklistProps) {
  const [playerChecked, setPlayerChecked] = useState<boolean[]>(
    new Array(playerSetup.length).fill(false)
  )
  const [boardChecked, setBoardChecked] = useState<boolean[]>(
    new Array(boardSetup.length).fill(false)
  )
  const [firstPlayerChecked, setFirstPlayerChecked] = useState(false)

  const totalSteps = playerSetup.length + boardSetup.length + 1
  const completedSteps =
    playerChecked.filter(Boolean).length +
    boardChecked.filter(Boolean).length +
    (firstPlayerChecked ? 1 : 0)
  const progress = Math.round((completedSteps / totalSteps) * 100)

  const togglePlayerStep = (index: number) => {
    const newChecked = [...playerChecked]
    newChecked[index] = !newChecked[index]
    setPlayerChecked(newChecked)
  }

  const toggleBoardStep = (index: number) => {
    const newChecked = [...boardChecked]
    newChecked[index] = !newChecked[index]
    setBoardChecked(newChecked)
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Setup Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedSteps} of {totalSteps} steps
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <p className="mt-3 text-sm text-primary font-medium flex items-center gap-2">
              <Check className="h-4 w-4" />
              Setup complete! You&apos;re ready to play!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Player Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            Player Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {playerSetup.map((step, index) => (
            <ChecklistItem
              key={index}
              step={step}
              checked={playerChecked[index]}
              onToggle={() => togglePlayerStep(index)}
              stepNumber={index + 1}
            />
          ))}
        </CardContent>
      </Card>

      {/* Board Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Boxes className="h-4 w-4 text-primary" />
            </div>
            Board & Component Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {boardSetup.map((step, index) => (
            <ChecklistItem
              key={index}
              step={step}
              checked={boardChecked[index]}
              onToggle={() => toggleBoardStep(index)}
              stepNumber={index + 1}
            />
          ))}
        </CardContent>
      </Card>

      {/* First Player */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <button
            onClick={() => setFirstPlayerChecked(!firstPlayerChecked)}
            className="w-full flex items-start gap-4 text-left"
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                firstPlayerChecked
                  ? 'bg-primary border-primary text-white'
                  : 'border-muted-foreground/30 hover:border-primary/50'
              )}
            >
              {firstPlayerChecked ? (
                <Check className="h-4 w-4" />
              ) : (
                <Flag className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium flex items-center gap-2">
                Determine First Player
                <span className="text-xs text-muted-foreground font-normal">
                  (Final step!)
                </span>
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {firstPlayerRule}
              </p>
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

function ChecklistItem({
  step,
  checked,
  onToggle,
  stepNumber,
}: {
  step: SetupStep
  checked: boolean
  onToggle: () => void
  stepNumber: number
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-start gap-4 p-3 rounded-lg text-left transition-colors',
        checked
          ? 'bg-muted/50'
          : 'hover:bg-muted/30'
      )}
    >
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          checked
            ? 'bg-primary border-primary text-white'
            : 'border-muted-foreground/30 hover:border-primary/50'
        )}
      >
        {checked ? (
          <Check className="h-3 w-3" />
        ) : (
          <span className="text-xs text-muted-foreground">{stepNumber}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            'font-medium transition-colors',
            checked && 'text-muted-foreground line-through'
          )}
        >
          {step.title}
        </h4>
        <p
          className={cn(
            'text-sm text-muted-foreground mt-0.5',
            checked && 'line-through opacity-60'
          )}
        >
          {step.description}
        </p>
        {step.tip && !checked && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-primary">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{step.tip}</span>
          </div>
        )}
      </div>
    </button>
  )
}
