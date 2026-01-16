import Link from 'next/link'
import { BookOpen, ListChecks, Bookmark } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const contentTools = [
  {
    icon: BookOpen,
    title: 'Rules Summaries',
    description: 'Condensed how-to-play guides that get you gaming fast',
    href: '/rules',
  },
  {
    icon: ListChecks,
    title: 'Setup Guides',
    description: 'Step-by-step setup with component checklists',
    href: '/games',
  },
  {
    icon: Bookmark,
    title: 'Quick Reference',
    description: 'Turn structure, actions, and scoring at a glance',
    href: '/games',
  },
]

export function ContentToolsSection() {
  return (
    <section className="container py-12 md:py-16">
      <div className="mx-auto max-w-2xl text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Tools for Game Night
        </h2>
        <p className="mt-2 text-muted-foreground">
          Everything you need to teach and play
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
        {contentTools.map((tool) => (
          <Link key={tool.title} href={tool.href} className="group">
            <Card className="h-full [box-shadow:var(--shadow-sm)] hover:[box-shadow:var(--shadow-card-hover)] transition-all duration-300 hover:border-primary/30 hover:-translate-y-1">
              <CardHeader className="text-center p-5">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:[box-shadow:var(--shadow-glow-primary)]">
                  <tool.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-3 text-base">{tool.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
