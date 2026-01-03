'use client'

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import { ContentSection } from './ContentSection'
import type { SetupContent } from '@/types/database'

interface SetupContentSectionProps {
  content: SetupContent
  hasContent: boolean
  onUpdate: (content: SetupContent) => void
}

export function SetupContentSection({
  content,
  hasContent,
  onUpdate,
}: SetupContentSectionProps) {
  return (
    <ContentSection
      title="Setup Content"
      icon={<Settings className="h-4 w-4 text-cyan-500" />}
      iconBgClass="bg-cyan-500/10"
      hasContent={hasContent}
      viewContent={
        <>
          {content.firstPlayerRule && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase">First Player</Label>
              <p className="text-sm mt-1">{content.firstPlayerRule}</p>
            </div>
          )}
          {content.quickTips && content.quickTips.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Setup Tips</Label>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                {content.quickTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          {!hasContent && (
            <p className="text-sm text-muted-foreground italic">No setup content yet</p>
          )}
        </>
      }
      editContent={
        <>
          <div className="space-y-2">
            <Label>First Player Rule</Label>
            <Input
              value={content.firstPlayerRule}
              onChange={(e) => onUpdate({ ...content, firstPlayerRule: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Setup Tips (one per line)</Label>
            <Textarea
              value={content.quickTips?.join('\n') || ''}
              onChange={(e) =>
                onUpdate({
                  ...content,
                  quickTips: e.target.value.split('\n').filter(Boolean),
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
