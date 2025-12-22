# Current Status

> Last Updated: 2025-12-21

## Phase: 5 - Production Ready (Live!)

### What's Live
- **16 games** with full content (Rules, Setup, Reference, Score Sheets)
- **Dark mode** with theme toggle
- **Production**: https://goodgame-production.up.railway.app

### Games in Database
| # | Game | Rules | Setup | Reference | Score Sheet |
|---|------|-------|-------|-----------|-------------|
| 1 | Catan | X | X | X | X |
| 2 | Wingspan | X | X | X | X |
| 3 | Ticket to Ride | X | X | X | X |
| 4 | Azul | X | X | X | X |
| 5 | Codenames | X | X | X | - |
| 6 | Terraforming Mars | X | X | X | X |
| 7 | Splendor | X | X | X | X |
| 8 | Pandemic | X | X | X | - |
| 9 | Carcassonne | X | X | X | X |
| 10 | 7 Wonders | X | X | X | X |
| 11 | Dominion | X | X | X | X |
| 12 | King of Tokyo | X | X | X | X |
| 13 | Sushi Go! | X | X | X | X |
| 14 | Love Letter | X | X | X | - |
| 15 | The Crew | X | X | X | - |
| 16 | Cascadia | X | X | X | X |

### Recently Completed (Dec 21)
- [x] Added 10 more games (Splendor, Pandemic, Carcassonne, 7 Wonders, Dominion, King of Tokyo, Sushi Go, Love Letter, The Crew, Cascadia)
- [x] Dark mode with warm charcoal palette
- [x] Theme toggle in header (sun/moon icons)
- [x] Full rules/setup/reference content for all 16 games

### Recently Completed: Board Game Awards Database
- [x] Created `00007_awards_schema.sql` - awards, award_categories, game_awards tables
- [x] Created `00008_seed_awards.sql` - 6 major awards + categories
- [x] Linked 5 existing games to their awards (Cascadia, Azul, Codenames, Wingspan, The Crew)
- [x] Types regenerated with new tables

**Awards in database:**
- Spiel des Jahres (Game of the Year) - 1978
- Kennerspiel des Jahres (Expert Game) - 2011
- Kinderspiel des Jahres (Children's Game) - 1989
- Golden Geek Awards (BGG community) - 2006
- Dice Tower Awards - 2007
- As d'Or (France) - 1988

### Next Up: Awards UI
1. Add query functions to `src/lib/supabase/queries.ts`
2. Create `/awards` page - Browse all awards
3. Create `/awards/[slug]` page - Award detail with winners by year
4. Add `AwardBadge` component for game cards
5. Show awards on game hub pages

---

## Database Migrations
```
supabase/migrations/
├── 00001_initial_schema.sql      # Core tables
├── 00002_seed_data.sql           # Categories + mechanics
├── 00003_game_images.sql         # Images table
├── 00004_seed_games.sql          # First 6 games
├── 00005_more_pilot_games.sql    # Splendor, Pandemic, Carcassonne, 7 Wonders
├── 00006_tier1_gateway_games.sql # Dominion, King of Tokyo, Sushi Go, Love Letter, The Crew, Cascadia
├── 00007_awards_schema.sql       # Awards tables (awards, award_categories, game_awards)
└── 00008_seed_awards.sql         # 6 awards + categories + links to existing games
```

## Key Commands
```bash
npm run dev          # http://localhost:3399
npm run build        # Build (72 pages)
supabase db push     # Push migrations
git push origin main # Deploy to Railway
```

## Supabase
- **Project ID**: jnaibnwxpweahpawxycf
- **Regenerate types**: `supabase gen types typescript --project-id jnaibnwxpweahpawxycf > src/types/supabase.ts`

## Railway
- **Domain**: https://goodgame-production.up.railway.app
- Auto-deploys on push to main
