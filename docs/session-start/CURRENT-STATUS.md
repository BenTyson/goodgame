# Current Status

> Last Updated: 2025-12-22

## Phase: 5 - Production Ready (Live!)

### What's Live
- **16 games** with full content (Rules, Setup, Reference, Score Sheets)
- **6 major awards** with full UI (browse, detail pages, badges)
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

### Recently Completed (Dec 22): Awards UI
- [x] Added award query functions to `src/lib/supabase/queries.ts`
- [x] Created `/awards` page - Browse all awards with German/International sections
- [x] Created `/awards/[slug]` page - Award detail with winners grouped by year
- [x] Created `AwardBadge` and `AwardBadgeList` components with tier-based styling
- [x] Awards display on game hub pages (linked to 5 games)
- [x] Added "Awards" link to main navigation
- [x] Updated sitemap with award pages

### Awards in Database
| Award | Short | Country | Winners in DB |
|-------|-------|---------|---------------|
| Spiel des Jahres | SdJ | Germany | 3 (Cascadia, Azul, Codenames) |
| Kennerspiel des Jahres | KdJ | Germany | 2 (Wingspan, The Crew) |
| Kinderspiel des Jahres | KindSdJ | Germany | 0 |
| Golden Geek Awards | Golden Geek | USA | 4 |
| Dice Tower Awards | Dice Tower | USA | 3 |
| As d'Or | As d'Or | France | 2 |

### Next Up
- Add more award-winning games to database
- Consider adding "nominee" results to awards
- SEO optimization for award pages

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
