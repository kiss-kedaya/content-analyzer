【中文化】\n# API Docs + OpenAPI Export + Agent Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add OpenAPI JSON export/download, simplify `/api-docs` with one-click curl copy, and add `/agent-skills` page for Agent usage.

**Architecture:** Introduce a lightweight single-source `ApiDocSpec` in `lib/api-doc-spec.ts`, then render `/api-docs` and `/agent-skills` from that spec and generate OpenAPI 3.1 JSON from it via `/api/openapi.json`.

**Tech Stack:** Next.js 15 App Router, TypeScript, TailwindCSS.

---

### Task 1: Create single-source API doc spec

**Files:**
- Create: `lib/api-doc-spec.ts`

**Step 1: Implement the spec types and data**
Create `lib/api-doc-spec.ts` exporting:
- `BASE_URLS` (prod + local)
- `cookieAuth` metadata (cookie name)
- `categories` (Auth, Content, Adult, Agent, Media, Misc)
- `endpoints[]` with:
  - `id`, `category`, `method`, `path`, `summary`
  - `authRequired` (boolean)
  - `curl` (string template, minimal)
  - optional `details` (query/body notes)
  - optional `responseExample`

Include at least these endpoints:
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`
- Content: `POST /api/content`, `GET /api/content`, `POST /api/content/batch`, `GET /api/content/paginated`, `GET /api/content/[id]`, `DELETE /api/content/[id]`, `POST|DELETE /api/content/[id]/favorite`
- Adult: same structure, note 409 on create duplicates
- Agent: `GET /api/agent/*` endpoints (by-date, by-date/md, :id/md)
- Media: `GET /api/source`, `GET /api/preview-media`, `POST /api/extract-media`, `GET /api/media-proxy`
- Misc: `GET /api/stats`, `GET /api/preferences/analyze`

**Step 2: Build verification**
Run:
- `npm run build`
Expected: build succeeds.

**Step 3: Commit**
Run:
- `git add lib/api-doc-spec.ts`
- `git commit -m "feat: add api doc spec as single source"`

---

### Task 2: Add OpenAPI 3.1 builder

**Files:**
- Create: `lib/openapi.ts`

**Step 1: Implement OpenAPI generator**
Create `buildOpenApiSpec()` that returns an object with:
- `openapi: "3.1.0"`
- `info` (title, version)
- `servers`: `https://ca.kedaya.xyz`, `http://localhost:3000`
- `components.securitySchemes.cookieAuth`:
  - type `apiKey`, in `cookie`, name `auth-token`
- `security`: default cookieAuth for endpoints where `authRequired=true`
- `paths`: generated from `endpoints[]` (summary + minimal schemas)

Keep schemas minimal:
- For JSON bodies, use `type: object` and document required fields in `description` if not modeling full JSON Schema.

**Step 2: Quick validation script (optional but recommended)**
Create: `scripts/validate-openapi.ts`
- Import `buildOpenApiSpec()`
- Ensure `openapi/info/paths` exist
- Output JSON to stdout when run

Run:
- `node -e "const { buildOpenApiSpec } = require('./lib/openapi'); console.log(JSON.stringify(buildOpenApiSpec(), null, 2).slice(0,200));"`
Expected: prints JSON without throwing.

**Step 3: Commit**
- `git add lib/openapi.ts scripts/validate-openapi.ts`
- `git commit -m "feat: add openapi spec generator"`

---

### Task 3: Add `/api/openapi.json` route for export/download

**Files:**
- Create: `app/api/openapi.json/route.ts`

**Step 1: Implement route**
- `GET` returns `buildOpenApiSpec()` JSON
- Add headers:
  - `Content-Type: application/json; charset=utf-8`
  - `Cache-Control: public, max-age=60`
  - `Content-Disposition: attachment; filename=\"openapi.json\"` unless `download=0`

**Step 2: Build verification**
Run:
- `npm run build`
Expected: build succeeds.

**Step 3: Commit**
- `git add app/api/openapi.json/route.ts`
- `git commit -m "feat: add openapi.json export endpoint"`

---

### Task 4: Add reusable copy button for code snippets

**Files:**
- Create: `components/CopyButton.tsx`

**Step 1: Implement CopyButton**
- Props: `text`, `label`, `copiedLabel`, `className?`, `size?`
- On click: `navigator.clipboard.writeText(text)`
- Show copied state for 2 seconds
- Keep styles minimal (Vercel-like)

**Step 2: Commit**
- `git add components/CopyButton.tsx`
- `git commit -m "feat: add reusable copy button"`

---

### Task 5: Simplify `/api-docs` page and add “copy curl” + “download openapi.json”

**Files:**
- Modify: `app/api-docs/page.tsx`

**Step 1: Refactor to use `ApiDocSpec`**
- Replace long prose with:
  - Top actions: Download openapi.json; Copy all curl
  - Compact endpoint list grouped by category
  - Each endpoint row has Copy curl and Toggle details

**Step 2: Ensure existing “copy markdown” is removed or de-emphasized**
- Keep page minimal; focus on curl and endpoint discovery.

**Step 3: Build verification**
Run:
- `npm run build`

**Step 4: Commit**
- `git add app/api-docs/page.tsx`
- `git commit -m "ui: simplify api-docs and add curl copy + openapi download"`

---

### Task 6: Add `/agent-skills` page

**Files:**
- Create: `app/agent-skills/page.tsx`

**Step 1: Implement page**
- Show Agent quickstart
- Show only Agent-related endpoints + Media helpers
- Provide:
  - Copy kit (a curated multi-command snippet)
  - Per-endpoint Copy curl

**Step 2: Build verification**
Run:
- `npm run build`

**Step 3: Commit**
- `git add app/agent-skills/page.tsx`
- `git commit -m "feat: add agent skills page"`

---

### Task 7: Final verification

Run:
- `npm run build`

Manual checks (browser):
- Visit `/api-docs` and verify copy buttons work
- Visit `/agent-skills` and verify copy kit works
- Visit `/api/openapi.json` and verify it downloads


