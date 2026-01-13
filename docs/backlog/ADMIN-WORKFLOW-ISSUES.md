# Admin Workflow Issues Backlog

> Created: 2026-01-13 (Phase 74 review)
> Source: Comprehensive review of `/admin/import` and `/admin/vecna`

These 22 issues were identified during a full workflow review from an admin perspective handling hundreds of games. Organized by priority tier.

---

## Tier A: Workflow Blockers (4 issues)

High-impact issues that block or significantly impede admin workflows.

| Issue | Location | Implementation Notes |
|-------|----------|---------------------|
| No batch resume | Vecna | Store checkpoint in localStorage, add "Resume from game N" button |
| No pause/resume for imports | Import | Add import state to DB, allow tab close without losing progress |
| Session timeout vulnerability | Both | Use background jobs instead of SSE for 30+ min operations |
| Rulebook discovery is manual | Vecna | Add automated publisher URL patterns, web search integration |

---

## Tier B: Scale Improvements (5 issues)

Issues that become painful at 100+ games scale.

| Issue | Location | Implementation Notes |
|-------|----------|---------------------|
| Sequential BGG API calls | Import | Can't parallelize (BGG rate limit), but document expected time better |
| Vecna processing time | Vecna | Background queue with email on completion for large batches |
| No progress checkpointing | Vecna | Save state to DB after each game completes |
| Sidebar doesn't virtualize | Vecna | Use `@tanstack/react-virtual` for 100+ game families |
| No multi-family batch | Vecna | Queue multiple families, process sequentially |

---

## Tier C: Data Quality (2 issues)

Issues that could affect data integrity.

| Issue | Location | Implementation Notes |
|-------|----------|---------------------|
| Reimplementation year validation too strict | Import | Make it a warning, not a skip (BGG data has errors) |
| Slug collision not handled gracefully | Import | Add UUID suffix if all numeric suffixes exhausted |

---

## Tier D: Error Resilience (4 issues)

Issues related to error handling and recovery.

| Issue | Location | Implementation Notes |
|-------|----------|---------------------|
| No automatic retry on transient failures | Vecna | 3 retries with exponential backoff for network errors |
| SSE connection has no reconnection logic | Vecna | Auto-reconnect on disconnect, resume from last event ID |
| No rollback to previous published state | Vecna | Add "Unpublish" with state revert capability |
| No estimated time accuracy | Import | Track historical averages, use for realistic estimates |

---

## Tier E: UX Polish (7 issues)

Minor friction points and UX improvements.

| Issue | Location | Implementation Notes |
|-------|----------|---------------------|
| Search button disabled | Import | Implement BGG name search or remove the button entirely |
| Model selection scattered | Vecna | Consolidate to single settings location |
| Blocked games not visually grouped | Vecna | Add "Blocked (N)" collapsible section at top of sidebar |
| No task size indication | Vecna | Show "~2 min/game" estimate based on historical data |
| Rulebook upload has no preview | Vecna | Show first page thumbnail after upload |
| End-of-pipeline games show no action | Vecna | Show "Complete" state with link to game page |
| No import history/audit log | Import | Add `import_log` table, show recent imports in UI |

---

## Completed (Phase 74)

These issues were fixed in Phase 74:

1. **Relation mode inconsistency** - Updated UI descriptions to clarify behavior differences
2. **Fan filtering inconsistency** - Documented in UI that filtering only applies to "All Relations" mode
3. **Duplicate game input allowed** - Added auto-deduplication with warning message
4. **Family context staleness** - Auto-invalidates expansions when base game regenerated
5. **Error messages too technical** - Added user-friendly error mapping with suggestions

---

## How to Use This Backlog

1. Pick issues by tier (A = highest priority)
2. Each issue is scoped to ~1-3 hours
3. After completing, move to "Completed" section with phase number
4. Update CURRENT-STATUS.md with implementation details
