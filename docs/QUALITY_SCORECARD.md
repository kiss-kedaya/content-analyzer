# Quality scorecard

This project uses a 100-point review. The score is based on source, automated checks, and production behavior; a passing command alone is not sufficient evidence.

## Scoring method

Each category contains five criteria worth four points each:

- 4 — complete implementation with production or automated evidence, including failure paths;
- 3 — primary path is sound, with a limited edge-case or consistency gap;
- 2 — usable but incomplete, duplicated, or carrying a visible reliability risk;
- 1 — partial implementation only;
- 0 — missing or broken.

### 1. UI and visual consistency — 20

1. semantic theme tokens and light/dark parity;
2. information hierarchy, typography, and readable line length;
3. component, spacing, radius, and icon consistency;
4. 375 / 768 / 1440 responsive layouts without horizontal overflow;
5. media, loading, empty, error, and destructive states.

### 2. UX, accessibility, and continuity — 20

1. predictable navigation and preserved list/filter state;
2. loading without unnecessary document or RSC navigation;
3. 44px primary touch targets and visible interaction feedback;
4. keyboard operation, accessible names, focus management, and zoom support;
5. recoverable errors, reduced motion, stable layout, and no hydration warnings.

### 3. Backend, API, and security — 20

1. validated request contracts and consistent status/error responses;
2. shared query semantics, deterministic ordering, and data integrity;
3. authentication, constant-time credential checks, and login throttling;
4. outbound URL/media boundaries, timeouts, caching, and SSRF controls;
5. structured logs, idempotent operations, safe headers, and dependency audit.

### 4. Structure, typing, and readability — 20

1. shared implementation for technical/adult content without copy-paste routes;
2. strict TypeScript at API/UI boundaries and limited documented escape hatches;
3. cohesive files and functions with clear responsibility;
4. removal of dead code, stale score logic, noisy logging, and unused dependencies;
5. current architecture, API, environment, and operational documentation.

### 5. Testing, performance, and operations — 20

1. unit tests for parsing, filtering, persistence, and security helpers;
2. route/integration tests for validation and failure responses;
3. browser verification of pagination, themes, navigation, and video playback;
4. bounded database/network work, lazy media, stable list append, and small bundles;
5. CI gates for install, lint, tests, build, and dependency audit.

## Mandatory gates

The project cannot score 80 or higher when any of these are true:

- lint, tests, production build, or high-severity dependency audit fails;
- a normal production path logs an unhandled exception or hydration error;
- loading another page causes a document/RSC navigation or loses scroll position;
- the short-video count is limited to the currently rendered content page;
- a confirmed critical/high vulnerability remains open;
- the 375px layout has horizontal overflow or hides primary controls.

## Required evidence

```text
npm run lint
npm test
npm run build
npm audit --registry=https://registry.npmjs.org --audit-level=high
```

Browser verification must cover 375px mobile and 1440px desktop, light and dark themes, keyboard focus, list auto-loading, video count/switching, and console errors. Scores record the commit and production deployment being reviewed.

## Baseline

An independent read-only review scored production commit `c30e3d3` at 72/100. The decisive gaps were duplicate RSC/API pagination requests, no automatic pagination, page-limited video count, incomplete touch targets, inconsistent API validation/error handling, missing CI, permissive CORS, missing security headers, and no login throttling.

## Independent review — 2026-07-19

The same reviewer re-scored implementation commit `282857b`, deployed as Vercel deployment `E9LJWgFciw6DtRzsc61TsUDzzQw4`, without using a repository scoring script.

| Category | Baseline | Current | Review evidence |
| --- | ---: | ---: | --- |
| UI and visual consistency | 16 | 17 | Light/dark tokens and 375/768/1440 layouts are consistent; recoverable media failures can still create console noise. |
| UX, accessibility, and continuity | 14 | 18 | Click and intersection loading append in place, live totals update without RSC navigation, the video player uses the full feed, and visible controls meet the touch/accessibility checks. |
| Backend, API, and security | 14 | 17 | Shared validated handlers, bounded batch work, constant-time login checks, throttling, security headers, and corrected CORS are in place. |
| Structure, typing, and readability | 15 | 17 | Duplicate routes and stale state/components were removed, shared services were extracted, and architecture documentation was added. |
| Testing, performance, and operations | 13 | 16 | 47 tests, lint, production build, dependency audit, browser verification, and CI gates pass; automated browser E2E is still missing. |
| **Total** | **72** | **85** | **Passes the 80-point target and every mandatory gate.** |

Final browser evidence on `https://ca.kedaya.xyz`:

- 375px dark mode over Fast 4G rendered 12 initial cards without horizontal overflow or unnamed visible controls;
- scrolling to the bottom appended cards from 12 to 24 without a document/RSC request, URL mutation, or lost scroll position;
- the full adult video directory returned 51 items and the player displayed `1 / 51` while mounting one video;
- replacing the undersized streaming fallback with a layout-matched skeleton reduced observed initial CLS from `0.119` to `0`;
- Lighthouse snapshot scores were Accessibility 100, Best Practices 100, and Agentic Browsing 100.

Remaining improvement space: add automated browser E2E coverage, move login throttling to shared storage if this becomes a multi-user deployment, tighten CSP beyond `unsafe-inline`, and split the remaining large legacy media/parser modules.
