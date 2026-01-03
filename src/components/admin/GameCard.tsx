'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SourcedImage } from '@/components/admin/TempImage'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  CheckCircle2,
  FileEdit,
  Clock,
  Dices,
  Trash2,
  Loader2,
} from 'lucide-react'

interface GameCardProps {
  game: {
    id: string
    name: string
    slug: string
    content_status: string | null
    is_published: boolean
    bgg_id: number | null
    thumbnail_url: string | null
    wikidata_image_url: string | null
    bgg_raw_data: { thumbnail?: string | null; image?: string | null } | null
  }
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/games', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Failed to delete: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Failed to delete game')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const getStatusBadge = () => {
    if (game.is_published) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-green-600 text-white">
          <CheckCircle2 className="h-3 w-3" />
          Published
        </span>
      )
    }
    if (game.content_status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-500 text-white">
          <FileEdit className="h-3 w-3" />
          Draft
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        <Clock className="h-3 w-3" />
        {game.content_status || 'No content'}
      </span>
    )
  }

  return (
    <>
      <Card padding="none" className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 group cursor-pointer h-full relative">
        <Link href={`/admin/games/${game.id}`}>
          <div className="relative aspect-[4/3] bg-muted">
            {game.wikidata_image_url ? (
              <SourcedImage
                src={game.wikidata_image_url}
                alt={game.name}
                source="wikidata"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : game.thumbnail_url ? (
              <SourcedImage
                src={game.thumbnail_url}
                alt={game.name}
                source="uploaded"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : game.bgg_raw_data?.thumbnail ? (
              <SourcedImage
                src={game.bgg_raw_data.thumbnail}
                alt={game.name}
                source="bgg"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Dices className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute top-1.5 right-1.5">
              {getStatusBadge()}
            </div>
          </div>
          <CardContent className="p-2.5">
            <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {game.name}
            </h3>
          </CardContent>
        </Link>

        {/* Delete button - shows on hover */}
        <Button
          variant="destructive"
          size="icon"
          className="absolute bottom-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowDeleteDialog(true)
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{game.name}</strong>? This will permanently remove the game and all associated data (images, relations, etc.). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
