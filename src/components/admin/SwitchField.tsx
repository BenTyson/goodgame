'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SwitchFieldProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  /** Use compact styling (smaller description text) for grid layouts */
  compact?: boolean
}

/**
 * Shared switch toggle field with label and description
 * Used in admin tabs for boolean settings
 *
 * @example
 * <SwitchField
 *   label="Published"
 *   description="Make this game visible on the public site"
 *   checked={game.is_published}
 *   onCheckedChange={(checked) => updateField('is_published', checked)}
 * />
 */
export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  compact = false,
}: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
      <div className="space-y-0.5">
        <Label className="text-base">{label}</Label>
        {description && (
          <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
