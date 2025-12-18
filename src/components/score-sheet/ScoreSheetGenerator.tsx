'use client'

import * as React from 'react'
import { Download, Printer, Plus, Minus, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Game } from '@/types/database'

interface ScoreField {
  name: string
  label: string
  type: 'number' | 'checkbox' | 'text'
}

interface ScoreSheetGeneratorProps {
  game: Game
  fields?: ScoreField[]
  minPlayers?: number
  maxPlayers?: number
}

// Default fields based on game
const defaultFieldsByGame: Record<string, ScoreField[]> = {
  catan: [
    { name: 'settlements', label: 'Settlements (1 pt each)', type: 'number' },
    { name: 'cities', label: 'Cities (2 pts each)', type: 'number' },
    { name: 'longest_road', label: 'Longest Road (2 pts)', type: 'number' },
    { name: 'largest_army', label: 'Largest Army (2 pts)', type: 'number' },
    { name: 'victory_cards', label: 'Victory Point Cards', type: 'number' },
  ],
  wingspan: [
    { name: 'birds', label: 'Bird Points', type: 'number' },
    { name: 'bonus_cards', label: 'Bonus Cards', type: 'number' },
    { name: 'end_of_round', label: 'End-of-Round Goals', type: 'number' },
    { name: 'eggs', label: 'Eggs', type: 'number' },
    { name: 'food_on_cards', label: 'Cached Food', type: 'number' },
    { name: 'tucked_cards', label: 'Tucked Cards', type: 'number' },
  ],
  'terraforming-mars': [
    { name: 'tr', label: 'Terraform Rating', type: 'number' },
    { name: 'awards', label: 'Awards', type: 'number' },
    { name: 'milestones', label: 'Milestones', type: 'number' },
    { name: 'greeneries', label: 'Greenery Tiles', type: 'number' },
    { name: 'cities', label: 'City Tiles', type: 'number' },
    { name: 'cards', label: 'Card Points', type: 'number' },
  ],
  'ticket-to-ride': [
    { name: 'routes', label: 'Route Points', type: 'number' },
    { name: 'tickets_completed', label: 'Completed Tickets', type: 'number' },
    { name: 'tickets_incomplete', label: 'Incomplete Tickets (-)', type: 'number' },
    { name: 'longest_route', label: 'Longest Route (10 pts)', type: 'number' },
  ],
  azul: [
    { name: 'rows', label: 'Completed Rows', type: 'number' },
    { name: 'columns', label: 'Completed Columns', type: 'number' },
    { name: 'colors', label: 'Completed Colors', type: 'number' },
    { name: 'tile_points', label: 'Tile Placement Points', type: 'number' },
    { name: 'penalties', label: 'Floor Penalties (-)', type: 'number' },
  ],
  '7-wonders': [
    { name: 'military', label: 'Military', type: 'number' },
    { name: 'treasury', label: 'Treasury (coins)', type: 'number' },
    { name: 'wonders', label: 'Wonders', type: 'number' },
    { name: 'civic', label: 'Civic Structures', type: 'number' },
    { name: 'commercial', label: 'Commercial', type: 'number' },
    { name: 'guilds', label: 'Guilds', type: 'number' },
    { name: 'science', label: 'Science', type: 'number' },
  ],
  splendor: [
    { name: 'cards', label: 'Card Points', type: 'number' },
    { name: 'nobles', label: 'Noble Points', type: 'number' },
  ],
  carcassonne: [
    { name: 'roads', label: 'Roads', type: 'number' },
    { name: 'cities', label: 'Cities', type: 'number' },
    { name: 'cloisters', label: 'Cloisters', type: 'number' },
    { name: 'fields', label: 'Fields', type: 'number' },
  ],
}

const defaultFields: ScoreField[] = [
  { name: 'score_1', label: 'Category 1', type: 'number' },
  { name: 'score_2', label: 'Category 2', type: 'number' },
  { name: 'score_3', label: 'Category 3', type: 'number' },
  { name: 'bonus', label: 'Bonus Points', type: 'number' },
]

export function ScoreSheetGenerator({
  game,
  fields,
  minPlayers = 2,
  maxPlayers = 6,
}: ScoreSheetGeneratorProps) {
  const scoreFields = fields || defaultFieldsByGame[game.slug] || defaultFields
  const [playerCount, setPlayerCount] = React.useState(
    Math.min(game.player_count_max || 4, maxPlayers)
  )
  const [playerNames, setPlayerNames] = React.useState<string[]>(
    Array(maxPlayers).fill('').map((_, i) => `Player ${i + 1}`)
  )
  const [scores, setScores] = React.useState<Record<string, number[]>>(() => {
    const initial: Record<string, number[]> = {}
    scoreFields.forEach((field) => {
      initial[field.name] = Array(maxPlayers).fill(0)
    })
    return initial
  })

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames]
    newNames[index] = name
    setPlayerNames(newNames)
  }

  const updateScore = (field: string, playerIndex: number, value: number) => {
    setScores((prev) => ({
      ...prev,
      [field]: prev[field].map((v, i) => (i === playerIndex ? value : v)),
    }))
  }

  const calculateTotal = (playerIndex: number) => {
    return scoreFields.reduce((sum, field) => {
      const value = scores[field.name]?.[playerIndex] || 0
      // Handle penalty fields (those with "-" in the label)
      if (field.label.includes('(-)') || field.label.includes('Penalties')) {
        return sum - Math.abs(value)
      }
      return sum + value
    }, 0)
  }

  const generatePDF = async () => {
    // Dynamic import to avoid SSR issues
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Title
    doc.setFontSize(20)
    doc.text(`${game.name} Score Sheet`, 14, 20)

    // Date line
    doc.setFontSize(10)
    doc.text(`Date: _______________`, 14, 30)

    // Build table data
    const activePlayerNames = playerNames.slice(0, playerCount)
    const headers = ['Category', ...activePlayerNames]
    const body = scoreFields.map((field) => [
      field.label,
      ...activePlayerNames.map((_, i) => scores[field.name]?.[i]?.toString() || ''),
    ])

    // Add total row
    body.push([
      'TOTAL',
      ...activePlayerNames.map((_, i) => calculateTotal(i).toString()),
    ])

    // Render table
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 40,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // Indigo
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
      },
      styles: {
        minCellHeight: 10,
        fontSize: 10,
        cellPadding: 3,
      },
      footStyles: {
        fontStyle: 'bold',
      },
    })

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text(
      'Generated at goodgame.guide',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )

    doc.save(`${game.slug}-score-sheet.pdf`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Player count selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Number of Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPlayerCount((p) => Math.max(minPlayers, p - 1))}
              disabled={playerCount <= minPlayers}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-2xl font-bold w-12 text-center">
              {playerCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPlayerCount((p) => Math.min(maxPlayers, p + 1))}
              disabled={playerCount >= maxPlayers}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Player names */}
      <Card>
        <CardHeader>
          <CardTitle>Player Names</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: playerCount }).map((_, i) => (
              <Input
                key={i}
                placeholder={`Player ${i + 1}`}
                value={playerNames[i]}
                onChange={(e) => updatePlayerName(i, e.target.value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score table */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="print:pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>{game.name} Score Sheet</CardTitle>
            <Badge variant="secondary" className="print:hidden">
              Preview
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-semibold">Category</th>
                  {Array.from({ length: playerCount }).map((_, i) => (
                    <th key={i} className="p-3 text-center font-semibold min-w-[100px]">
                      {playerNames[i] || `Player ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scoreFields.map((field) => (
                  <tr key={field.name} className="border-b">
                    <td className="p-3 font-medium">{field.label}</td>
                    {Array.from({ length: playerCount }).map((_, i) => (
                      <td key={i} className="p-2 text-center">
                        <Input
                          type="number"
                          className="w-20 mx-auto text-center print:border-0 print:bg-transparent"
                          value={scores[field.name]?.[i] || ''}
                          onChange={(e) =>
                            updateScore(
                              field.name,
                              i,
                              parseInt(e.target.value) || 0
                            )
                          }
                          min={0}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-primary/10 font-bold">
                  <td className="p-3">TOTAL</td>
                  {Array.from({ length: playerCount }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-lg">
                      {calculateTotal(i)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button onClick={generatePDF} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  )
}
