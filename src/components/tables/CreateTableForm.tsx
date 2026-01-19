'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  ChevronRight,
  Loader2,
  Dices,
  Globe,
  Lock,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LocationPicker, type LocationData } from '@/components/maps'
import type { Game } from '@/types/database'
import type { CreateTableInput } from '@/types/tables'

interface CreateTableFormProps {
  games: Game[] // User's shelf games for selection
  preselectedGame?: Game // If coming from a game page
}

type Step = 'game' | 'details' | 'review'

export function CreateTableForm({ games, preselectedGame }: CreateTableFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(preselectedGame ? 'details' : 'game')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedGame, setSelectedGame] = useState<Game | null>(preselectedGame || null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState<LocationData | null>(null)
  const [maxPlayers, setMaxPlayers] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState('180')
  const [privacy, setPrivacy] = useState<'public' | 'friends_only' | 'private'>('public')

  // Game search
  const [gameSearch, setGameSearch] = useState('')

  const filteredGames = games.filter((game) => {
    if (!gameSearch) return true
    return game.name.toLowerCase().includes(gameSearch.toLowerCase())
  })

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game)
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!selectedGame || !date || !time) return

    setError(null)
    setSubmitting(true)

    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${date}T${time}`).toISOString()

      const input: CreateTableInput = {
        gameId: selectedGame.id,
        title: title || undefined,
        description: description || undefined,
        scheduledAt,
        durationMinutes: parseInt(durationMinutes, 10) || 180,
        locationName: location?.name || undefined,
        locationAddress: location?.address || undefined,
        locationLat: location?.lat,
        locationLng: location?.lng,
        maxPlayers: maxPlayers ? parseInt(maxPlayers, 10) : undefined,
        privacy,
      }

      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create table')
      }

      const { table } = await response.json()
      router.push(`/tables/${table.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  // Step 1: Select Game
  if (step === 'game') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Select a Game</h2>
          <p className="text-sm text-muted-foreground">
            Choose a game from your shelf to play at this table
          </p>
        </div>

        <div className="relative">
          <Input
            placeholder="Search your games..."
            value={gameSearch}
            onChange={(e) => setGameSearch(e.target.value)}
            className="pl-9"
          />
          <Dices className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {filteredGames.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {games.length === 0 ? (
              <>
                <p>Your shelf is empty.</p>
                <p className="text-sm mt-2">Add games to your shelf to create tables.</p>
              </>
            ) : (
              <p>No games match your search</p>
            )}
          </div>
        ) : (
          <div className="grid gap-2 max-h-[400px] overflow-y-auto">
            {filteredGames.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border border-border/50 text-left',
                  'hover:border-primary/30 hover:bg-accent/50 transition-colors'
                )}
              >
                <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {game.thumbnail_url ? (
                    <Image
                      src={game.thumbnail_url}
                      alt={game.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Dices className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{game.name}</p>
                  {game.player_count_min && game.player_count_max && (
                    <p className="text-xs text-muted-foreground">
                      {game.player_count_min}-{game.player_count_max} players
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Step 2: Event Details
  if (step === 'details') {
    return (
      <div className="space-y-6">
        {/* Selected game preview */}
        {selectedGame && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
            <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
              {selectedGame.thumbnail_url && (
                <Image
                  src={selectedGame.thumbnail_url}
                  alt={selectedGame.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{selectedGame.name}</p>
            </div>
            {!preselectedGame && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('game')}
              >
                Change
              </Button>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* Title (optional) */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Table Name (optional)
            </Label>
            <Input
              id="title"
              placeholder={`${selectedGame?.name || 'Game'} Night`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
                onChange={(e) => setDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
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
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <select
              id="duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              onChange={setLocation}
              placeholder="Search for a venue or address..."
              showMap={true}
            />
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <Label>Who can see this table?</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                  privacy === 'public'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <Globe className="h-5 w-5" />
                <span className="text-xs font-medium">Public</span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('friends_only')}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                  privacy === 'friends_only'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <UserCheck className="h-5 w-5" />
                <span className="text-xs font-medium">Friends</span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                  privacy === 'private'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <Lock className="h-5 w-5" />
                <span className="text-xs font-medium">Private</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {privacy === 'public' && 'Anyone can find and join this table'}
              {privacy === 'friends_only' && 'Only your friends can discover this table'}
              {privacy === 'private' && 'Only invited guests can see this table'}
            </p>
          </div>

          {/* Max players */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Max Players (optional)
            </Label>
            <Input
              id="maxPlayers"
              type="number"
              min="2"
              max="20"
              placeholder={selectedGame?.player_count_max?.toString() || 'No limit'}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              placeholder="Any details for your guests..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          {!preselectedGame && (
            <Button variant="outline" onClick={() => setStep('game')}>
              Back
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => setStep('review')}
            disabled={!date || !time}
          >
            Review
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  // Step 3: Review
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Review Your Table</h2>
        <p className="text-sm text-muted-foreground">
          Check the details before creating your table
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50">
        {/* Game */}
        {selectedGame && (
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {selectedGame.thumbnail_url && (
                <Image
                  src={selectedGame.thumbnail_url}
                  alt={selectedGame.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">{title || selectedGame.name}</p>
              {title && <p className="text-sm text-muted-foreground">{selectedGame.name}</p>}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="grid gap-3 text-sm pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(`${date}T${time}`), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(`${date}T${time}`), 'h:mm a')} ({parseInt(durationMinutes, 10) / 60} hours)</span>
          </div>
          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{location.name}</span>
            </div>
          )}
          {maxPlayers && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Max {maxPlayers} players</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {privacy === 'public' && <Globe className="h-4 w-4 text-muted-foreground" />}
            {privacy === 'friends_only' && <UserCheck className="h-4 w-4 text-muted-foreground" />}
            {privacy === 'private' && <Lock className="h-4 w-4 text-muted-foreground" />}
            <span>
              {privacy === 'public' && 'Public table'}
              {privacy === 'friends_only' && 'Friends only'}
              {privacy === 'private' && 'Private (invite only)'}
            </span>
          </div>
        </div>

        {description && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('details')}>
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Table'
          )}
        </Button>
      </div>
    </div>
  )
}
