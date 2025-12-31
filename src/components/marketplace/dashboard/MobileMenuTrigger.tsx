'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileMenuTriggerProps {
  onClick: () => void
  actionCount?: number
}

export function MobileMenuTrigger({ onClick, actionCount = 0 }: MobileMenuTriggerProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="md:hidden relative"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
      {actionCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
          {actionCount > 9 ? '9+' : actionCount}
        </span>
      )}
    </Button>
  )
}
