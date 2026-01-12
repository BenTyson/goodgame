'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useTreeLayout } from './use-tree-layout'
import { TreeNode } from './TreeNode'
import { TreeConnector, TreeConnectorsOverlay } from './TreeConnector'
import { TreeLegend } from './TreeLegend'
import type { FamilyTreeDiagramProps, TreeLayoutNode } from './types'
import { NODE_WIDTH, NODE_GAP, TIER_GAP } from './types'

interface NodePosition {
  id: string
  centerX: number
  topY: number
  bottomY: number
}

export function FamilyTreeDiagram({
  games,
  relations,
  baseGameId,
  familyId,
  variant = 'admin',
  className,
  onNodeClick,
  selectedGameId,
}: FamilyTreeDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map())
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const { tiers, baseGame, orphanGames } = useTreeLayout({
    games,
    relations,
    baseGameId,
  })

  // Calculate node positions after render
  const calculatePositions = useCallback(() => {
    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const positions = new Map<string, NodePosition>()

    nodeRefs.current.forEach((element, gameId) => {
      const rect = element.getBoundingClientRect()
      positions.set(gameId, {
        id: gameId,
        centerX: rect.left - containerRect.left + rect.width / 2,
        topY: rect.top - containerRect.top,
        bottomY: rect.top - containerRect.top + rect.height,
      })
    })

    setNodePositions(positions)
    setContainerSize({
      width: containerRect.width,
      height: containerRect.height,
    })
  }, [])

  // Recalculate on mount and when tree changes
  useEffect(() => {
    // Small delay to ensure DOM is rendered
    const timer = setTimeout(calculatePositions, 50)
    return () => clearTimeout(timer)
  }, [tiers, calculatePositions])

  // Recalculate on resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      calculatePositions()
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [calculatePositions])

  // Store ref for a node
  const setNodeRef = useCallback((gameId: string, element: HTMLDivElement | null) => {
    if (element) {
      nodeRefs.current.set(gameId, element)
    } else {
      nodeRefs.current.delete(gameId)
    }
  }, [])

  // Render connectors between nodes
  const renderConnectors = () => {
    const connectors: React.ReactNode[] = []

    for (const tier of tiers) {
      for (const node of tier.nodes) {
        if (!node.parentId) continue

        const parentPos = nodePositions.get(node.parentId)
        const childPos = nodePositions.get(node.game.id)

        if (!parentPos || !childPos) continue

        connectors.push(
          <TreeConnector
            key={`${node.parentId}-${node.game.id}`}
            fromX={parentPos.centerX}
            fromY={parentPos.bottomY}
            toX={childPos.centerX}
            toY={childPos.topY}
            lineStyle={node.lineStyle}
            relationType={node.relationType}
          />
        )
      }
    }

    return connectors
  }

  if (!baseGame || tiers.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p>No games to display in tree.</p>
        {orphanGames.length > 0 && (
          <p className="text-sm mt-2">
            {orphanGames.length} game{orphanGames.length !== 1 ? 's' : ''} without relationships.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tree Container */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto pb-4"
      >
        {/* SVG Connectors Layer */}
        {containerSize.width > 0 && (
          <TreeConnectorsOverlay width={containerSize.width} height={containerSize.height}>
            {renderConnectors()}
          </TreeConnectorsOverlay>
        )}

        {/* Tiers */}
        <div className="relative z-10 flex flex-col items-center" style={{ gap: TIER_GAP }}>
          {tiers.map((tierData) => (
            <TierRow
              key={tierData.tier}
              tier={tierData.tier}
              nodes={tierData.nodes}
              baseGameId={baseGame.id}
              variant={variant}
              onNodeClick={onNodeClick}
              selectedGameId={selectedGameId}
              setNodeRef={setNodeRef}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <TreeLegend />

      {/* Orphan Games */}
      {orphanGames.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            {orphanGames.length} game{orphanGames.length !== 1 ? 's' : ''} not connected in tree:
          </p>
          <div className="flex flex-wrap gap-2">
            {orphanGames.map((game) => (
              <span
                key={game.id}
                className="text-sm px-2 py-1 bg-muted rounded"
              >
                {game.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * A single row/tier in the tree
 */
function TierRow({
  tier,
  nodes,
  baseGameId,
  variant,
  onNodeClick,
  selectedGameId,
  setNodeRef,
}: {
  tier: number
  nodes: TreeLayoutNode[]
  baseGameId: string
  variant: 'admin' | 'public'
  onNodeClick?: (game: import('@/types/database').Game) => void
  selectedGameId?: string
  setNodeRef: (gameId: string, element: HTMLDivElement | null) => void
}) {
  // Group nodes by their parent for proper subtree alignment
  // For now, simple flex row with gap
  return (
    <div
      className="flex items-start justify-center"
      style={{ gap: NODE_GAP }}
    >
      {nodes.map((node) => (
        <TreeNode
          key={node.game.id}
          ref={(el) => setNodeRef(node.game.id, el)}
          node={node}
          isBase={node.game.id === baseGameId}
          variant={variant}
          onClick={onNodeClick}
          isSelected={selectedGameId === node.game.id}
        />
      ))}
    </div>
  )
}
