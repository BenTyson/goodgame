# Documentation Index

> Quick navigation for all Board Nomads documentation.

## Start Here (AI Agents)

Read these files in order:

1. **[README](session-start/README.md)** - 2-minute project overview
2. **[CURRENT-STATUS](session-start/CURRENT-STATUS.md)** - Current phase + what's live
3. **[DECISIONS](session-start/DECISIONS.md)** - Locked choices (don't re-debate)

## Reference

| Document | Purpose |
|----------|---------|
| [QUICK-REFERENCE](session-start/QUICK-REFERENCE.md) | Commands, file paths, types |
| [DATABASE](architecture/DATABASE.md) | Full PostgreSQL schema |
| [DEPLOYMENT](DEPLOYMENT.md) | Environment setup, Railway config |
| [STRIPE-SETUP](STRIPE-SETUP.md) | Stripe Connect integration |

## Plans & Roadmaps

| Document | Purpose |
|----------|---------|
| [VECNA-SPEC](VECNA-SPEC.md) | **Automated content pipeline** - Full spec for Vecna implementation |
| [EXPANSION-ROADMAP](EXPANSION-ROADMAP.md) | Future phases (TCGs, RPGs, etc.) |
| [MARKETPLACE-PAYMENTS-UX](plans/MARKETPLACE-PAYMENTS-UX.md) | Payment UX improvements |

## Archive

Historical documentation for reference:

| Document | Contents |
|----------|----------|
| [PHASES-35-38](archive/phases/PHASES-35-38.md) | Admin wizard, AI taxonomy, image cropper |
| [PHASES-29-34](archive/phases/PHASES-29-34.md) | Admin cleanup, rulebook pipeline, data sourcing |
| [PHASES-21-28](archive/phases/PHASES-21-28.md) | Marketplace build (8 phases) |
| [AGENT-WORKFLOW](archive/deprecated/AGENT-WORKFLOW.md) | Git workflow template (superseded by DEPLOYMENT.md) |

## Directory Structure

```
docs/
├── INDEX.md                    # This file
├── VECNA-SPEC.md               # Automated content pipeline spec
├── DEPLOYMENT.md               # Environment setup
├── EXPANSION-ROADMAP.md        # Future phases
├── STRIPE-SETUP.md             # Payment integration
├── session-start/              # AI agent onboarding
│   ├── README.md               # Quick start
│   ├── CURRENT-STATUS.md       # Current phase
│   ├── DECISIONS.md            # Locked decisions
│   └── QUICK-REFERENCE.md      # Commands & paths
├── architecture/
│   └── DATABASE.md             # Schema documentation
├── plans/
│   └── MARKETPLACE-PAYMENTS-UX.md
└── archive/
    ├── phases/                 # Historical phase details
    └── deprecated/             # Superseded docs
```
