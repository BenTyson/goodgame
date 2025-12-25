#!/bin/bash
# Generate content for all games missing rules in production
# Usage: ./scripts/generate-content-prod.sh

PROD_URL="https://boardnomads.com"
CRON_SECRET="${CRON_SECRET:-boardnomads-cron-secret-2024}"

# Games from BGG Top 20 that need content
GAMES=(
  "brass-birmingham"
  "pandemic-legacy-season-1"
  "ark-nova"
  "gloomhaven"
  "dune-imperium"
  "twilight-imperium-4"
  "dune-imperium-uprising"
  "war-of-the-ring"
  "star-wars-rebellion"
  "spirit-island"
  "gloomhaven-jaws-of-the-lion"
  "gaia-project"
  "twilight-struggle"
  "castles-of-burgundy"
  "through-the-ages"
  "great-western-trail"
  "frosthaven"
  "eclipse-second-dawn"
  "brass-lancashire"
)

echo "=== Content Generation for Production ==="
echo "URL: $PROD_URL"
echo "Games to process: ${#GAMES[@]}"
echo ""

# First, get game IDs from production
echo "Fetching game IDs from production..."

for slug in "${GAMES[@]}"; do
  echo ""
  echo "----------------------------------------"
  echo "Processing: $slug"

  # Get game ID from Supabase
  GAME_ID=$(curl -s \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/games?slug=eq.${slug}&select=id" \
    -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

  if [ -z "$GAME_ID" ]; then
    echo "  ERROR: Could not find game ID for $slug"
    continue
  fi

  echo "  Game ID: $GAME_ID"
  echo "  Generating content..."

  # Call the generate-content API
  RESPONSE=$(curl -s -X POST \
    "${PROD_URL}/api/cron/generate-content?gameId=${GAME_ID}" \
    -H "x-cron-secret: ${CRON_SECRET}" \
    -H "Content-Type: application/json")

  # Check if successful
  if echo "$RESPONSE" | grep -q '"success":true'; then
    COST=$(echo "$RESPONSE" | grep -o '"costUsd":[0-9.]*' | head -1 | cut -d':' -f2)
    echo "  SUCCESS! Cost: \$${COST:-0}"
  else
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "  FAILED: ${ERROR:-$RESPONSE}"
  fi

  # Small delay between requests
  sleep 2
done

echo ""
echo "=== Generation Complete ==="
