import Link from 'next/link'
import { UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProfileNotFound() {
  return (
    <div className="container py-20">
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <UserX className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This user doesn't exist or their profile is private.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild>
            <Link href="/games">Browse Games</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
