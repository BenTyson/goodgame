'use client'

import { useId } from 'react'
import type { TreeConnectorProps } from './types'
import { RELATION_STYLES } from './types'

/**
 * SVG connector line between tree nodes
 * Features gradient lines, glow layer, and highlight for depth
 */
export function TreeConnector({
  fromX,
  fromY,
  toX,
  toY,
  lineStyle,
  relationType,
}: TreeConnectorProps) {
  const gradientId = useId()

  // Get color from relation style
  const style = relationType ? RELATION_STYLES[relationType] : RELATION_STYLES.expansion_of
  const color = style.lineColor

  // Calculate control points for bezier curve
  const isVertical = Math.abs(toY - fromY) > Math.abs(toX - fromX)

  let path: string
  if (isVertical) {
    // Vertical connector with smooth curve
    const midY = fromY + (toY - fromY) * 0.5
    path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`
  } else {
    // Horizontal connector (for variants at same tier)
    const midX = fromX + (toX - fromX) * 0.5
    path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`
  }

  // Determine dash array based on line style
  let dashArray: string | undefined
  if (lineStyle === 'dashed') {
    dashArray = '8,4'
  } else if (lineStyle === 'dotted') {
    dashArray = '2,4'
  }

  return (
    <g>
      {/* Gradient definition - full opacity center, faded ends */}
      <defs>
        <linearGradient
          id={gradientId}
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="30%" stopColor={color} stopOpacity={1} />
          <stop offset="70%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.4} />
        </linearGradient>
      </defs>

      {/* Glow layer - soft background glow */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeOpacity={0.15}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        filter="blur(2px)"
        className="transition-all duration-300"
      />

      {/* Main line with gradient */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2.5}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        className="transition-all duration-300"
      />

      {/* Highlight layer - thin white overlay for depth */}
      <path
        d={path}
        fill="none"
        stroke="white"
        strokeWidth={1}
        strokeOpacity={0.15}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    </g>
  )
}

/**
 * Container for all connector lines
 * Positioned absolutely over the tree content
 */
export function TreeConnectorsOverlay({
  children,
  width,
  height,
}: {
  children: React.ReactNode
  width: number
  height: number
}) {
  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      width={width}
      height={height}
      style={{ zIndex: 0 }}
    >
      {children}
    </svg>
  )
}
