'use client'

import { useState } from 'react'
import { Check, HelpCircle, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { RSVPStatus } from '@/types/tables'

interface RSVPButtonsProps {
  currentStatus: RSVPStatus
  onRSVP: (status: RSVPStatus) => Promise<void>
  isHost?: boolean
  disabled?: boolean
}

export function RSVPButtons({ currentStatus, onRSVP, isHost, disabled }: RSVPButtonsProps) {
  const [loading, setLoading] = useState<RSVPStatus | null>(null)

  if (isHost) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">You&apos;re hosting</span>
      </div>
    )
  }

  const handleClick = async (status: RSVPStatus) => {
    if (loading || disabled) return
    setLoading(status)
    try {
      await onRSVP(status)
    } finally {
      setLoading(null)
    }
  }

  const buttons: { status: RSVPStatus; label: string; icon: typeof Check; activeClass: string }[] = [
    {
      status: 'attending',
      label: 'Attending',
      icon: Check,
      activeClass: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500',
    },
    {
      status: 'maybe',
      label: 'Maybe',
      icon: HelpCircle,
      activeClass: 'bg-sky-500 hover:bg-sky-600 text-white border-sky-500',
    },
    {
      status: 'declined',
      label: 'Decline',
      icon: X,
      activeClass: 'bg-slate-500 hover:bg-slate-600 text-white border-slate-500',
    },
  ]

  return (
    <div className="flex gap-2">
      {buttons.map(({ status, label, icon: Icon, activeClass }) => {
        const isActive = currentStatus === status
        const isLoading = loading === status

        return (
          <Button
            key={status}
            variant="outline"
            size="sm"
            className={cn(
              'flex-1 transition-all',
              isActive && activeClass
            )}
            onClick={() => handleClick(status)}
            disabled={disabled || loading !== null}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Icon className="h-4 w-4 mr-1.5" />
            )}
            {label}
          </Button>
        )
      })}
    </div>
  )
}
