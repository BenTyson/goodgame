'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ConditionBadge, ListingImageUpload } from '@/components/marketplace'
import type {
  ListingWithDetails,
  ListingImage,
  GameCondition,
  ShippingPreference,
} from '@/types/marketplace'
import { CONDITION_INFO } from '@/types/marketplace'

interface EditListingPageProps {
  params: Promise<{ id: string }>
}

export default function EditListingPage({ params }: EditListingPageProps) {
  const router = useRouter()
  const [listingId, setListingId] = React.useState<string | null>(null)
  const [listing, setListing] = React.useState<ListingWithDetails | null>(null)
  const [images, setImages] = React.useState<ListingImage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // Form state
  const [description, setDescription] = React.useState('')
  const [condition, setCondition] = React.useState<GameCondition | null>(null)
  const [priceDollars, setPriceDollars] = React.useState('')
  const [shippingCostDollars, setShippingCostDollars] = React.useState('')
  const [shippingPreference, setShippingPreference] = React.useState<ShippingPreference>('will_ship')
  const [locationCity, setLocationCity] = React.useState('')
  const [locationState, setLocationState] = React.useState('')

  // Load listing data
  React.useEffect(() => {
    async function loadListing() {
      const { id } = await params
      setListingId(id)

      try {
        const response = await fetch(`/api/marketplace/listings/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/marketplace')
            return
          }
          throw new Error('Failed to load listing')
        }

        const { listing: data } = await response.json()
        setListing(data)
        setImages(data.images || [])
        setDescription(data.description || '')
        setCondition(data.condition)
        setPriceDollars(data.price_cents ? (data.price_cents / 100).toFixed(2) : '')
        setShippingCostDollars(data.shipping_cost_cents ? (data.shipping_cost_cents / 100).toFixed(2) : '')
        setShippingPreference(data.shipping_preference)
        setLocationCity(data.location_city || '')
        setLocationState(data.location_state || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    loadListing()
  }, [params, router])

  const handleSave = async () => {
    if (!listingId) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const priceCents = priceDollars ? Math.round(parseFloat(priceDollars) * 100) : null
      const shippingCostCents = shippingCostDollars ? Math.round(parseFloat(shippingCostDollars) * 100) : null

      const updates = {
        description: description || null,
        condition,
        price_cents: listing?.listing_type === 'sell' ? priceCents : null,
        shipping_cost_cents: shippingPreference !== 'local_only' ? shippingCostCents : null,
        shipping_preference: shippingPreference,
        location_city: locationCity,
        location_state: locationState,
      }

      const response = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setSuccess('Changes saved successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!listingId) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete listing')
      }

      router.push('/marketplace/my-listings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Listing not found</p>
            <Button asChild className="mt-4">
              <Link href="/marketplace">Back to Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button variant="ghost" asChild className="-ml-3 mb-2">
            <Link href={`/marketplace/listings/${listingId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listing
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Listing</h1>
          <p className="text-muted-foreground">{listing.game.name}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The listing will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Listing
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos">Photos ({images.length})</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
              <CardDescription>Update your listing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Condition */}
              {listing.listing_type !== 'want' && (
                <div className="space-y-3">
                  <Label>Condition</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(CONDITION_INFO) as GameCondition[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCondition(c)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          condition === c
                            ? 'border-primary bg-primary/5'
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <ConditionBadge condition={c} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {CONDITION_INFO[c].description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the condition, any wear, missing components, etc."
                  rows={4}
                />
              </div>

              {/* Price (for sell listings) */}
              {listing.listing_type === 'sell' && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    step="0.01"
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Shipping */}
              <div className="space-y-3">
                <Label>Shipping Preference</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'will_ship', label: 'Pickup or Ship' },
                    { value: 'local_only', label: 'Local Only' },
                    { value: 'ship_only', label: 'Ship Only' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setShippingPreference(option.value as ShippingPreference)}
                      className={`p-3 rounded-lg border text-sm transition-colors ${
                        shippingPreference === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shipping Cost */}
              {shippingPreference !== 'local_only' && (
                <div className="space-y-2">
                  <Label htmlFor="shippingCost">Shipping Cost ($)</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCostDollars}
                    onChange={(e) => setShippingCostDollars(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={locationState}
                    onChange={(e) => setLocationState(e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Add or remove photos of your game. The first image will be shown on listing cards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listingId && (
                <ListingImageUpload
                  listingId={listingId}
                  images={images}
                  onImagesChange={setImages}
                  maxImages={6}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
