
## [2026-03-10 11:33:55] Audit kickoff
- Note: audit-code references/audit-framework.md missing in skill directory; proceeding with assumptions.

## [2026-03-10 11:36:12] Findings (initial)
- File: middleware.ts | Risk: P2 | Issue: Middleware logs all cookies and token length for every request; risk of leaking auth token to logs in production. | Fix: remove cookie logging or guard by NODE_ENV !== 'production', avoid logging token values.
- File: lib/source-cache.ts | Risk: P1 | Issue: getOrFetchSourceText skips cache only for status=ok; failed entries re-fetch on every request causing repeated external calls and potential rate-limit loops. | Fix: cache failed status with cooldown timestamp and skip re-fetch until TTL expires; or honor failed cache for a window.
- File: lib/source-cache.ts | Risk: P1 | Issue: No request de-duplication or concurrency control; simultaneous calls for same URL can trigger multiple fetches and upserts. | Fix: add in-memory lock or DB-based inflight marker, or dedupe by URL in request context.
- File: app/api/agent/*/by-date/*.ts | Risk: P1 | Issue: includeRaw missing fetch loop is sequential without time budget or per-request cap; can stall long requests for large missing lists. | Fix: enforce max missing URLs per request, add total timeout or concurrency-limited pool, and return partial results with rawStatus.
- File: app/api/source/route.ts + lib/source-cache.ts | Risk: P1 | Issue: URL validation only checks non-empty string; no scheme/domain checks, enabling unexpected behavior and SSRF via third-party fetchers. | Fix: validate http/https, reject localhost/private IPs if possible, or add allowlist.
- File: lib/md.ts | Risk: P2 | Issue: mdEscape only normalizes newlines; titles/fields can inject markdown or HTML if rendered unsafely. | Fix: escape markdown special chars in titles/fields or render with safe markdown settings; consider stripping HTML.

## [2026-03-10 11:38:49] Findings (runtime checks)
- File: .env | Risk: P2 | Issue: ACCESS_PASSWORD default is placeholder (your-access-password); runtime login with expected password (kedaya) fails unless env overridden. | Fix: set ACCESS_PASSWORD to expected value in local env for dev, or update .env/.env.example with correct default and document override.
- File: next.config.js | Risk: P3 | Issue: Next.js warns about workspace root due to multiple lockfiles; can affect output tracing. | Fix: set outputFileTracingRoot or remove extra lockfile outside repo if not needed.
## [2026-03-10 11:40:08] Findings (auth env validation)
- File: lib/env.ts | Risk: P1 | Issue: ACCESS_PASSWORD requires min length 8. Required login password is kedaya (6 chars) causing env validation failure in middleware and /api/auth/login returns 404. UI shows network error. | Fix: reduce minimum length to 6 or update password and documentation to an 8+ char value, and ensure env validation does not crash middleware.

## [2026-03-10 11:47:22] Findings (by-date + md routes)
- File: app/api/agent/content/by-date/route.ts + app/api/agent/adult-content/by-date/route.ts | Risk: P1 | Issue: includeRaw missing cache fetch is sequential without concurrency or total time budget; large missing lists can stall requests. | Fix: cap missing URLs per request, add total timeout and concurrency-limited pool, return partial rawStatus.
- File: app/api/agent/content/by-date/md/route.ts + app/api/agent/adult-content/by-date/md/route.ts | Risk: P1 | Issue: missing raw cache fetch is sequential and unbounded, could block markdown responses under high miss rate. | Fix: same as above; consider fetch on-demand per item and mark missing.
- File: lib/source-cache.ts + app/api/source/route.ts | Risk: P1 | Issue: URL validation only trims/min length; no scheme check or private network guard. Enables SSRF-style fetch via third-party fetchers. | Fix: enforce http/https, reject localhost/private IPs, optional allowlist.
- File: lib/md.ts | Risk: P2 | Issue: mdEscape only normalizes newlines; text fields can include markdown or HTML. Output is plain markdown but could be rendered unsafely elsewhere. | Fix: escape markdown special chars or ensure renderer uses safe mode and strips HTML.

## [2026-03-10 12:01:53] Findings (timezone/url validation review)
- File: lib/url-validate.ts | Risk: None | Note: normalizeAndValidateHttpUrl already enforces http/https, rejects credentials, private hostnames, and private IPv4. Prior SSRF finding is invalid.
- File: app/api/agent/*/by-date/*.ts + md routes | Risk: P2 | Issue: includeRaw fetch lacks total time budget and cap on missing URLs; mapLimit=3 limits concurrency but not total duration. | Fix: add per-request maxMissing and global timeout, return partial rawStatus if exceeded.
- File: lib/date.ts | Risk: None | Note: getShanghaiDayRange computes UTC instants for Asia/Shanghai day correctly (UTC+8, no DST).

## [2026-03-10 12:11:36] Fixes applied
- File: lib/source-cache.ts | Risk: P1 | Fix: add inflight dedupe for same URL and failed-cache cooldown (15 min) to prevent repeated failed re-fetches.
- File: app/api/agent/*/by-date/*.ts + md routes | Risk: P1 | Fix: cap missing raw fetches (max 20) and enforce 10s time budget with per-request timeout to avoid unbounded waits.
