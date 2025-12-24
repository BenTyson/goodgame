# Deployment Guide

## Environment Overview

| Environment | Branch | URL | Database |
|-------------|--------|-----|----------|
| **Local** | `develop` | http://localhost:3399 | Staging Supabase |
| **Staging** | `develop` | https://goodgame-staging-staging.up.railway.app | Staging Supabase |
| **Production** | `main` | https://boardnomads.com | Production Supabase |

## Database Separation

Local and staging share a database, production is isolated:

```
┌─────────────────────────────────────────────────────────┐
│                   STAGING SUPABASE                       │
│              ndskcbuzsmrzgnvdbofd.supabase.co           │
│                                                          │
│   Used by: localhost + Railway staging                   │
│   Purpose: Safe testing, can reset data                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  PRODUCTION SUPABASE                     │
│              jnaibnwxpweahpawxycf.supabase.co           │
│                                                          │
│   Used by: Railway production only                       │
│   Purpose: Live user data, protected                     │
└─────────────────────────────────────────────────────────┘
```

## Branch Strategy

```
develop (default) ─────────────────────► staging deploys automatically
                        │
                        │ PR to main
                        ▼
main ─────────────────────────────────► production deploys automatically
```

### Rules

1. **Never push directly to `main`** - Always use PRs
2. **`develop` is the default working branch** - All work happens here
3. **PRs are for controlled deployments** - Review before going live

---

## Daily Workflow

### Start of Session

```bash
# Verify you're on develop
git branch

# If not on develop
git checkout develop

# Pull latest
git pull origin develop
```

### During Work

```bash
# Make changes
git add .
git commit -m "Description of changes"
git push origin develop
```

This automatically deploys to staging.

### Deploy to Production

1. Go to: https://github.com/BenTyson/goodgame/compare/main...develop
2. Create a Pull Request
3. Review changes
4. Merge to deploy to production

Or via CLI (when user explicitly requests):

```bash
git checkout main
git merge develop
git push origin main
git checkout develop
```

---

## Railway Configuration

### Project: Good Game

**Production Environment:**
- Service: `goodgame`
- Domain: boardnomads.com
- Branch trigger: `main`
- Database: Production Supabase

**Staging Environment:**
- Service: `goodgame-staging`
- Domain: goodgame-staging-staging.up.railway.app
- Branch trigger: `develop`
- Database: Staging Supabase

### Manual Deployment

```bash
# Deploy to staging
railway environment staging
railway service goodgame-staging
railway up

# Deploy to production (avoid - use PRs instead)
railway environment production
railway service goodgame
railway up
```

### View Logs

```bash
# Staging logs
railway environment staging && railway service goodgame-staging && railway logs

# Production logs
railway environment production && railway service goodgame && railway logs
```

---

## Environment Variables

### Local (`.env.local`)

```bash
# Staging Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ndskcbuzsmrzgnvdbofd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3399
NEXT_PUBLIC_SITE_NAME=Board Nomads

# Admin
ADMIN_EMAILS=your-email@gmail.com
```

### Railway Staging

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://ndskcbuzsmrzgnvdbofd.supabase.co |
| `NEXT_PUBLIC_SITE_URL` | https://goodgame-staging-staging.up.railway.app |
| `NEXT_PUBLIC_SITE_NAME` | Good Game (Staging) |

### Railway Production

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://jnaibnwxpweahpawxycf.supabase.co |
| `NEXT_PUBLIC_SITE_URL` | https://boardnomads.com |
| `NEXT_PUBLIC_SITE_NAME` | Good Game |

---

## Supabase Configuration

### Staging Supabase (`ndskcbuzsmrzgnvdbofd`)

**Authentication → URL Configuration:**
- Site URL: `https://goodgame-staging-staging.up.railway.app`
- Redirect URLs:
  - `http://localhost:3399/**`
  - `https://goodgame-staging-staging.up.railway.app/**`

**Google OAuth Callback:**
```
https://ndskcbuzsmrzgnvdbofd.supabase.co/auth/v1/callback
```

### Production Supabase (`jnaibnwxpweahpawxycf`)

**Authentication → URL Configuration:**
- Site URL: `https://boardnomads.com`
- Redirect URLs:
  - `https://boardnomads.com/**`

**Google OAuth Callback:**
```
https://jnaibnwxpweahpawxycf.supabase.co/auth/v1/callback
```

---

## Database Migrations

When adding new migrations:

```bash
# Push to staging database (linked by default)
npx supabase db push

# To push to production, temporarily re-link:
npx supabase link --project-ref jnaibnwxpweahpawxycf
npx supabase db push
npx supabase link --project-ref ndskcbuzsmrzgnvdbofd  # Switch back to staging
```

---

## Troubleshooting

### Staging not deploying

1. Go to Railway Dashboard → Good Game project
2. Click on staging environment
3. Click on goodgame-staging service
4. Go to Settings → Source
5. Verify "Branch" is set to `develop`

### OAuth not working

Check redirect URLs in:
1. Supabase Auth settings (see above)
2. Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs

### Database connection issues

Verify environment variables match the correct Supabase project:
- Staging/Local → `ndskcbuzsmrzgnvdbofd`
- Production → `jnaibnwxpweahpawxycf`
