'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dices, Menu, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SearchDialog } from '@/components/search'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from '@/components/auth/UserMenu'
import { NotificationBell } from '@/components/notifications'

const navigation = [
  { name: 'Games', href: '/games' },
  { name: 'Publishers', href: '/publishers' },
  { name: 'Awards', href: '/awards' },
  { name: 'Categories', href: '/categories' },
  { name: 'Feed', href: '/feed' },
  { name: 'Shelf', href: '/shelf' },
  { name: 'Marketplace', href: '/marketplace' },
  { name: 'Recommend', href: '/recommend', featured: true },
]

export function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)

  // Cmd+K keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Don't render the main header on admin pages (admin has its own header)
  // Must be after all hooks to follow Rules of Hooks
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Subtle bottom gradient line for definition */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container flex h-16 items-center justify-between">
        {/* Logo with hover effect */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
            <Dices className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Boardmello
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const isFeatured = 'featured' in item && item.featured

            if (isFeatured) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'ml-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'shadow-sm hover:shadow-md'
                  )}
                >
                  {item.name}
                </Link>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative px-3.5 py-2 text-sm font-medium rounded-md transition-all duration-200',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {item.name}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-[9px] h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline-flex">Search</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Search Dialog */}
          <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <UserMenu />

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const isFeatured = 'featured' in item && item.featured

                  if (isFeatured) {
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="mt-4 px-4 py-3 text-base font-medium rounded-lg text-center bg-primary text-primary-foreground"
                      >
                        {item.name}
                      </a>
                    )
                  }

                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'px-4 py-3 text-base font-medium rounded-lg transition-all duration-200',
                        isActive
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                    >
                      {item.name}
                    </a>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
