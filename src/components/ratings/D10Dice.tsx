'use client'

import { cn } from '@/lib/utils'

interface D10DiceProps {
  value: number // 1-10
  filled?: boolean
  hovered?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { dimension: 22, fontSize: 10 },
  md: { dimension: 30, fontSize: 13 },
  lg: { dimension: 38, fontSize: 16 },
}

export function D10Dice({
  value,
  filled = false,
  hovered = false,
  size = 'md',
  className,
}: D10DiceProps) {
  const { dimension, fontSize } = sizes[size]
  const radius = dimension / 2 - 1
  const center = dimension / 2

  // Unique ID for gradients (needed when multiple instances on page)
  const gradientId = `sphere-gradient-${value}-${filled ? 'f' : hovered ? 'h' : 'e'}`
  const highlightId = `sphere-highlight-${value}-${filled ? 'f' : hovered ? 'h' : 'e'}`

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox={`0 0 ${dimension} ${dimension}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'transition-all duration-200',
        filled && 'dice-fill',
        className
      )}
      aria-hidden="true"
    >
      <defs>
        {/* Sphere gradient - 3D ball effect */}
        <radialGradient
          id={gradientId}
          cx="35%"
          cy="30%"
          r="60%"
          fx="30%"
          fy="25%"
        >
          {filled ? (
            <>
              <stop offset="0%" stopColor="oklch(0.60 0.16 195)" />
              <stop offset="50%" stopColor="oklch(0.45 0.16 195)" />
              <stop offset="100%" stopColor="oklch(0.30 0.14 195)" />
            </>
          ) : hovered ? (
            <>
              <stop offset="0%" stopColor="oklch(0.70 0.10 195 / 0.4)" />
              <stop offset="50%" stopColor="oklch(0.55 0.12 195 / 0.3)" />
              <stop offset="100%" stopColor="oklch(0.40 0.10 195 / 0.2)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="oklch(0.55 0.02 60)" />
              <stop offset="50%" stopColor="oklch(0.40 0.02 60)" />
              <stop offset="100%" stopColor="oklch(0.28 0.02 60)" />
            </>
          )}
        </radialGradient>

        {/* Specular highlight */}
        <radialGradient
          id={highlightId}
          cx="35%"
          cy="25%"
          r="30%"
        >
          <stop offset="0%" stopColor="white" stopOpacity={filled ? 0.3 : hovered ? 0.3 : 0.25} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Main sphere */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={`url(#${gradientId})`}
        className={cn(
          'transition-all duration-200',
          !filled && !hovered && 'stroke-muted-foreground/30'
        )}
        strokeWidth={!filled && !hovered ? 1.5 : 0}
      />

      {/* Specular highlight overlay */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={`url(#${highlightId})`}
      />

      {/* Number */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill={filled ? '#FFFFFF' : hovered ? '#2dd4bf' : '#a1a1aa'}
        fontSize={fontSize}
        fontWeight={700}
        fontFamily="var(--font-sans), system-ui, sans-serif"
        className="select-none"
        style={{
          filter: filled ? 'drop-shadow(0 0 4px rgba(255,255,255,0.9))' : 'none',
        }}
      >
        {value}
      </text>
    </svg>
  )
}
