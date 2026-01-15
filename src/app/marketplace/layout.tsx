import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Marketplace | Boardmello',
    default: 'Marketplace',
  },
  description: 'Buy, sell, and trade board games with the Boardmello community.',
}

interface MarketplaceLayoutProps {
  children: React.ReactNode
}

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
