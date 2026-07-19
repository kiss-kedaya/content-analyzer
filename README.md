# Content Analyzer

Personal content bookmark and media archive built with Next.js, Prisma, Neon,
and Vercel. Content is stored as submitted and displayed newest first. The
application does not generate AI scores or summaries.

## Features

- Separate regular and sensitive-content collections
- X bookmark import with deterministic sensitive-content routing
- Search, date filters, favorites, media preview, and unavailable-media cleanup
- Cookie authentication and documented JSON APIs
- Light and dark themes with responsive navigation

## Development

```bash
npm install
npm run dev
```

Required environment variables:

```env
DATABASE_URL="postgresql://..."
ACCESS_PASSWORD="your-password"
JWT_SECRET="at-least-32-characters"
# Optional: enables official X API media variant lookup on cache misses
X_API_BEARER_TOKEN="your-x-api-app-bearer-token"
```

Quality checks:

```bash
npm test
npm run test:e2e
npm run lint
npm run build
npm audit --registry=https://registry.npmjs.org --audit-level=high
```

Architecture and review rules:

- [Architecture](docs/ARCHITECTURE.md)
- [100-point quality scorecard](docs/QUALITY_SCORECARD.md)

## Import X bookmarks

Save an X API bookmarks response as JSON, then run:

```bash
npm run import:x-bookmarks -- .local/x-bookmarks.json dry-run
npm run import:x-bookmarks -- .local/x-bookmarks.json
```

The importer:

- preserves the original post text;
- uses `possibly_sensitive` to select the target collection;
- sends legacy `summary` and `score` compatibility values without AI;
- uploads at most 100 records per request;
- authenticates with `CONTENT_ANALYZER_PASSWORD` or `ACCESS_PASSWORD`.
- persists X media URLs when the input response includes
  `attachments.media_keys` and `media.fields=media_key,type,url,preview_image_url,variants,width,height`.

Local payloads under `.local/` are ignored by Git.

## API

Create or update a record:

```bash
curl -X POST https://ca.kedaya.xyz/api/content \
  -H "Content-Type: application/json" \
  -b "auth-token=<token>" \
  -d '{"source":"X","url":"https://x.com/user/status/123","content":"original text"}'
```

Regular and adult batch endpoints accept arrays of up to 100 records:

- `/api/content/batch`
- `/api/adult-content/batch`

Interactive documentation is available at `https://ca.kedaya.xyz/api-docs`.
The unauthenticated readiness endpoint is `GET /api/health`; it reports `503`
when the database is unavailable.
