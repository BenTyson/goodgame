'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ShoppingCart,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Store,
  GripVertical,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import type { Game, Retailer, AffiliateLinkWithRetailer } from '@/types/database'

interface PurchaseLinksTabProps {
  game: Game
}

export function PurchaseLinksTab({ game }: PurchaseLinksTabProps) {
  const [links, setLinks] = useState<AffiliateLinkWithRetailer[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>('')
  const [productId, setProductId] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<AffiliateLinkWithRetailer | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch purchase links and retailers
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [linksRes, retailersRes] = await Promise.all([
        fetch(`/api/admin/purchase-links?gameId=${game.id}`),
        fetch('/api/admin/retailers'),
      ])

      if (!linksRes.ok || !retailersRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [linksData, retailersData] = await Promise.all([
        linksRes.json(),
        retailersRes.json(),
      ])

      setLinks(linksData.links || [])
      setRetailers(retailersData.retailers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase links')
    } finally {
      setLoading(false)
    }
  }, [game.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get preview URL based on selected retailer and product ID
  const getPreviewUrl = useCallback(() => {
    if (customUrl) return customUrl

    if (!selectedRetailerId || !productId) return null

    const retailer = retailers.find(r => r.id === selectedRetailerId)
    if (!retailer?.url_pattern) return null

    return retailer.url_pattern
      .replace('{product_id}', productId)
      .replace('{asin}', productId)
      .replace('{affiliate_tag}', retailer.affiliate_tag || '')
  }, [selectedRetailerId, productId, customUrl, retailers])

  // Add new purchase link
  const handleAddLink = async () => {
    if (!selectedRetailerId && !customUrl) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/purchase-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          retailerId: selectedRetailerId || null,
          productId: productId || null,
          url: customUrl || null,
          label: customLabel || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add link')
      }

      const { link } = await response.json()
      setLinks(prev => [...prev, link])

      // Reset form
      setSelectedRetailerId('')
      setProductId('')
      setCustomUrl('')
      setCustomLabel('')
      setIsAddModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add link')
    } finally {
      setSaving(false)
    }
  }

  // Delete purchase link
  const handleDeleteLink = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const response = await fetch('/api/admin/purchase-links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: deleteTarget.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete link')
      }

      setLinks(prev => prev.filter(l => l.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link')
    } finally {
      setDeleting(false)
    }
  }

  // Check if Amazon link from ASIN exists
  const hasAmazonFromAsin = game.amazon_asin && !links.some(l => l.provider === 'amazon')

  // Get Amazon URL from ASIN
  const amazonUrl = game.amazon_asin
    ? `https://www.amazon.com/dp/${game.amazon_asin}?tag=goodgame-20`
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg uppercase">Purchase Links</CardTitle>
                <CardDescription className="uppercase tracking-wider text-xs">
                  Where to buy this game
                </CardDescription>
              </div>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Purchase Link</DialogTitle>
                  <DialogDescription>
                    Add a link to purchase this game from a retailer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Retailer</Label>
                    <Select
                      value={selectedRetailerId}
                      onValueChange={setSelectedRetailerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a retailer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {retailers.map(retailer => (
                          <SelectItem key={retailer.id} value={retailer.id}>
                            <div className="flex items-center gap-2">
                              {retailer.brand_color && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: retailer.brand_color }}
                                />
                              )}
                              {retailer.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRetailerId && (
                    <div className="space-y-2">
                      <Label>Product ID</Label>
                      <Input
                        placeholder="Enter product ID or ASIN..."
                        value={productId}
                        onChange={e => setProductId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The product identifier for this retailer (e.g., ASIN for Amazon)
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Custom URL (optional)</Label>
                    <Input
                      placeholder="https://..."
                      value={customUrl}
                      onChange={e => setCustomUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Override the generated URL with a custom link
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Custom Label (optional)</Label>
                    <Input
                      placeholder="e.g., 'Deluxe Edition'..."
                      value={customLabel}
                      onChange={e => setCustomLabel(e.target.value)}
                    />
                  </div>

                  {/* URL Preview */}
                  {getPreviewUrl() && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Preview URL:</p>
                      <p className="text-sm break-all font-mono">{getPreviewUrl()}</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddLink}
                    disabled={saving || (!selectedRetailerId && !customUrl)}
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Link
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Amazon from ASIN indicator */}
          {hasAmazonFromAsin && amazonUrl && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#FF9900' }}
                  >
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Amazon</span>
                      <Badge variant="outline" className="text-xs">
                        From ASIN
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {game.amazon_asin}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={amazonUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Auto-generated from ASIN in Details tab. Add as a purchase link to customize.
              </p>
            </div>
          )}

          {/* Links list */}
          {links.length === 0 && !hasAmazonFromAsin ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No purchase links yet</p>
              <p className="text-sm mt-1">Add links to where users can buy this game</p>
            </div>
          ) : (
            <div className="space-y-2">
              {links.map(link => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />

                  {/* Retailer badge */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: link.retailer?.brand_color || '#6B7280',
                    }}
                  >
                    <Store className="h-5 w-5 text-white" />
                  </div>

                  {/* Link info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {link.retailer?.name || link.provider || 'Custom'}
                      </span>
                      {link.label && (
                        <Badge variant="secondary" className="text-xs">
                          {link.label}
                        </Badge>
                      )}
                      {link.is_primary && (
                        <Badge className="text-xs bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    {link.product_id && (
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {link.product_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {link.url}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(link)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the{' '}
              <strong>{deleteTarget?.retailer?.name || deleteTarget?.provider}</strong>{' '}
              purchase link? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
