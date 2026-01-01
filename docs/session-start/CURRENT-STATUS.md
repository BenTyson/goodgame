# Current Status

> Last Updated: 2026-01-01 (Image Cropper Feature)

## Current Phase: 36 - Admin Image Cropper (COMPLETE)

Added image cropping functionality to the admin game image uploader with preset aspect ratios.

### New Files

| File | Purpose |
|------|---------|
| `src/lib/utils/image-crop.ts` | Canvas-based crop utility with aspect ratio presets |
| `src/components/admin/ImageCropper.tsx` | Modal dialog with react-easy-crop integration |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/admin/ImageUpload.tsx` | Added image type selector, crop flow, cropper modal |
| `src/app/api/admin/upload/route.ts` | Accepts `imageType` param, syncs to games table by type |
| `src/components/admin/index.ts` | Added ImageCropper export |

### Image Type Options

| Type | Default Ratio | Syncs To |
|------|---------------|----------|
| **Cover** | 4:3 | `box_image_url`, `thumbnail_url` |
| **Hero** | 16:9 | `hero_image_url` |
| **Gallery** | 4:3 | `game_images` table only |

### Upload Flow

1. Select image type (Cover/Hero/Gallery)
2. Select or drop an image file
3. Cropper modal opens with default aspect ratio for type
4. User can change ratio (1:1, 4:3, 16:9, 3:2)
5. Adjust zoom and position
6. Apply crop → uploads cropped image to Supabase

### Dependencies Added

- `react-easy-crop` - Lightweight image cropping library

---

## Phase 35 - Admin Game Editor UX Overhaul (COMPLETE)

Redesigned the admin game editor with a Setup Wizard for new games and consolidated tabs for power users.

### Setup Wizard (2025-12-31)

**New Hook:**
| File | Purpose |
|------|---------|
| `src/hooks/admin/useWizardProgress.ts` | localStorage-based wizard state with step tracking |

**New Components:**
| File | Purpose |
|------|---------|
| `GameSetupWizard.tsx` | Main wizard orchestrator |
| `WizardStepIndicator.tsx` | Visual step indicator with checkmarks |
| `wizard-steps/RulebookStep.tsx` | Step 1: Find/validate rulebook URL |
| `wizard-steps/ParseGenerateStep.tsx` | Step 2: Parse PDF + generate BNCS + content |
| `wizard-steps/ImagesStep.tsx` | Step 3: Upload primary and gallery images |
| `wizard-steps/ReviewContentStep.tsx` | Step 4: Review generated content |
| `wizard-steps/PublishStep.tsx` | Step 5: Final review + publish |
| `wizard-steps/index.ts` | Barrel exports |

### Tab Consolidation (2025-12-31)

**Before (6 tabs):** Details, Publishing, Rulebook, Content, Images, Relations

**After (4 tabs):** Details, Rulebook & Content, Images, Relations

**Created:**
| File | Purpose |
|------|---------|
| `RulebookContentTab.tsx` | Merged Rulebook + Content tabs |

**Modified:**
| File | Changes |
|------|---------|
| `DetailsTab.tsx` | Added Visibility Settings, Collection Tags, Content Status |
| `GameEditor.tsx` | Added wizard/advanced mode toggle |
| `src/components/admin/game-editor/index.ts` | Updated exports |
| `src/hooks/admin/index.ts` | Added useWizardProgress export |

**Deleted:**
| File | Reason |
|------|--------|
| `PublishingTab.tsx` | Merged into DetailsTab |

### Wizard Flow

| Step | Complete When |
|------|---------------|
| 1. Rulebook | URL validated OR skipped |
| 2. Parse & Generate | BNCS score exists AND content generated |
| 3. Images | At least 1 image uploaded OR skipped |
| 4. Review | User clicks "Looks Good" |
| 5. Publish | User clicks "Publish Game" |

### UX Behavior

- **Unpublished games**: Wizard auto-starts, can exit to tabs via "Exit to Advanced"
- **Published games**: Always show tab-based Advanced Editor
- **Wizard header**: Progress bar, step indicator, exit button
- **Progress persistence**: localStorage keyed by `wizard-progress-{gameId}`

---

## Recent Phases (29-34) - Summaries

> Full details: [PHASES-29-34.md](../archive/phases/PHASES-29-34.md)

| Phase | Summary |
|-------|---------|
| **34** | Admin Layout Unification - Sidebar pattern matching Games/Marketplace |
| **33** | Admin Codebase Cleanup - Shared hooks, component splits (RulebookEditor 66% smaller) |
| **32** | Rulebook Content Pipeline V2 - Content generation, parsed text storage, preview page |
| **31** | Admin Enhancements - BGG reference images, navigation fixes |
| **30** | Games Page UI Unification - Sidebar layout, prominent search bar |
| **29** | Legal Data Sourcing - 688 games imported, BNCS scoring, publisher rulebook pipeline |

---

## Archived Phases (21-28) - Marketplace Build

> Full details: [PHASES-21-28.md](../archive/phases/PHASES-21-28.md)

Complete marketplace implementation:
- Phase 21: Listings foundation
- Phase 22: Messaging system
- Phase 23: Offers & negotiation
- Phase 24: Stripe Connect payments
- Phase 25: Reputation & feedback
- Phase 26: Discovery & alerts
- Phase 27: Seller Dashboard V2
- Phase 28: UI/UX unification

---

## Earlier Phases (17-20) - Features

| Phase | Feature |
|-------|---------|
| **20** | Categories page - DB-driven with game counts |
| **19** | Games page Filter UI V2 - Collapsible sidebar, dynamic grid |
| **18** | Taxonomy system - Categories, Mechanics, Themes, Player Experiences, Complexity Tiers |
| **17** | Recommendation Engine - Wizard at `/recommend`, gamer archetypes, AI ranking |

---

## What's Live

### Core Features
- **35 games** in database (16 with full content + 19 pending)
- **Game Directory** with filter sidebar, search, pagination
- **Rules Summaries**, **Score Sheets** (PDF), **Quick Reference** for content-complete games
- **Your Shelf** - Track owned/wanted games with ratings
- **User Profiles** at `/u/[username]` with Top 10 games, insights, badges
- **Following System** + Activity Feed at `/feed`
- **Game Reviews** with aggregate ratings
- **Recommendation Engine** at `/recommend`

### Marketplace
- Full buy/sell/trade system with listings, messaging, offers
- Stripe Connect payments with escrow
- Reputation/feedback system
- Saved searches and wishlist alerts
- Seller Dashboard with sidebar layout

### Admin
- Game editor with Setup Wizard and Advanced Mode
- Rulebook parsing + BNCS generation
- AI content generation (rules, setup, reference)
- Publisher/Family/Taxonomy management
- Image upload with cropping (Cover 4:3, Hero 16:9, Gallery)

### Environments

| Branch | Deploys To | Database |
|--------|------------|----------|
| `develop` | Staging | Staging Supabase |
| `main` | Production | Production Supabase |

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for URLs, commands, and file locations.

---

## Database Migrations

45 migrations in `supabase/migrations/` covering:
- Core tables: games, categories, mechanics, awards
- User system: profiles, shelf, follows, activities, notifications
- Content: game content, images, families, relations
- Marketplace: listings, conversations, offers, transactions, feedback
- Taxonomy: themes, player experiences, complexity tiers
- Rulebook: BNCS scoring, parse logs

Recent migrations (46-49):
- `00046_data_source_tracking.sql` - Data provenance
- `00047_data_source_seed.sql` - Seed data enum
- `00048_rulebook_bncs.sql` - Rulebook parsing + BNCS
- `00049_rulebook_parsed_text.sql` - Parsed text storage

---

## Next Steps

### Content
- Upload images for all games via admin
- Generate content for pending games
- Import more games via Wikidata skill

### Future Features
- Local discovery (find gamers nearby, game nights)
- Enhanced profile stats
- Publisher partnerships for official data
