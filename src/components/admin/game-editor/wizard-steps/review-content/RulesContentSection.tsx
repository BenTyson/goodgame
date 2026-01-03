'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'
import { ContentSection } from './ContentSection'
import type { RulesContent } from '@/types/database'

interface RulesContentSectionProps {
  content: RulesContent
  hasContent: boolean
  onUpdate: (content: RulesContent) => void
}

export function RulesContentSection({
  content,
  hasContent,
  onUpdate,
}: RulesContentSectionProps) {
  return (
    <ContentSection
      title="Rules Content"
      icon={<FileText className="h-4 w-4 text-orange-500" />}
      iconBgClass="bg-orange-500/10"
      hasContent={hasContent}
      viewContent={
        <>
          {content.overview && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Overview</Label>
              <p className="text-sm mt-1">{content.overview}</p>
            </div>
          )}
          {content.quickStart && content.quickStart.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Quick Start</Label>
              <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                {content.quickStart.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          {content.tips && content.tips.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Strategy Tips</Label>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                {content.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          {!hasContent && (
            <p className="text-sm text-muted-foreground italic">No rules content yet</p>
          )}
        </>
      }
      editContent={
        <>
          <div className="space-y-2">
            <Label>Overview</Label>
            <Textarea
              value={content.overview}
              onChange={(e) => onUpdate({ ...content, overview: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Quick Start Steps (one per line)</Label>
            <Textarea
              value={content.quickStart?.join('\n') || ''}
              onChange={(e) =>
                onUpdate({
                  ...content,
                  quickStart: e.target.value.split('\n').filter(Boolean),
                })
              }
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Strategy Tips (one per line)</Label>
            <Textarea
              value={content.tips?.join('\n') || ''}
              onChange={(e) =>
                onUpdate({
                  ...content,
                  tips: e.target.value.split('\n').filter(Boolean),
                })
              }
              rows={3}
            />
          </div>
        </>
      }
    />
  )
}
