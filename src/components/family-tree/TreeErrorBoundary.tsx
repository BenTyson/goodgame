'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TreeErrorBoundaryProps {
  children: ReactNode
  fallbackMessage?: string
}

interface TreeErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for the family tree diagram.
 * Catches rendering errors and displays a fallback UI instead of crashing.
 */
export class TreeErrorBoundary extends Component<TreeErrorBoundaryProps, TreeErrorBoundaryState> {
  constructor(props: TreeErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): TreeErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('FamilyTreeDiagram error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border rounded-lg bg-muted/30">
          <AlertTriangle className="h-8 w-8 text-amber-500 mb-3" />
          <h3 className="font-medium text-foreground mb-1">
            {this.props.fallbackMessage || 'Unable to render family tree'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error calculating the tree layout.
          </p>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
