
## [2026-03-10 11:33:55] Audit kickoff
- Note: audit-code references/audit-framework.md missing in skill directory; proceeding with assumptions.

## [2026-03-10 11:36:12] Findings (initial)
- File: middleware.ts | Risk: P2 | Issue: Middleware logs all cookies and token length for every request; risk of leaking auth token to logs in production. | Fix: remove cookie logging or guard by NODE_ENV !== 'production', avoid logging token values.
- File: lib/source-cache.ts | Risk: P1 | Issue: getOrFetchSourceText skips cache only for status=ok; failed entries re-fetch on every request causing repeated external calls and potential rate-limit loops. | Fix: cache failed status with cooldown timestamp and skip re-fetch until TTL expires; or honor failed cache for a window.
- File: lib/source-cache.ts | Risk: P1 | Issue: No request de-duplication or concurrency control; simultaneous calls for same URL can trigger multiple fetches and upserts. | Fix: add in-memory lock or DB-based inflight marker, or dedupe by URL in request context.
- File: app/api/agent/*/by-date/*.ts | Risk: P1 | Issue: includeRaw missing fetch loop is sequential without time budget or per-request cap; can stall long requests for large missing lists. | Fix: enforce max missing URLs per request, add total timeout or concurrency-limited pool, and return partial results with rawStatus.
- File: app/api/source/route.ts + lib/source-cache.ts | Risk: P1 | Issue: URL validation only checks non-empty string; no scheme/domain checks, enabling unexpected behavior and SSRF via third-party fetchers. | Fix: validate http/https, reject localhost/private IPs if possible, or add allowlist.
- File: lib/md.ts | Risk: P2 | Issue: mdEscape only normalizes newlines; titles/fields can inject markdown or HTML if rendered unsafely. | Fix: escape markdown special chars in titles/fields or render with safe markdown settings; consider stripping HTML.
