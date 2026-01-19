'use client'

import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Send, Loader2, MessageSquare, Trash2, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import type { TableCommentWithAuthor } from '@/types/tables'

interface TableCommentsProps {
  tableId: string
  initialComments: TableCommentWithAuthor[]
  currentUserId?: string
  isHost: boolean
  isParticipant: boolean
}

export function TableComments({
  tableId,
  initialComments,
  currentUserId,
  isHost,
  isParticipant,
}: TableCommentsProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [newComment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting || !currentUserId) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/tables/${tableId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        const { comment } = await response.json()
        setComments((prev) => [...prev, comment])
        setNewComment('')

        // Scroll to new comment
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/tables/${tableId}/comments/${deleteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== deleteId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Discussion
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </h2>
      </div>

      {/* Comments list */}
      <div className="max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
            {isParticipant && (
              <p className="text-xs mt-1">Start the conversation!</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isHost={isHost}
                onDelete={() => setDeleteId(comment.id)}
              />
            ))}
          </div>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* New comment form */}
      {isParticipant && currentUserId ? (
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={submitting}
              className="min-h-[40px] max-h-[150px] resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || submitting}
              className="flex-shrink-0"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      ) : (
        <div className="p-4 border-t border-border/50 text-center text-sm text-muted-foreground">
          {currentUserId
            ? 'Only participants can comment'
            : 'Sign in to comment'}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
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
    </div>
  )
}

interface CommentItemProps {
  comment: TableCommentWithAuthor
  currentUserId?: string
  isHost: boolean
  onDelete: () => void
}

function CommentItem({ comment, currentUserId, isHost, onDelete }: CommentItemProps) {
  const isOwner = currentUserId === comment.userId
  const canDelete = isOwner || isHost

  return (
    <div
      className={cn(
        'p-4 group',
        isOwner && 'bg-accent/30'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          {(comment.author.customAvatarUrl || comment.author.avatarUrl) && (
            <AvatarImage
              src={comment.author.customAvatarUrl || comment.author.avatarUrl || ''}
              alt={comment.author.displayName || comment.author.username || 'User'}
            />
          )}
          <AvatarFallback className="text-xs">
            {(comment.author.displayName || comment.author.username || 'U').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.author.displayName || comment.author.username || 'User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
