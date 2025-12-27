'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dices } from 'lucide-react'

const footerLinks = {
  games: [
    { name: 'All Games', href: '/games' },
    { name: 'Publishers', href: '/publishers' },
    { name: 'Awards', href: '/awards' },
  ],
  categories: [
    { name: 'Strategy', href: '/categories/strategy' },
    { name: 'Family', href: '/categories/family' },
    { name: 'Party', href: '/categories/party' },
    { name: 'Cooperative', href: '/categories/cooperative' },
  ],
  collections: [
    { name: 'Gateway Games', href: '/collections/gateway-games' },
    { name: 'Quick Games', href: '/collections/under-30-minutes' },
    { name: 'Best at Two', href: '/collections/best-at-2-players' },
  ],
  about: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
}

export function Footer() {
  const pathname = usePathname()

  // Don't render the footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="relative border-t bg-gradient-to-b from-muted/40 to-muted/60">
      {/* Subtle top gradient line for definition */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand - enhanced presence */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                <Dices className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Board Nomads
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Beautiful board game reference tools. Rules, score sheets, and quick reference cards.
            </p>
          </div>

          {/* Games */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
              Games
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.games.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-0.5 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
              Categories
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-0.5 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
              Collections
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.collections.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-0.5 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
              About
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-0.5 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section - more definition */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Board Nomads. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Board game names and images are property of their respective publishers.
            </p>
          </div>
        </div>
      </div>

      {/* Warm glow at bottom for cozy feel */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/5 blur-3xl pointer-events-none" />
    </footer>
  )
}
