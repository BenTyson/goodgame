'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  Loader2,
  Dices,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LocationPicker, type LocationData } from '@/components/maps'
import type { TableWithDetails, UpdateTableInput } from '@/types/tables'

interface EditTableFormProps {
  table: TableWithDetails
}

export function EditTableForm({ table }: EditTableFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Parse initial values from table
  const initialDate = format(new Date(table.scheduledAt), 'yyyy-MM-dd')
  const initialTime = format(new Date(table.scheduledAt), 'HH:mm')

  // Initialize location from table data
  const initialLocation: LocationData | null = table.locationLat && table.locationLng
    ? {
        name: table.locationName || 'Selected Location',
        address: table.locationAddress || '',
        lat: table.locationLat,
        lng: table.locationLng,
      }
    : table.locationName
    ? {
        name: table.locationName,
        address: table.locationAddress || '',
        lat: 0,
        lng: 0,
      }
    : null

  // Form state
  const [title, setTitle] = useState(table.title || '')
  const [description, setDescription] = useState(table.description || '')
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const [location, setLocation] = useState<LocationData | null>(initialLocation)
  const [maxPlayers, setMaxPlayers] = useState(table.maxPlayers?.toString() || '')
  const [durationMinutes, setDurationMinutes] = useState(table.durationMinutes.toString())

  const handleChange = () => {
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !time) return

    setError(null)
    setSaving(true)

    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString()

      const input: UpdateTableInput = {
        title: title || undefined,
        description: description || undefined,
        scheduledAt,
        durationMinutes: parseInt(durationMinutes, 10) || 180,
        locationName: location?.name || undefined,
        locationAddress: location?.address || undefined,
        locationLat: location?.lat,
        locationLng: location?.lng,
        maxPlayers: maxPlayers ? parseInt(maxPlayers, 10) : undefined,
      }

      const response = await fetch(`/api/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update table')
      }

      router.push(`/tables/${table.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link href={`/tables/${table.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Table</h1>
            <p className="text-sm text-muted-foreground">
              Update your game night details
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Game (read-only) */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {table.game.thumbnailUrl ? (
              <Image
                src={table.game.thumbnailUrl}
                alt={table.game.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Dices className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{table.game.name}</p>
            {table.game.playerCountMin && table.game.playerCountMax && (
              <p className="text-sm text-muted-foreground">
                {table.game.playerCountMin}-{table.game.playerCountMax} players
              </p>
            )}
          </div>
          <Link
            href={`/games/${table.game.slug}`}
            className="text-sm text-primary hover:underline"
          >
            View Game
          </Link>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Table Name
          </Label>
          <Input
            id="title"
            placeholder={`${table.game.name} Night`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              handleChange()
            }}
            className="transition-shadow focus:shadow-md"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use the game name
          </p>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                handleChange()
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
              className="transition-shadow focus:shadow-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Time
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value)
                handleChange()
              }}
              required
              className="transition-shadow focus:shadow-md"
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <select
            id="duration"
            value={durationMinutes}
            onChange={(e) => {
              setDurationMinutes(e.target.value)
              handleChange()
            }}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
              'ring-offset-background transition-shadow',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:shadow-md'
            )}
          >
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
            <option value="240">4 hours</option>
            <option value="300">5 hours</option>
            <option value="360">6 hours</option>
          </select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Location
          </Label>
          <LocationPicker
            value={location}
            onChange={(loc) => {
              setLocation(loc)
              handleChange()
            }}
            placeholder="Search for a venue or address..."
            showMap={true}
          />
        </div>

        {/* Max players */}
        <div className="space-y-2">
          <Label htmlFor="maxPlayers" className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Max Players
          </Label>
          <Input
            id="maxPlayers"
            type="number"
            min="2"
            max="20"
            placeholder="No limit"
            value={maxPlayers}
            onChange={(e) => {
              setMaxPlayers(e.target.value)
              handleChange()
            }}
            className="transition-shadow focus:shadow-md"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank for no player limit
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Notes for Guests</Label>
          <Textarea
            id="description"
            placeholder="Any details your guests should know..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              handleChange()
            }}
            rows={4}
            className="transition-shadow focus:shadow-md resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-border/50">
        <Button variant="ghost" asChild>
          <Link href={`/tables/${table.id}`}>Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={saving || !hasChanges}
          className="min-w-[120px]"
        >
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
    </form>
  )
}
