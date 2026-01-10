import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for managing media modal/lightbox state with keyboard navigation
 * Extracts common pattern from ImageGallery and VideoCarousel
 */
export function useMediaModal(itemCount: number) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const isOpen = selectedIndex !== null

  const goToPrevious = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === 0 ? itemCount - 1 : selectedIndex - 1)
  }, [selectedIndex, itemCount])

  const goToNext = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === itemCount - 1 ? 0 : selectedIndex + 1)
  }, [selectedIndex, itemCount])

  const close = useCallback(() => {
    setSelectedIndex(null)
  }, [])

  const open = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  // Keyboard navigation and body overflow management
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close, goToPrevious, goToNext])

  return {
    selectedIndex,
    isOpen,
    open,
    close,
    goToPrevious,
    goToNext,
    setSelectedIndex,
  }
}
