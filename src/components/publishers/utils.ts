// Words to filter out when generating initials
const FILTER_WORDS = ['Games', 'Gaming', 'Publishing', 'Publications', 'Entertainment', 'Inc', 'LLC', 'Ltd', 'Co', 'Company', 'Edition', 'Editions']

/**
 * Generate initials from publisher name
 * "Fantasy Flight Games" -> "FF"
 * "Z-Man Games" -> "ZM"
 */
export function getInitials(name: string): string {
  const words = name
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .filter(word => !FILTER_WORDS.includes(word))

  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return name.charAt(0).toUpperCase()
}

/**
 * Generate consistent color based on publisher name
 * Uses a hash of the name to pick from a muted, professional color palette
 */
export function getInitialsColor(name: string): string {
  const colors = [
    'bg-slate-600',
    'bg-zinc-600',
    'bg-stone-600',
    'bg-neutral-600',
    'bg-gray-600',
  ]

  // Simple hash function
  const hash = name.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)

  return colors[Math.abs(hash) % colors.length]
}
