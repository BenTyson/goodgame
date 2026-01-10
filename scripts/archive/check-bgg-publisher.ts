import { config } from 'dotenv'
config({ path: '.env.local' })

import { parseStringPromise } from 'xml2js'

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2'

async function main() {
  // KOSMOS has BGG ID 37
  const publisherId = 37
  
  const url = `${BGG_API_BASE}/company?id=${publisherId}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.BGG_API_TOKEN}`
    }
  })
  
  const xml = await response.text()
  
  // Check if "website" or "link" or "url" appears anywhere
  console.log('Contains "website":', xml.toLowerCase().includes('website'))
  console.log('Contains "url":', xml.toLowerCase().includes('url'))
  console.log('Contains "http":', xml.includes('http'))
  
  // Find all http links in the XML
  const httpMatches = xml.match(/https?:\/\/[^\s"<>]+/g) || []
  console.log('\nAll HTTP URLs found:')
  const uniqueUrls = [...new Set(httpMatches)]
  uniqueUrls.forEach(url => console.log(' -', url))
  
  // Parse and look for any weblink element
  const result = await parseStringPromise(xml)
  const item = result.items?.item?.[0]
  
  console.log('\nAll keys in item:', Object.keys(item || {}))
  
  // Check for weblink
  if (item?.weblink) {
    console.log('\nWeblink:', item.weblink)
  }
}

main().catch(console.error)
