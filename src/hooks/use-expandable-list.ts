import { useState, useMemo } from 'react'

/**
 * Hook for managing expandable list state
 * Extracts common pattern from TaxonomySection, CreditsSection, etc.
 */
export function useExpandableList<T>(items: T[], limit: number) {
  const [expanded, setExpanded] = useState(false)

  const displayItems = useMemo(
    () => (expanded ? items : items.slice(0, limit)),
    [items, limit, expanded]
  )

  const hasMore = items.length > limit
  const remaining = items.length - limit

  const toggle = () => setExpanded((prev) => !prev)
  const expand = () => setExpanded(true)
  const collapse = () => setExpanded(false)

  return {
    displayItems,
    hasMore,
    remaining,
    expanded,
    toggle,
    expand,
    collapse,
  }
}
