'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EyeOff, ArrowLeft, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminPreviewBannerProps {
  gameId: string
  gameName: string
}

export function AdminPreviewBanner({ gameId, gameName }: AdminPreviewBannerProps) {
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const response = await fetch('/api/admin/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          data: { is_published: true, content_status: 'published' }
        })
      })
      if (response.ok) {
        window.location.reload()
      }
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm supports-backdrop-blur:bg-background/80">
      <div className="container py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-muted">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground">Preview</span>
              <span className="hidden sm:inline text-sm text-muted-foreground truncate">
                {gameName}
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20">
                Unpublished
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href={`/admin/games/${gameId}`}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Editor</span>
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
