'use client'

import { ActivityFeed } from '@/components/feed/ActivityFeed'

interface ProfileActivityTabProps {
  userId: string
}

export function ProfileActivityTab({ userId }: ProfileActivityTabProps) {
  return (
    <ActivityFeed
      userId={userId}
      mode="profile"
      emptyMessage="No activity yet."
    />
  )
}
