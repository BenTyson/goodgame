import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/lib/seo'

// AdSense client ID from environment
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Good Game - Board Game Rules, Score Sheets & Reference',
    template: '%s | Good Game',
  },
  description:
    'Beautiful board game reference tools. Find rules summaries, printable score sheets, setup guides, and quick reference cards for your favorite board games.',
  keywords: [
    'board game rules',
    'board game score sheets',
    'how to play board games',
    'board game reference',
    'printable score sheets',
  ],
  authors: [{ name: 'Good Game' }],
  creator: 'Good Game',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3399'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Good Game',
    title: 'Good Game - Board Game Rules, Score Sheets & Reference',
    description:
      'Beautiful board game reference tools. Find rules summaries, printable score sheets, setup guides, and quick reference cards.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Good Game - Board Game Rules, Score Sheets & Reference',
    description:
      'Beautiful board game reference tools. Find rules summaries, printable score sheets, setup guides, and quick reference cards.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        {/* Google AdSense */}
        {ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
