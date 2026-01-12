'use client'

import type { TreeConnectorProps } from './types'
import { RELATION_STYLES } from './types'

/**
 * SVG connector line between tree nodes
 * Draws a curved path from parent to child
 */
export function TreeConnector({
  fromX,
  fromY,
  toX,
  toY,
  lineStyle,
  relationType,
}: TreeConnectorProps) {
  // Get color from relation style
  const style = relationType ? RELATION_STYLES[relationType] : RELATION_STYLES.expansion_of
  const color = style.lineColor

  // Calculate control points for bezier curve
  // For vertical connections (expansions): curve down then horizontal
  // For horizontal connections (variants): straight line
  const isVertical = Math.abs(toY - fromY) > Math.abs(toX - fromX)

  let path: string
  if (isVertical) {
    // Vertical connector with smooth curve
    const midY = fromY + (toY - fromY) * 0.5
    path = `
      M ${fromX} ${fromY}
      C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}
    `
  } else {
    // Horizontal connector (for variants at same tier)
    const midX = fromX + (toX - fromX) * 0.5
    path = `
      M ${fromX} ${fromY}
      C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}
    `
  }

  // Determine dash array based on line style
  let dashArray: string | undefined
  if (lineStyle === 'dashed') {
    dashArray = '8,4'
  } else if (lineStyle === 'dotted') {
    dashArray = '2,4'
  }

  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray={dashArray}
      strokeLinecap="round"
      className="transition-all duration-300"
    />
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
