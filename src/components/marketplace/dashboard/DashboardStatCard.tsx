'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardStatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  href?: string
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function DashboardStatCard({
  icon,
  label,
  value,
  subtitle,
  href,
  color,
}: DashboardStatCardProps) {
  const content = (
    <Card className={cn(
      'transition-all',
      href && 'hover:shadow-md hover:border-primary/20 cursor-pointer'
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-xl', color)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight mt-0.5">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
