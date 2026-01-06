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
  wikipedia: boolean
  dbColumn: string
  notes?: string
  refOnly?: boolean // Reference only - used internally, not displayed to users
}

// ===========================================
// CORE GAME INFO - Basic game attributes
// ===========================================
const coreGameFields: DataField[] = [
  { field: 'Name', bgg: true, wikidata: true, wikipedia: false, dbColumn: 'games.name' },
  { field: 'Description', bgg: true, wikidata: true, wikipedia: false, dbColumn: 'games.description' },
  { field: 'Year Published', bgg: true, wikidata: true, wikipedia: true, dbColumn: 'games.year_published', notes: 'Wikipedia: from infobox' },
  { field: 'Min Players', bgg: true, wikidata: true, wikipedia: true, dbColumn: 'games.player_count_min', notes: 'Wikipedia: from infobox' },
  { field: 'Max Players', bgg: true, wikidata: true, wikipedia: true, dbColumn: 'games.player_count_max', notes: 'Wikipedia: from infobox' },
  { field: 'Min Play Time', bgg: true, wikidata: false, wikipedia: true, dbColumn: 'games.play_time_min', notes: 'Wikipedia: from infobox' },
  { field: 'Max Play Time', bgg: true, wikidata: false, wikipedia: true, dbColumn: 'games.play_time_max', notes: 'Wikipedia: from infobox' },
  { field: 'Play Time', bgg: false, wikidata: true, wikipedia: false, dbColumn: '—', notes: 'Not stored separately' },
  { field: 'Min Age', bgg: true, wikidata: false, wikipedia: true, dbColumn: 'games.min_age', notes: 'Wikipedia: from infobox' },
  { field: 'Weight/Complexity', bgg: true, wikidata: false, wikipedia: true, dbColumn: 'games.weight', notes: 'BGG weight + WP complexity' },
]

// ===========================================
// TAXONOMY - Categories, mechanics, themes
// ===========================================
const taxonomyFields: DataField[] = [
  { field: 'Categories', bgg: true, wikidata: false, wikipedia: true, dbColumn: 'game_categories', notes: 'Wikipedia: category mapping' },
  { field: 'Mechanics', bgg: true, wikidata: true, wikipedia: true, dbColumn: 'game_mechanics', notes: 'All 3 sources merged' },
  { field: 'Themes', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_infobox', notes: 'From Wikipedia infobox' },
]

// ===========================================
// RELATIONS - Expansions, families, sequels
// ===========================================
const relationFields: DataField[] = [
  { field: 'Families', bgg: true, wikidata: true, wikipedia: false, dbColumn: 'games.family_id', notes: 'FK to game_families' },
  { field: 'Wikidata Series ID', bgg: false, wikidata: true, wikipedia: false, dbColumn: 'games.wikidata_series_id', notes: 'P179 series membership' },
  { field: 'Expansions', bgg: true, wikidata: false, wikipedia: true, dbColumn: 'game_relations', notes: 'Wikipedia: from infobox/links' },
  { field: 'Reimplementations', bgg: true, wikidata: false, wikipedia: false, dbColumn: 'game_relations', notes: 'BGG relation type' },
  { field: 'Sequel Relations', bgg: false, wikidata: true, wikipedia: true, dbColumn: 'game_relations', notes: 'Wikipedia: from infobox/links' },
]

// ===========================================
// MEDIA - Images and visual assets
// ===========================================
const mediaFields: DataField[] = [
  { field: 'Primary Image', bgg: true, wikidata: true, wikipedia: true, dbColumn: 'games.image_url', notes: 'Wikidata CC preferred' },
  { field: 'Thumbnail', bgg: true, wikidata: false, wikipedia: false, dbColumn: 'games.thumbnail_url', notes: 'BGG fallback', refOnly: true },
  { field: 'Wikidata Image', bgg: false, wikidata: true, wikipedia: false, dbColumn: 'games.wikidata_image_url', notes: 'CC-licensed from Commons' },
  { field: 'Wikipedia Images', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_images', notes: 'Article images with licenses' },
]

// ===========================================
// EXTERNAL REFERENCES - Links and IDs
// ===========================================
const externalRefFields: DataField[] = [
  { field: 'BGG ID', bgg: true, wikidata: true, wikipedia: false, dbColumn: 'games.bgg_id', notes: 'Cross-reference', refOnly: true },
  { field: 'Wikidata ID', bgg: false, wikidata: true, wikipedia: false, dbColumn: 'games.wikidata_id', refOnly: true },
  { field: 'Wikipedia URL', bgg: false, wikidata: true, wikipedia: true, dbColumn: 'games.wikipedia_url', notes: 'Search or Wikidata sitelink' },
  { field: 'Official Website', bgg: false, wikidata: true, wikipedia: true, dbColumn: 'games.official_website', notes: 'From infobox or external links' },
  { field: 'Rulebook URL', bgg: false, wikidata: true, wikipedia: true, dbColumn: 'games.rulebook_url', notes: 'Wikidata P953 + WP links' },
  { field: 'External Links', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_external_links', notes: 'Categorized: official, store, video' },
]

// ===========================================
// RATINGS & AWARDS - Reception data
// ===========================================
const ratingsFields: DataField[] = [
  { field: 'BGG Rating', bgg: true, wikidata: false, wikipedia: false, dbColumn: 'bgg_raw_data', refOnly: true },
  { field: 'BGG Rank', bgg: true, wikidata: false, wikipedia: false, dbColumn: 'bgg_raw_data', refOnly: true },
  { field: 'Awards', bgg: false, wikidata: true, wikipedia: true, dbColumn: 'games.wikipedia_awards', notes: 'Structured: name, year, result' },
  { field: 'Reception Section', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_reception', notes: 'Reviews, critical acclaim' },
]

// ===========================================
// PEOPLE - Designers, artists (links to tables)
// ===========================================
const peopleFields: DataField[] = [
  { field: 'Designers', bgg: true, wikidata: true, wikipedia: true, dbColumn: 'game_designers', notes: 'Junction table' },
  { field: 'Artists', bgg: true, wikidata: false, wikipedia: false, dbColumn: 'game_artists', notes: 'Junction table' },
  { field: 'Publishers', bgg: true, wikidata: true, wikipedia: true, dbColumn: 'game_publishers', notes: 'Junction table' },
  { field: 'Publisher Regions', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_infobox', notes: 'Primary publisher detection (US priority)' },
]

// ===========================================
// CONTENT GENERATION - AI/Wikipedia context
// ===========================================
const contentFields: DataField[] = [
  { field: 'Wikipedia Infobox', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_infobox', notes: 'Structured template data' },
  { field: 'Wikipedia Summary', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_summary', notes: 'AI-extracted themes, mechanics' },
  { field: 'Origins/History', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_origins', notes: 'Development history section' },
  { field: 'Gameplay Section', bgg: false, wikidata: false, wikipedia: true, dbColumn: 'games.wikipedia_gameplay', notes: 'Rules overview for AI' },
]

const publisherFields: DataField[] = [
  { field: 'Name', bgg: true, wikidata: true, wikipedia: false, dbColumn: 'publishers.name' },
  { field: 'Website', bgg: false, wikidata: true, wikipedia: false, dbColumn: 'publishers.website', notes: 'Enriched from Wikidata' },
  { field: 'Logo', bgg: false, wikidata: true, wikipedia: false, dbColumn: 'publishers.logo_url' },
  { field: 'Description', bgg: false, wikidata: true, wikipedia: false, dbColumn: 'publishers.description', notes: 'Enriched from Wikidata' },
  { field: 'Founded Year', bgg: false, wikidata: true, wikipedia: false, dbColumn: '—', notes: 'Not stored' },
  { field: 'Country', bgg: false, wikidata: true, wikipedia: false, dbColumn: '—', notes: 'Not stored' },
  { field: 'Wikidata ID', bgg: false, wikidata: true, wikipedia: false, dbColumn: 'publishers.wikidata_id' },
]

const familyFields: DataField[] = [
  { field: 'Name', bgg: true, wikidata: true, wikipedia: false, dbColumn: 'game_families.name' },
  { field: 'Slug', bgg: true, wikidata: true, wikipedia: false, dbColumn: 'game_families.slug', notes: 'Auto-generated from name' },
  { field: 'Description', bgg: false, wikidata: false, wikipedia: false, dbColumn: 'game_families.description', notes: 'Manual entry' },
  { field: 'BGG Family ID', bgg: true, wikidata: false, wikipedia: false, dbColumn: 'game_families.bgg_family_id' },
  { field: 'Wikidata Series ID', bgg: false, wikidata: true, wikipedia: false, dbColumn: 'game_families.wikidata_series_id', notes: 'P179 series' },
  { field: 'Base Game', bgg: false, wikidata: false, wikipedia: false, dbColumn: 'game_families.base_game_id', notes: 'Manual/auto-detected' },
  { field: 'Hero Image', bgg: false, wikidata: false, wikipedia: false, dbColumn: 'game_families.hero_image_url', notes: 'Manual upload' },
]

const designerFields: DataField[] = [
  { field: 'Name', bgg: true, wikidata: true, wikipedia: true, dbColumn: 'designers.name', notes: 'Wikipedia: from infobox' },
]

// Combined game fields for stats (all 8 game-related sections)
const allGameFields: DataField[] = [
  ...coreGameFields,
  ...taxonomyFields,
  ...relationFields,
  ...mediaFields,
  ...externalRefFields,
  ...ratingsFields,
  ...peopleFields,
  ...contentFields,
]

function DataTable({ fields, title }: { fields: DataField[]; title: string }) {
  const allThreeCount = fields.filter(f => f.bgg && f.wikidata && f.wikipedia).length
  const bggWikidataCount = fields.filter(f => f.bgg && f.wikidata && !f.wikipedia).length
  const bggOnlyCount = fields.filter(f => f.bgg && !f.wikidata && !f.wikipedia).length
  const wikidataOnlyCount = fields.filter(f => !f.bgg && f.wikidata && !f.wikipedia).length
  const wikipediaOnlyCount = fields.filter(f => !f.bgg && !f.wikidata && f.wikipedia).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex gap-3 text-sm font-normal text-muted-foreground">
            <span className="text-green-600">{allThreeCount} all 3</span>
            <span className="text-emerald-600">{bggWikidataCount} BGG+WD</span>
            <span className="text-blue-600">{bggOnlyCount} BGG</span>
            <span className="text-purple-600">{wikidataOnlyCount} WD</span>
            <span className="text-orange-600">{wikipediaOnlyCount} WP</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Field</TableHead>
              <TableHead className="w-[60px] text-center">BGG</TableHead>
              <TableHead className="w-[60px] text-center">Wikidata</TableHead>
              <TableHead className="w-[60px] text-center">Wikipedia</TableHead>
              <TableHead className="w-[200px]">Database Column</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((row) => {
              const hasAll = row.bgg && row.wikidata && row.wikipedia
              const hasBggWikidata = row.bgg && row.wikidata && !row.wikipedia
              return (
                <TableRow
                  key={row.field}
                  className={cn(
                    hasAll && 'bg-green-500/5',
                    hasBggWikidata && 'bg-emerald-500/5'
                  )}
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
                  <TableCell className="text-center">
                    {row.wikipedia && <Check className="h-4 w-4 mx-auto text-orange-600" />}
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
          All fields imported from BGG, Wikidata, and Wikipedia during the import process.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" /> All 3 sources
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" /> BGG + Wikidata
          </span>
          <span className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
              <Eye className="h-3 w-3 mr-0.5" />
              Ref
            </Badge>
            Reference only
          </span>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{allGameFields.length}</div>
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
              {allGameFields.filter(f => f.bgg && f.wikidata && f.wikipedia).length +
               designerFields.filter(f => f.bgg && f.wikidata && f.wikipedia).length}
            </div>
            <p className="text-xs text-muted-foreground">All 3 sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {allGameFields.filter(f => !f.bgg && f.wikidata && !f.wikipedia).length +
               familyFields.filter(f => !f.bgg && f.wikidata && !f.wikipedia).length +
               publisherFields.filter(f => !f.bgg && f.wikidata && !f.wikipedia).length}
            </div>
            <p className="text-xs text-muted-foreground">Wikidata only</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {allGameFields.filter(f => !f.bgg && !f.wikidata && f.wikipedia).length}
            </div>
            <p className="text-xs text-muted-foreground">Wikipedia only</p>
          </CardContent>
        </Card>
      </div>

      {/* Game Data Sections */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Game Data</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <DataTable fields={coreGameFields} title="Core Game Info" />
          <DataTable fields={taxonomyFields} title="Taxonomy" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <DataTable fields={relationFields} title="Relations" />
          <DataTable fields={mediaFields} title="Media" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <DataTable fields={externalRefFields} title="External References" />
          <DataTable fields={ratingsFields} title="Ratings & Awards" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <DataTable fields={peopleFields} title="People" />
          <DataTable fields={contentFields} title="Content Generation" />
        </div>
      </div>

      {/* Entity Tables */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Entity Tables</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <DataTable fields={familyFields} title="Family Fields" />
          <DataTable fields={publisherFields} title="Publisher Fields" />
        </div>
        <DataTable fields={designerFields} title="Designer Fields" />
      </div>
    </div>
  )
}
