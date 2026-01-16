import Link from 'next/link'
import { ArrowRight, Library, Heart, Gamepad } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ShelfCTASectionProps {
  userCount?: number
}

export function ShelfCTASection({ userCount }: ShelfCTASectionProps) {
  const shelfCategories = [
    { icon: Library, label: 'Owned', color: 'text-emerald-600 bg-emerald-50' },
    { icon: Gamepad, label: 'Played', color: 'text-blue-600 bg-blue-50' },
    { icon: Heart, label: 'Wishlist', color: 'text-rose-600 bg-rose-50' },
  ]

  return (
    <section className="container py-16 md:py-24">
      <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20 overflow-hidden">
        <CardContent className="py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Text content */}
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Build Your Shelf
              </h2>
              <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto md:mx-0">
                Track the games you own, the ones you have played, and everything on your wishlist.
              </p>
              {userCount && userCount > 0 && (
                <p className="text-sm text-muted-foreground mb-6">
                  Join {userCount.toLocaleString()} collectors already tracking their games
                </p>
              )}
              <Button size="lg" className="group" asChild>
                <Link href="/shelf">
                  Start Your Shelf
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Right: Visual preview */}
            <div className="flex justify-center md:justify-end">
              <div className="flex gap-4">
                {shelfCategories.map((cat) => (
                  <div
                    key={cat.label}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/80 border shadow-sm"
                  >
                    <div className={`p-3 rounded-lg ${cat.color}`}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
