# Architecture

Content Analyzer is a private Next.js App Router application backed by PostgreSQL through Prisma. Technical and adult content keep separate URLs and tables, but share query, route, presentation, and media behavior.

## Request flow

```text
Browser / agent
  -> middleware JWT cookie check
  -> App Router page or API route
  -> shared route handler / content API factory
  -> Prisma
  -> PostgreSQL
```

The home page server-renders the first 12 records. `ContentList` owns client filter and pagination state. Filters update the address bar with `history.replaceState`; they do not invoke a second App Router navigation. An IntersectionObserver requests the next API page before the user reaches the bottom, and the button remains as an accessible fallback.

## Main modules

- `lib/content-api-factory.ts` — shared Prisma operations, list filters, stable ordering, favorite and video-directory sources;
- `lib/content-route-handlers.ts` — validated collection, item, and favorite HTTP handlers;
- `lib/content-batch-handler.ts` — validated imports with bounded write concurrency;
- `components/ContentList.tsx` — filters, cancellation, retry, append-only pagination, and scroll prefetch;
- `components/MobileContentList.tsx` — content cards and background loading of the complete video directory;
- `components/ShortVideoPlayer.tsx` — one mounted video, swipe/wheel/keyboard switching, and persistent playback speed;
- `lib/media-display.ts` — pure media URL/type/feed rules shared by server and client;
- `lib/preview-media-service.ts` and `lib/persistent-media.ts` — media extraction and stored proxy URL reuse.

## API conventions

User-facing pagination returns `{ success, data, pagination }`. Validation and server failures return `{ success: false, error: { message, code } }`. Existing successful create/detail endpoints retain their raw-record response for compatibility. Content IDs are validated before Prisma access, delete is idempotent, and missing favorite targets return 404.

## Resource rules

- Prisma is a process singleton in development and one client per serverless runtime.
- Batch imports use six workers rather than opening one database operation per record.
- List queries select card fields only; full body text is reserved for detail endpoints.
- The video directory selects only `id`, `title`, and non-empty `mediaUrls`.
- Only the active short video is mounted; card media is intersection-observed and metadata-loaded.
- Pino logs in-process. No pretty transport worker is started by the application.

## Change checklist

When changing a list filter, update its Zod schema, shared `buildContentWhere` logic, API documentation, and tests together. When adding a route for one content model, decide whether it belongs in a shared handler before duplicating it for the other model. No database migration is required for UI, pagination, or media-directory changes.
