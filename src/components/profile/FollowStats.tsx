'use client'

import Link from 'next/link'

interface FollowStatsProps {
  username: string
  followerCount: number
  followingCount: number
  className?: string
}

export function FollowStats({
  username,
  followerCount,
  followingCount,
  className = '',
}: FollowStatsProps) {
  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <Link
        href={`/u/${username}/followers`}
        className="hover:underline"
      >
        <span className="font-semibold">{followerCount.toLocaleString()}</span>{' '}
        <span className="text-muted-foreground">
          {followerCount === 1 ? 'Follower' : 'Followers'}
        </span>
      </Link>
      <Link
        href={`/u/${username}/following`}
        className="hover:underline"
      >
        <span className="font-semibold">{followingCount.toLocaleString()}</span>{' '}
        <span className="text-muted-foreground">Following</span>
      </Link>
    </div>
  )
}
