'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Global error boundary - catches errors in root layout
// Must include its own html/body tags since layout may have errored
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {/* Simple error display without any dependencies */}
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            ⚠️
          </div>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: '#111'
          }}>
            Something Went Wrong
          </h1>

          <p style={{
            color: '#666',
            marginBottom: '1.5rem',
            maxWidth: '400px'
          }}>
            We&apos;re having trouble loading the page. Please try again.
          </p>

          <button
            onClick={reset}
            style={{
              backgroundColor: '#0d9488',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Try Again
          </button>

          <a
            href="/"
            style={{
              display: 'inline-block',
              backgroundColor: 'transparent',
              color: '#0d9488',
              border: '1px solid #0d9488',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            Go Home
          </a>
        </div>
      </body>
    </html>
  )
}
