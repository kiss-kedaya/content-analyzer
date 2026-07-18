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
```

Quality checks:

```bash
npm test
npm run lint
npm run build
```

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
