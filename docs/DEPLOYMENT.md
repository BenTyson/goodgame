# Deployment Guide

## Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Production** | `main` | https://boardnomads.com | Live site |
| **Staging** | `develop` | https://goodgame-staging-staging.up.railway.app | Testing & preview |

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

## Railway Configuration

### Project: Good Game

**Production Environment:**
- Service: `goodgame`
- Domain: boardnomads.com
- Branch trigger: `main`

**Staging Environment:**
- Service: `goodgame-staging`
- Domain: goodgame-staging-staging.up.railway.app
- Branch trigger: `develop`

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

## Environment Variables

Both environments share the same Supabase project. Key differences:

| Variable | Production | Staging |
|----------|------------|---------|
| `NEXT_PUBLIC_SITE_NAME` | Good Game | Good Game (Staging) |
| `NEXT_PUBLIC_SITE_URL` | https://boardnomads.com | https://goodgame-staging-staging.up.railway.app |

## Supabase Configuration

**Important:** Add the staging URL to Supabase Auth redirect URLs:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to "Redirect URLs":
   - `https://goodgame-staging-staging.up.railway.app/**`

## Troubleshooting

### Staging not deploying

Check that the GitHub repo is connected and branch trigger is set to `develop`:
1. Go to Railway Dashboard → Good Game project
2. Click on staging environment
3. Click on goodgame-staging service
4. Go to Settings → Source
5. Set "Branch" to `develop`

### OAuth not working on staging

Add staging URL to:
1. Supabase Auth redirect URLs (see above)
2. Google OAuth Console authorized redirect URIs
