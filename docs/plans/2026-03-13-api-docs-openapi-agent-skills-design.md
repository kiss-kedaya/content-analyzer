# API Docs + OpenAPI Export + Agent Skills Implementation Design

**Date:** 2026-03-13

## Goals

1. Make `/api-docs` simpler and faster to use.
2. Add one-click copy for curl examples (per-endpoint and “copy all”).
3. Add OpenAPI JSON export/download endpoint: `/api/openapi.json`.
4. Add a new Agent-oriented page: `/agent-skills`.

## Non-Goals

- No embedded Swagger UI / Redoc.
- No automatic reflection-based route parsing.
- No broad refactor of API response formats.

## Constraints

- Next.js App Router.
- Auth is enforced by `middleware.ts` (all routes except `/login` and `/api/auth/login`).
- Keep docs consistent with existing route behaviors.
- Keep UI style minimal and Vercel-like.

## Proposed Approach (Recommended)

Use a lightweight single-source spec:

- Create `lib/api-doc-spec.ts` containing a small `ApiDocSpec` describing:
  - Categories (Auth, Content, Adult, Agent, Media, Misc)
  - Endpoints: method, path, summary, curl template, optional details

Then:

- `/api-docs` renders from this spec (compact list by default).
- `/agent-skills` renders from the same spec, but only Agent-related endpoints + suggested usage.
- `/api/openapi.json` generates an OpenAPI 3.1 document from the same spec.

This prevents docs drift (page vs markdown vs openapi) without over-engineering.

## UI Design

### `/api-docs`

- Header actions:
  - Download `openapi.json`
  - Copy all curl
- Endpoint list:
  - One line per endpoint: `METHOD` + `path` + summary
  - Buttons: Copy curl, Toggle details
- Details (collapsed by default):
  - Query/body hints
  - Example response (only for the most important endpoints)

### `/agent-skills`

- A short “Agent quickstart”:
  - Login -> keep cookie
  - by-date pagination
  - markdown aggregation
  - source fetch
  - media preview (with persist)
- A curated endpoint list with “Copy curl” and “Copy kit” buttons.

## OpenAPI JSON Export

- Route: `GET /api/openapi.json`
- Default behavior: return JSON
- With download behavior: set `Content-Disposition: attachment; filename="openapi.json"`

OpenAPI document characteristics:

- `openapi: 3.1.0`
- `info.title = "Content Analyzer API"`
- `servers` includes `https://ca.kedaya.xyz` and `http://localhost:3000`.
- Define `cookieAuth` security scheme:
  - type: apiKey
  - in: cookie
  - name: auth-token
- Mark all endpoints as requiring auth except `/api/auth/login`.

## Verification

- `npm run build` must pass.
- Manual smoke checks:
  - `/api-docs` renders and copy buttons work.
  - `/agent-skills` renders and copy buttons work.
  - `/api/openapi.json` returns valid JSON and downloads.

## Work Items

1. Build spec file: `lib/api-doc-spec.ts`.
2. Add OpenAPI builder: `lib/openapi.ts`.
3. Add route: `app/api/openapi.json/route.ts`.
4. Create reusable copy button for code blocks/curl snippets.
5. Refactor `/api-docs` to be compact + use spec.
6. Add `/agent-skills` page.
