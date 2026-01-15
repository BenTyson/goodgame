# Documentation Index

> Quick navigation for all Boardmello documentation.

## Start Here (AI Agents)

Read these files in order:

1. **[README](session-start/README.md)** - 2-minute project overview
2. **[CURRENT-STATUS](session-start/CURRENT-STATUS.md)** - Current phase + what's live
3. **[DECISIONS](session-start/DECISIONS.md)** - Locked choices + gotchas (read this!)

## Reference

| Document | Purpose |
|----------|---------|
| [QUICK-REFERENCE](session-start/QUICK-REFERENCE.md) | Commands, file paths, types |
| [DEPLOYMENT](DEPLOYMENT.md) | Environment setup, Railway config |
| [STRIPE-SETUP](STRIPE-SETUP.md) | Stripe Connect integration |
| [EXPANSION-ROADMAP](EXPANSION-ROADMAP.md) | Future phases (TCGs, RPGs, etc.) |

## Archive

Historical documentation (reference only, may be outdated):

| Document | Contents |
|----------|----------|
| [VECNA-SPEC](archive/VECNA-SPEC.md) | Vecna pipeline spec (implemented) |
| [DATABASE](archive/DATABASE.md) | Database schema snapshot (use migrations as source of truth) |
| [PHASES-58-65](archive/phases/PHASES-58-65.md) | Game pages rebuild, ratings, purchase links |
| [PHASES-53-57](archive/phases/PHASES-53-57.md) | Parallel enrichment, Admin UI cleanup |
| [PHASES-39-52](archive/phases/PHASES-39-52.md) | Vecna implementation |
| [PHASES-35-38](archive/phases/PHASES-35-38.md) | Admin wizard, AI taxonomy, image cropper |
| [PHASES-29-34](archive/phases/PHASES-29-34.md) | Admin cleanup, rulebook pipeline |
| [PHASES-21-28](archive/phases/PHASES-21-28.md) | Marketplace build |

## Directory Structure

```
docs/
├── INDEX.md                    # This file
├── DEPLOYMENT.md               # Environment setup
├── EXPANSION-ROADMAP.md        # Future phases
├── STRIPE-SETUP.md             # Payment integration
├── session-start/              # AI agent onboarding (START HERE)
│   ├── README.md               # Quick start
│   ├── CURRENT-STATUS.md       # Current phase
│   ├── DECISIONS.md            # Locked decisions + gotchas
│   └── QUICK-REFERENCE.md      # Commands & paths
└── archive/                    # Historical (reference only)
```

## Source of Truth

Don't rely on archived docs for current state. Use these instead:

| Need | Source |
|------|--------|
| Database schema | `supabase/migrations/*.sql` |
| TypeScript types | `src/types/supabase.ts` (auto-generated) |
| Custom types | `src/types/database.ts` |
| Component patterns | Look at sibling files in same folder |
