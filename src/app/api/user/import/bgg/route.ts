import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiErrors } from '@/lib/api/errors'
import {
  parseBGGCollectionCSV,
  validateBGGCSV,
} from '@/lib/import/bgg-csv-parser'
import { matchGamesByBGGId } from '@/lib/import/game-matcher'
import {
  importCollection,
  previewImport,
  type ImportOptions,
} from '@/lib/import/collection-importer'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * POST /api/user/import/bgg
 *
 * Import a BGG collection CSV file
 *
 * Form data:
 * - file: CSV file from BGG export
 * - mode: 'preview' | 'import'
 * - overwriteExisting: 'true' | 'false' (default: false)
 * - importRatings: 'true' | 'false' (default: true)
 * - importNotes: 'true' | 'false' (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mode = (formData.get('mode') as string) || 'preview'

    if (!file) {
      return ApiErrors.validation('No file provided')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return ApiErrors.validation('File is too large (max 5MB)')
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return ApiErrors.validation('File must be a CSV')
    }

    // Read file content
    const csvText = await file.text()

    // Validate CSV structure
    const csvValidation = validateBGGCSV(csvText)
    if (!csvValidation.valid) {
      return ApiErrors.validation(csvValidation.error || 'Invalid CSV file')
    }

    // Parse CSV
    const parseResult = parseBGGCollectionCSV(csvText)

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        },
        { status: 400 }
      )
    }

    if (parseResult.rows.length === 0) {
      return ApiErrors.validation('No valid games found in CSV')
    }

    // Match games with our database
    const matchResult = await matchGamesByBGGId(parseResult.rows)

    // Preview mode - just return what would happen
    if (mode === 'preview') {
      const preview = await previewImport(user.id, parseResult.rows, matchResult)

      return NextResponse.json({
        success: true,
        mode: 'preview',
        totalInCSV: parseResult.rows.length,
        matched: matchResult.matched.length,
        unmatched: matchResult.unmatched.length,
        preview: {
          wouldImport: preview.wouldImport,
          wouldUpdate: preview.wouldUpdate,
          wouldSkip: preview.wouldSkip,
        },
        unmatchedGames: matchResult.unmatched.slice(0, 50), // Limit for display
        warnings: parseResult.warnings,
      })
    }

    // Import mode - actually perform the import
    if (mode === 'import') {
      const options: Partial<ImportOptions> = {
        overwriteExisting: formData.get('overwriteExisting') === 'true',
        importRatings: formData.get('importRatings') !== 'false',
        importNotes: formData.get('importNotes') !== 'false',
      }

      const importResult = await importCollection(
        user.id,
        parseResult.rows,
        matchResult,
        options
      )

      return NextResponse.json({
        success: importResult.errors.length === 0,
        mode: 'import',
        imported: importResult.imported,
        updated: importResult.updated,
        skipped: importResult.skipped,
        unmatched: importResult.unmatched.length,
        unmatchedGames: importResult.unmatched.slice(0, 50),
        errors: importResult.errors,
        warnings: parseResult.warnings,
      })
    }

    return ApiErrors.validation('Invalid mode. Use "preview" or "import"')
  } catch (error) {
    console.error('BGG import error:', error)
    return ApiErrors.internal(error, { route: '/api/user/import/bgg' })
  }
}
