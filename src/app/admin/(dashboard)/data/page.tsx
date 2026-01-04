import { Check, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DataField {
  field: string
  bgg: boolean
  wikidata: boolean
  dbColumn: string
  notes?: string
  refOnly?: boolean // Reference only - used internally, not displayed to users
}

const gameFields: DataField[] = [
  { field: 'Name', bgg: true, wikidata: true, dbColumn: 'games.name' },
  { field: 'Description', bgg: true, wikidata: true, dbColumn: 'games.description' },
  { field: 'Year Published', bgg: true, wikidata: true, dbColumn: 'games.year_published' },
  { field: 'Min Players', bgg: true, wikidata: true, dbColumn: 'games.player_count_min' },
  { field: 'Max Players', bgg: true, wikidata: true, dbColumn: 'games.player_count_max' },
  { field: 'Min Play Time', bgg: true, wikidata: false, dbColumn: 'games.play_time_min' },
  { field: 'Max Play Time', bgg: true, wikidata: false, dbColumn: 'games.play_time_max' },
  { field: 'Play Time', bgg: false, wikidata: true, dbColumn: '—', notes: 'Not stored separately' },
  { field: 'Min Age', bgg: true, wikidata: false, dbColumn: 'games.min_age' },
  { field: 'Weight', bgg: true, wikidata: false, dbColumn: 'games.weight', notes: 'Used for Crunch Score', refOnly: true },
  { field: 'BGG Rating', bgg: true, wikidata: false, dbColumn: 'bgg_raw_data', refOnly: true },
  { field: 'BGG Rank', bgg: true, wikidata: false, dbColumn: 'bgg_raw_data', refOnly: true },
  { field: 'Thumbnail', bgg: true, wikidata: false, dbColumn: 'games.thumbnail_url', notes: 'Fallback only', refOnly: true },
  { field: 'Image (BGG)', bgg: true, wikidata: false, dbColumn: 'games.image_url', notes: 'Fallback only', refOnly: true },
  { field: 'Image (Wikidata)', bgg: false, wikidata: true, dbColumn: 'games.wikidata_image_url', notes: 'CC-licensed, preferred' },
  { field: 'Official Website', bgg: false, wikidata: true, dbColumn: 'games.official_website' },
  { field: 'Rulebook URL', bgg: false, wikidata: true, dbColumn: 'games.rulebook_url', notes: 'P953: full work available' },
  { field: 'BGG ID', bgg: true, wikidata: true, dbColumn: 'games.bgg_id', notes: 'Cross-reference', refOnly: true },
  { field: 'Wikidata ID', bgg: false, wikidata: true, dbColumn: 'games.wikidata_id', refOnly: true },
  { field: 'Designers', bgg: true, wikidata: true, dbColumn: 'game_designers', notes: 'Junction table' },
  { field: 'Publishers', bgg: true, wikidata: true, dbColumn: 'game_publishers', notes: 'Junction table' },
  { field: 'Artists', bgg: true, wikidata: false, dbColumn: 'game_artists', notes: 'Junction table' },
  { field: 'Categories', bgg: true, wikidata: false, dbColumn: 'game_categories', notes: 'Alias-mapped to our taxonomy' },
  { field: 'Mechanics', bgg: true, wikidata: true, dbColumn: 'game_mechanics', notes: 'Alias-mapped to our taxonomy' },
  { field: 'Families', bgg: true, wikidata: true, dbColumn: 'games.family_id', notes: 'FK to game_families' },
  { field: 'Wikidata Series ID', bgg: false, wikidata: true, dbColumn: 'games.wikidata_series_id', notes: 'P179 series membership' },
  { field: 'Wikipedia URL', bgg: false, wikidata: true, dbColumn: 'games.wikipedia_url', notes: 'English Wikipedia sitelink' },
  { field: 'Expansions', bgg: true, wikidata: false, dbColumn: 'game_relations', notes: 'Relation type' },
  { field: 'Reimplementations', bgg: true, wikidata: false, dbColumn: 'game_relations', notes: 'Relation type' },
  { field: 'Sequel Relations', bgg: false, wikidata: true, dbColumn: 'game_relations', notes: 'P155/P156 follows/followed by' },
  { field: 'Awards', bgg: false, wikidata: true, dbColumn: '—', notes: 'Not stored yet' },
]

const publisherFields: DataField[] = [
  { field: 'Name', bgg: true, wikidata: true, dbColumn: 'publishers.name' },
  { field: 'Website', bgg: false, wikidata: true, dbColumn: 'publishers.website', notes: 'Enriched from Wikidata' },
  { field: 'Logo', bgg: false, wikidata: true, dbColumn: 'publishers.logo_url' },
  { field: 'Description', bgg: false, wikidata: true, dbColumn: 'publishers.description', notes: 'Enriched from Wikidata' },
  { field: 'Founded Year', bgg: false, wikidata: true, dbColumn: '—', notes: 'Not stored' },
  { field: 'Country', bgg: false, wikidata: true, dbColumn: '—', notes: 'Not stored' },
  { field: 'Wikidata ID', bgg: false, wikidata: true, dbColumn: 'publishers.wikidata_id' },
]

const familyFields: DataField[] = [
  { field: 'Name', bgg: true, wikidata: true, dbColumn: 'game_families.name' },
  { field: 'Slug', bgg: true, wikidata: true, dbColumn: 'game_families.slug', notes: 'Auto-generated from name' },
  { field: 'Description', bgg: false, wikidata: false, dbColumn: 'game_families.description', notes: 'Manual entry' },
  { field: 'BGG Family ID', bgg: true, wikidata: false, dbColumn: 'game_families.bgg_family_id' },
  { field: 'Wikidata Series ID', bgg: false, wikidata: true, dbColumn: 'game_families.wikidata_series_id', notes: 'P179 series' },
  { field: 'Base Game', bgg: false, wikidata: false, dbColumn: 'game_families.base_game_id', notes: 'Manual/auto-detected' },
  { field: 'Hero Image', bgg: false, wikidata: false, dbColumn: 'game_families.hero_image_url', notes: 'Manual upload' },
]

const designerFields: DataField[] = [
  { field: 'Name', bgg: true, wikidata: true, dbColumn: 'designers.name' },
]

function DataTable({ fields, title }: { fields: DataField[]; title: string }) {
  const bothCount = fields.filter(f => f.bgg && f.wikidata).length
  const bggOnlyCount = fields.filter(f => f.bgg && !f.wikidata).length
  const wikidataOnlyCount = fields.filter(f => !f.bgg && f.wikidata).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex gap-4 text-sm font-normal text-muted-foreground">
            <span className="text-green-600">{bothCount} both</span>
            <span className="text-blue-600">{bggOnlyCount} BGG only</span>
            <span className="text-purple-600">{wikidataOnlyCount} Wikidata only</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Field</TableHead>
              <TableHead className="w-[80px] text-center">BGG</TableHead>
              <TableHead className="w-[80px] text-center">Wikidata</TableHead>
              <TableHead className="w-[200px]">Database Column</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((row) => {
              const hasBoth = row.bgg && row.wikidata
              return (
                <TableRow
                  key={row.field}
                  className={cn(hasBoth && 'bg-green-500/5')}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {row.field}
                      {row.refOnly && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                          <Eye className="h-3 w-3 mr-0.5" />
                          Ref
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.bgg && <Check className="h-4 w-4 mx-auto text-blue-600" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.wikidata && <Check className="h-4 w-4 mx-auto text-purple-600" />}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {row.dbColumn}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.notes}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function DataPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Data Dictionary</h1>
        <p className="text-muted-foreground mt-1">
          All fields imported from BGG and Wikidata during the import process.
        </p>
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" /> Both sources
          </span>
          <span className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
              <Eye className="h-3 w-3 mr-0.5" />
              Ref
            </Badge>
            Reference only (internal use)
          </span>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{gameFields.length}</div>
            <p className="text-xs text-muted-foreground">Game fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{familyFields.length}</div>
            <p className="text-xs text-muted-foreground">Family fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{publisherFields.length}</div>
            <p className="text-xs text-muted-foreground">Publisher fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {gameFields.filter(f => f.bgg && f.wikidata).length +
               familyFields.filter(f => f.bgg && f.wikidata).length +
               publisherFields.filter(f => f.bgg && f.wikidata).length +
               designerFields.filter(f => f.bgg && f.wikidata).length}
            </div>
            <p className="text-xs text-muted-foreground">Fields from both sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {gameFields.filter(f => !f.bgg && f.wikidata).length +
               familyFields.filter(f => !f.bgg && f.wikidata).length +
               publisherFields.filter(f => !f.bgg && f.wikidata).length}
            </div>
            <p className="text-xs text-muted-foreground">Wikidata-only enrichment</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <DataTable fields={gameFields} title="Game Fields" />
        <DataTable fields={familyFields} title="Family Fields" />
        <DataTable fields={publisherFields} title="Publisher Fields" />
        <DataTable fields={designerFields} title="Designer Fields" />
      </div>
    </div>
  )
}
