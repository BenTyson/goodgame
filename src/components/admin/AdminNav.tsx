'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Gamepad2, ListTodo, Users2, Building2, Tags, Globe } from 'lucide-react'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Games', href: '/admin/games', icon: Gamepad2, exact: false },
  { name: 'Taxonomy', href: '/admin/taxonomy', icon: Tags, exact: false },
  { name: 'Families', href: '/admin/families', icon: Users2, exact: false },
  { name: 'Publishers', href: '/admin/publishers', icon: Building2, exact: false },
  { name: 'Queue', href: '/admin/queue', icon: ListTodo, exact: false },
  { name: 'Wikidata', href: '/admin/wikidata', icon: Globe, exact: false },
]

export function AdminNav({ variant }: { variant: 'mobile' | 'desktop' }) {
  const pathname = usePathname()

  const isActive = (item: typeof adminNav[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  if (variant === 'mobile') {
    return (
      <div className="container flex gap-1 py-2 overflow-x-auto">
        {adminNav.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? '' : 'opacity-70'}`} />
              {item.name}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <nav className="sticky top-24 flex flex-col gap-1">
      {adminNav.map((item) => {
        const active = isActive(item)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <item.icon className={`h-4 w-4 ${active ? '' : 'opacity-70'}`} />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
