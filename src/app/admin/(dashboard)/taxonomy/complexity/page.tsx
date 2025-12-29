import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Gauge,
  Gamepad2,
  Info,
} from 'lucide-react'
import type { ComplexityTier } from '@/types/database'

interface TierWithCount extends ComplexityTier {
  game_count: number
}

async function getComplexityTiers(): Promise<TierWithCount[]> {
  const supabase = createAdminClient()

  const { data: tiers } = await supabase
    .from('complexity_tiers')
    .select('*')
    .order('display_order')

  if (!tiers) return []

  // Get game counts for each tier
  const { data: games } = await supabase
    .from('games')
    .select('complexity_tier_id')
    .not('complexity_tier_id', 'is', null)

  const countMap = new Map<string, number>()
  games?.forEach(g => {
    if (g.complexity_tier_id) {
      const current = countMap.get(g.complexity_tier_id) || 0
      countMap.set(g.complexity_tier_id, current + 1)
    }
  })

  return tiers.map(t => ({
    ...t,
    game_count: countMap.get(t.id) || 0
  }))
}

const tierColors: Record<string, string> = {
  'gateway': 'bg-green-500/10 text-green-600 border-green-500/20',
  'family': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'medium': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'heavy': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'expert': 'bg-red-500/10 text-red-600 border-red-500/20',
}

export default async function AdminComplexityPage() {
  const tiers = await getComplexityTiers()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/taxonomy">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Gauge className="h-7 w-7 text-rose-500" />
              Complexity Tiers
            </h1>
            <p className="text-muted-foreground mt-1">
              Weight-based game classifications
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400">
              Complexity tiers are automatically assigned
            </p>
            <p className="text-muted-foreground mt-1">
              Games are assigned to tiers based on their BGG weight value during import.
              These tiers help users find games matching their experience level.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tiers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-sm px-3 py-1 ${tierColors[tier.slug] || ''}`}
                >
                  {tier.name}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">
                  {tier.weight_min.toFixed(1)} - {tier.weight_max.toFixed(1)}
                </span>
              </div>
              <CardDescription className="mt-2">
                {tier.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>{tier.game_count}</strong> {tier.game_count === 1 ? 'game' : 'games'}
                </span>
              </div>

              {/* Weight bar visualization */}
              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${tier.slug === 'gateway' ? 'bg-green-500' :
                      tier.slug === 'family' ? 'bg-blue-500' :
                      tier.slug === 'medium' ? 'bg-yellow-500' :
                      tier.slug === 'heavy' ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{
                      width: `${((tier.weight_max - 1) / 4) * 100}%`,
                      marginLeft: `${((tier.weight_min - 1) / 4) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1.0</span>
                  <span>5.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tiers.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Gauge className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No complexity tiers found</h3>
            <p className="text-muted-foreground mt-1">
              Run the database migration to create complexity tiers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
