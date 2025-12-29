import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { LayoutDashboard, Gamepad2, ListTodo, ArrowLeft, Dice5, Users2, Building2, Tags } from 'lucide-react'
import { LogoutButton } from '@/components/admin/LogoutButton'
import type { Database } from '@/types/supabase'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Games', href: '/admin/games', icon: Gamepad2, exact: false },
  { name: 'Taxonomy', href: '/admin/taxonomy', icon: Tags, exact: false },
  { name: 'Families', href: '/admin/families', icon: Users2, exact: false },
  { name: 'Publishers', href: '/admin/publishers', icon: Building2, exact: false },
  { name: 'Queue', href: '/admin/queue', icon: ListTodo, exact: false },
]

async function getUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/admin'

  // Check if user is authenticated and is an admin
  if (!user || !isAdmin(user.email)) {
    redirect('/admin/login')
  }

  const isActive = (item: typeof adminNav[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to site</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Dice5 className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
              <span className="font-semibold text-sm md:text-base">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {user.email}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-14 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      </nav>

      <div className="container py-4 md:py-6">
        <div className="flex gap-8">
          {/* Sidebar - Desktop only */}
          <aside className="hidden md:block w-52 shrink-0">
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
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
