'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'
import { ContentSection } from './ContentSection'
import { formatEndGame } from '@/lib/admin/wizard'
import type { ReferenceContent } from '@/types/database'

interface ReferenceContentSectionProps {
  content: ReferenceContent
  hasContent: boolean
  onUpdate: (content: ReferenceContent) => void
}

export function ReferenceContentSection({
  content,
  hasContent,
  onUpdate,
}: ReferenceContentSectionProps) {
  return (
    <ContentSection
      title="Reference Content"
      icon={<FileText className="h-4 w-4 text-pink-500" />}
      iconBgClass="bg-pink-500/10"
      hasContent={hasContent}
      viewContent={
        <>
          {content.endGame && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase">End Game</Label>
              <p className="text-sm mt-1 whitespace-pre-line">{formatEndGame(content.endGame)}</p>
            </div>
          )}
          {content.quickReminders && content.quickReminders.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Quick Reminders</Label>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                {content.quickReminders.map((reminder, i) => (
                  <li key={i}>{reminder}</li>
                ))}
              </ul>
            </div>
          )}
          {!hasContent && (
            <p className="text-sm text-muted-foreground italic">No reference content yet</p>
          )}
        </>
      }
      editContent={
        <>
          <div className="space-y-2">
            <Label>End Game Condition</Label>
            <Textarea
              value={formatEndGame(content.endGame)}
              onChange={(e) => onUpdate({ ...content, endGame: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Quick Reminders (one per line)</Label>
            <Textarea
              value={content.quickReminders?.join('\n') || ''}
              onChange={(e) =>
                onUpdate({
                  ...content,
                  quickReminders: e.target.value.split('\n').filter(Boolean),
                })
              }
              rows={4}
            />
          </div>
        </>
      }
    />
  )
}
