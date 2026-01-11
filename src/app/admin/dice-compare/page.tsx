'use client'

import { useState } from 'react'
import { D10Dice } from '@/components/ratings/D10Dice'
import { D10DiceFlat, D10DiceMinimal, D10DiceSoft } from '@/components/ratings/D10DiceFlat'

export default function DiceComparePage() {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)
  const [selectedValue, setSelectedValue] = useState<number | null>(7)

  const variants = [
    { name: 'Current (3D Sphere)', Component: D10Dice },
    { name: 'Flat (Ring)', Component: D10DiceFlat },
    { name: 'Minimal (Dot)', Component: D10DiceMinimal },
    { name: 'Soft (Neumorphic)', Component: D10DiceSoft },
  ]

  return (
    <div className="container py-12 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dice Style Comparison</h1>
        <p className="text-muted-foreground">
          Click any die to select it. Hover to preview.
        </p>
      </div>

      {/* Interactive comparison */}
      <div className="grid gap-8">
        {variants.map(({ name, Component }) => (
          <div key={name} className="space-y-3">
            <h2 className="text-lg font-semibold">{name}</h2>
            <div className="flex items-center gap-1 p-4 bg-card rounded-xl border">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => {
                const isFilled = selectedValue !== null && value <= selectedValue
                const isHovered = hoveredValue !== null && value <= hoveredValue && !isFilled

                return (
                  <button
                    key={value}
                    onClick={() => setSelectedValue(value === selectedValue ? null : value)}
                    onMouseEnter={() => setHoveredValue(value)}
                    onMouseLeave={() => setHoveredValue(null)}
                    className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Component
                      value={value}
                      filled={isFilled}
                      hovered={isHovered}
                      size="md"
                    />
                  </button>
                )
              })}
              <span className="ml-3 text-sm font-medium tabular-nums text-muted-foreground">
                {selectedValue ?? '–'}/10
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Size comparison */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Size Comparison (Filled)</h2>
        <div className="grid grid-cols-4 gap-6">
          {variants.map(({ name, Component }) => (
            <div key={name} className="space-y-3">
              <p className="text-sm text-muted-foreground">{name}</p>
              <div className="flex items-end gap-2">
                <Component value={8} filled size="sm" />
                <Component value={8} filled size="md" />
                <Component value={8} filled size="lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* States comparison */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">States Comparison</h2>
        <div className="grid grid-cols-4 gap-6">
          {variants.map(({ name, Component }) => (
            <div key={name} className="space-y-3">
              <p className="text-sm text-muted-foreground">{name}</p>
              <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                <div className="text-center">
                  <Component value={7} filled={false} hovered={false} size="md" />
                  <p className="text-xs text-muted-foreground mt-1">Empty</p>
                </div>
                <div className="text-center">
                  <Component value={7} filled={false} hovered={true} size="md" />
                  <p className="text-xs text-muted-foreground mt-1">Hovered</p>
                </div>
                <div className="text-center">
                  <Component value={7} filled={true} hovered={false} size="md" />
                  <p className="text-xs text-muted-foreground mt-1">Filled</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dark background test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">On Dark Background</h2>
        <div className="grid grid-cols-4 gap-6 p-6 bg-slate-900 rounded-xl">
          {variants.map(({ name, Component }) => (
            <div key={name} className="space-y-3">
              <p className="text-sm text-slate-400">{name}</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                  <Component
                    key={value}
                    value={value}
                    filled={value <= 5}
                    hovered={value === 6}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
