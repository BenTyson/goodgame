import { Suspense } from 'react'
import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { LoginContent } from './LoginContent'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Boardmello to track your game collection',
}

function LoginLoading() {
  return (
    <div className="container max-w-md mx-auto py-16">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  )
}
