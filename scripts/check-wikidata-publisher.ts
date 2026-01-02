import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function searchWikidataPublisher(name: string): Promise<{ website: string | null, wikidataId: string | null, label: string | null }> {
  // Use the wikibase search API for fuzzy matching
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=5`

  try {
    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': 'BoardNomads/1.0' }
    })
    const searchData = await searchResponse.json()

    if (!searchData.search || searchData.search.length === 0) {
      return { website: null, wikidataId: null, label: null }
    }

    // Try to find a match that looks like a company/publisher
    for (const result of searchData.search) {
      const qid = result.id
      const label = result.label

      // Query for this specific entity's website
      const query = `
        SELECT ?website WHERE {
          wd:${qid} wdt:P856 ?website .
        }
        LIMIT 1
      `

      const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(query) + '&format=json'
      const response = await fetch(url, {
        headers: { 'User-Agent': 'BoardNomads/1.0' }
      })

      const data = await response.json()
      const websiteResult = data.results.bindings[0]

      if (websiteResult?.website?.value) {
        return {
          website: websiteResult.website.value,
          wikidataId: qid,
          label: label
        }
      }
    }

    return { website: null, wikidataId: null, label: null }
  } catch (e) {
    console.error('Error:', e)
    return { website: null, wikidataId: null, label: null }
  }
}

async function main() {
  // Get specific major publishers to test
  const { data: publishers } = await supabase
    .from('publishers')
    .select('id, name, website')
    .is('website', null)
    .in('name', ['KOSMOS', '999 Games', 'Ravensburger', 'Hasbro', 'Asmodee', 'Fantasy Flight Games', 'Z-Man Games', 'Days of Wonder', 'Stonemaier Games', 'Czech Games Edition'])

  console.log(`Found ${publishers?.length || 0} publishers without websites\n`)

  for (const pub of publishers || []) {
    console.log(`Searching for: ${pub.name}`)
    const result = await searchWikidataPublisher(pub.name)
    if (result.website) {
      console.log(`  ✓ Found: ${result.website}`)
      console.log(`    Wikidata: ${result.wikidataId} (${result.label})`)
    } else {
      console.log(`  ✗ Not found on Wikidata`)
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1000))
  }
}

main().catch(console.error)
