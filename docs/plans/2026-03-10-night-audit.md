【中文化】\n
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

## [2026-03-10 12:16:46] UX checks
- Flow: login + API 401 check | Result: /api/content without cookie returns 401; login via /api/auth/login success; home list renders.
- Flow: tab switch + sort | Result: switching to 成人内容 updates URL to tab=adult; sort select change to createdAt updates URL.
- Flow: detail + markdown + source modal | Result: detail page loads, copy markdown button works, source modal opens with fetch (jina).
- Flow: date picker | Result: clicking 选择日期 did not reveal input[type=date] in DOM; likely custom picker or hidden input not detected. Needs follow-up manual check in UI.
- Flow: video preview | Result: no video item tested in current dataset; requires manual verification with a content item containing video.
\n## [2026-03-10 12:54 Asia/Shanghai]\n- File: app/api/preview-media/route.ts\n  Risk: P1 (SSRF / untrusted URL fetch)\n  Issue: url query param is not validated before extraction; private host or non-http schemes could reach internal resources depending on extractor.\n  Fix: validate with normalizeAndValidateHttpUrl; reject private hosts, non-http/https; add allowlist for x.com/twitter if required.\n- File: app/api/extract-media/route.ts\n  Risk: P1 (SSRF / abuse)\n  Issue: POST body accepts arbitrary url/urls without validation or size limits; extractor may fetch untrusted targets.\n  Fix: validate each URL with normalizeAndValidateHttpUrl; enforce max batch size; reject invalid schemes; add request body size guard.\n- File: lib/source-cache.ts\n  Risk: P2 (force semantics / cache bypass)\n  Issue: inflight map ignores force option; force requests may reuse existing inflight promise from non-force fetch, reducing bypass expectations.\n  Fix: include force in inflight key or bypass inflight when force is true.\n
\n## [2026-03-10 12:55 Asia/Shanghai]\n- File: lib/media-extractor.ts\n  Risk: P1 (SSRF / abuse via yt-dlp)\n  Issue: extractTwitterMedia accepts any URL; no validation or allowlist; yt-dlp can access arbitrary hosts.\n  Fix: validate URL with normalizeAndValidateHttpUrl and enforce X/Twitter host allowlist; reject unsupported hosts; limit batch size.\n- File: app/api/extract-media/route.ts\n  Risk: P2 (resource abuse)\n  Issue: batch URLs size and total body length not bounded; retries per URL could amplify load.\n  Fix: enforce max urls length and body size; return 413/400 for excessive input.\n
## 2026-03-10 13:35:51
- [check] app/api/source/route.ts | Risk: P1 | /api/source caching & retries: inflight map prevents duplicate; failed TTL 15m OK. Verify failure recording: status=failed, text=error, lastFetchedAt stored. Potential issue: no explicit timeout override for getOrFetchSourceText when used in /api/source; uses 25s fetch timeout, ok. Consider exposing force param in response? none. 
- [check] lib/source-cache.ts | Risk: P2 | defuddle fallback errors: stores status=failed without provider selection for jina fail; ok but provider stays defuddle always; consider storing provider for failed state. No hard cap on inflight size, but keyed by URL. Missing: sanitize huge text? ok. 
- [check] lib/date.ts | Risk: P1 | Asia/Shanghai boundary computed via UTC offset; ok. Beware invalid date input: handled.
- [check] app/api/agent/content/by-date/route.ts | Risk: P1 | pageSize forced <=10 OK. includeRaw missing cache triggers fetch with time budget; no infinite loop. RawStatus 'missing' returned. Potential: missing respects includeRaw only; ok.
- [check] app/api/agent/content/by-date/md/route.ts | Risk: P1 | pageSize forced <=10 OK. If raws missing, fetch with time budget; ok. No infinite loop.
- [check] app/api/agent/content/[id]/md/route.ts | Risk: P2 | raw may be null; renderContentMarkdown should handle. Ensure content-type set ok.
- [check] app/api/agent/adult-content/by-date/route.ts | Risk: P1 | same as tech. 
- [check] app/api/agent/adult-content/by-date/md/route.ts | Risk: P1 | same as tech.

## [2026-03-10 16:30:12] Fixes (media URL validation + limits)
- File: app/api/preview-media/route.ts | Risk: P1 | Fix: validate URL with normalizeAndValidateHttpUrl and allowlist x.com/twitter.com before extraction; cache key normalized.
- File: app/api/extract-media/route.ts | Risk: P1 | Fix: validate URL(s) with normalizeAndValidateHttpUrl, normalize outputs, enforce max batch size (20).
- File: lib/media-extractor.ts | Risk: P1 | Fix: validate and allowlist x.com/twitter.com before yt-dlp fetch to reduce SSRF/abuse risk.


## [2026-03-10 17:47:05] Audit findings
- File: lib\\url-validate.ts | Risk: P1 | Issue: SSRF guard only checks IPv4 literals + hostname suffix; missing IPv6 literal checks and DNS rebinding protection (hostnames can resolve to private IPs). | Fix: resolve DNS (A/AAAA) and block private ranges; block IPv6 literals and IPv6 private ranges (fc00::/7, ::1, fe80::/10), consider allowlist or fetch via server-side proxy with strict egress.
- File: lib\\source-cache.ts | Risk: P2 | Issue: failed-cache TTL prevents retry for 15m, but failed responses store only error text; no recorded error type/status, makes triage harder and repeated failures less diagnosable. | Fix: store status code and provider in failed state; include retryAfter and lastErrorType.
- File: app\\api\\agent\\*\\by-date\\route.ts | Risk: P2 | Issue: pageSize forced to 10 OK, but page param accepts large values causing deep skip that may be expensive. | Fix: add upper bound on page (e.g. max 100 or max skip) or use cursor-based pagination.
- File: app\\api\\agent\\*\\by-date\\md\\route.ts | Risk: P3 | Issue: missing raw cache items trigger fetch; time budget 10s but no explicit response field for "partial"; consumers may assume full coverage. | Fix: include rawStatus summary in markdown header or response metadata; consider exposing missing count.
- File: lib\\promise-pool.ts | Risk: P3 | Issue: no per-task try/catch inside worker; exception bubbles, aborts all workers. | Fix: wrap fn in try/catch and store error sentinel or allow caller to provide onError.
- File: middleware.ts | Risk: P3 | Issue: matcher excludes asset extensions but not other public paths; OK for /api 401 behavior; ensure non-api redirect works. | Fix: ensure public files in /public with extensions are excluded, and add robots.txt or manifest if needed.
- File: lib\\date.ts | Risk: P3 | Issue: date string does not validate month/day ranges; 2026-13-99 becomes valid and produces unintended UTC date. | Fix: validate real calendar date (construct date and compare components) before using.
- File: app\\api\\source\\route.ts | Risk: P2 | Issue: for force=1, inflight map still dedupes; but if force used to bypass failed-cache, inflight may return cached rejected? | Fix: include force in inflight key or bypass inflight when force true.
- File: lib\\source-cache.ts | Risk: P2 | Issue: inflight map keyed by normalized URL; simultaneous callers with force true still dedupe; not a bug but may surprise; also fetchText has no response size limit. | Fix: consider max response size guard and optional force bypass in inflight.

### Notes
- audit-framework.md reference missing in skill folder; performed best-effort audit without it.

## [2026-03-10 17:53:17] UX/logic findings
- File: app\\page.tsx + components\\ContentList.tsx | Risk: P1 | Issue: tab switch showed adult records while tab=tech; likely due to SSR payload mismatch or client state divergence from searchParams. Possible cause: ContentList state not reset when initialTab changes via URL; also adult/tech endpoints may both include adult items. | Fix: verify server filtering; on client, clear contents when tab changes and fetch first page for new tab; ensure API routes enforce content-type separation.
- File: components\\ContentList.tsx | Risk: P2 | Issue: IntersectionObserver triggers loadMore without guarding against stale tab data; loadMore uses current state but does not cancel in-flight when tab/order/date changes; can append wrong list or mix content. | Fix: cancel in-flight fetch on dependency change; use AbortController and track requestId; reset lists when tab/order/date changes.
- File: components\\ContentList.tsx | Risk: P2 | Issue: date filter changes trigger fetchSortedData but does not clear existing list before loading; can cause UI flash with stale rows. | Fix: clear contents on date change before fetching.
- File: components\\ContentTable.tsx | Risk: P3 | Issue: preview hover loads media with force fetch on click and hover; no rate limit, can cause repeated extraction on table hover. | Fix: add debounce and global hover cache TTL or disable hover on low power.
- File: components\\SourceModal.tsx | Risk: P3 | Issue: copy button fails silently; user receives no feedback. | Fix: add toast or temporary label.
- File: components\\DatePicker.tsx | Risk: P3 | Issue: click outside does not close; no Escape handling. | Fix: add click-away and keydown listeners.
- File: components\\ContentList.tsx | Risk: P2 | Issue: loadMore uses pageSize 20 or 10 but API by-date enforces max 10. For non-date pagination, server allows more; but for date filter always 10. If pageSize mismatch (20) with API ignoring, may misalign pagination. | Fix: keep constants aligned with API enforcement (10) or add server response pageSize.
- File: components\\ContentTable.tsx | Risk: P2 | Issue: preview hover auto-play in HoverVideoPreview uses muted + playsInline but no controls; on mobile this could fail silently; open modal required for controls. | Fix: indicate "点击预览" and disable hover on touch devices.
- File: components\\ContentTable.tsx | Risk: P3 | Issue: preview button and hover use same URL; if URL is not from x.com, preview API rejects; UI shows no explanation. | Fix: detect unsupported hosts and show tooltip.
- File: UI runtime | Risk: P2 | Issue: Garbled text observed in tech tab rows indicates encoding mismatch or wrong decode path, likely from data ingestion. | Fix: enforce UTF-8 decode on ingestion; sanitize storage encoding and add heuristic re-encode if invalid.


