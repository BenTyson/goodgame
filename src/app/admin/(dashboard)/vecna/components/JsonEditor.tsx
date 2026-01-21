'use client'

import { useState } from 'react'
import { RotateCcw, Save, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onReset: () => void
  isSaving: boolean
  hasChanges: boolean
}

/**
 * JSON editor with validation, formatting, and save/reset controls.
 * Used for editing game content JSON in the Vecna pipeline.
 */
export function JsonEditor({
  value,
  onChange,
  onSave,
  onReset,
  isSaving,
  hasChanges,
}: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true)

  const handleChange = (newValue: string) => {
    onChange(newValue)
    try {
      JSON.parse(newValue)
      setIsValid(true)
    } catch {
      setIsValid(false)
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(value)
      onChange(JSON.stringify(parsed, null, 2))
      setIsValid(true)
    } catch {
      // Keep as-is if invalid
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isValid && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Invalid JSON
            </Badge>
          )}
          {hasChanges && isValid && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={formatJson}
            className="h-7 text-xs"
            disabled={!isValid}
          >
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs"
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            className="h-7 text-xs"
            disabled={!hasChanges || !isValid || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          'font-mono text-xs min-h-[200px] resize-y',
          !isValid && 'border-destructive focus-visible:ring-destructive'
        )}
        placeholder="No content"
      />
    </div>
  )
}
