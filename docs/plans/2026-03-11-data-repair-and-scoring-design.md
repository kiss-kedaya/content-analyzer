# Data Repair + Adult Reclassification + AI Re-Analysis (Design)

Date: 2026-03-11

## Goals

1. Fix hover preview tooltip positioning so it never renders outside viewport first and then jumps.
2. Detect when "tech" content is actually adult-restricted (login wall / age restriction) and reclassify to AdultContent.
3. Re-fetch source text for all links (Content + AdultContent) with a robust provider fallback:
   - Try r.jina.ai first
   - If network/empty/too-short/restricted text then fallback to defuddle.md
4. Run AI re-analysis on the fetched body to generate:
   - title
   - summary
   - score (0-10, 1 decimal)
   - also update analyzedBy to "@username" for X links
5. 5-concurrency worker pool for throughput and stable resource usage.

## Non-goals

- Adding new DB schema fields (author/username). We will reuse analyzedBy.
- Reclassifying AdultContent back to Content in this iteration.
- Adding new UI filters beyond requested items.

## Provider selection policy

### Primary provider
- r.jina.ai (via existing source fetch path)

### Fallback provider
- defuddle.md

### Failure / fallback triggers
Any of these triggers forces defuddle fallback:
- HTTP failure / timeout
- body too short (default threshold: 120 chars)
- restricted/login-wall text detected (keyword match)

Restricted keyword set (English, deterministic):
- "Age-restricted adult content"
- "This content might not be appropriate for people under 18 years old"
- "you’ll need to log in"
- "To view this media, you’ll need to log in"

## Adult reclassification policy

If defuddle is used due to restricted/login-wall triggers and the record currently lives in Content:
- Migrate Content -> AdultContent in a transaction:
  - create adultContent
  - delete content

## Username extraction policy

If URL matches X / Twitter status pattern:
- Extract username from hostname (x.com or twitter.com) + path '/<username>/status/<id>'
- Store analyzedBy as '@<username>'

Other platforms:
- Leave analyzedBy as-is for now

## AI scoring and generation policy

Model: Cloudflare Workers AI GLM-4.7-flash

### Output format
Require strict JSON output:

```json
{
  "title": "...",
  "summary": "...",
  "score": 7.8,
  "score_breakdown": {
    "density": 2.0,
    "actionability": 2.0,
    "credibility": 1.0,
    "clarity": 1.8
  },
  "flags": ["adult_restricted"]
}
```

### Score dimensions
Total score = density(0-3) + actionability(0-3) + credibility(0-2) + clarity(0-2)

### Hard caps
- If body is mostly login-wall/restricted template: score <= 2.0
- If body too short / empty: score <= 1.0

## Hover preview positioning

Implement precomputed positioning on hover:
- On hover enter, compute anchor rect
- Compute expected tooltip rect (fixed width/height)
- Clamp within viewport padding
- Pass explicit top/left to HoverVideoPreview
- Avoid initial off-screen render by not rendering until coordinates are computed

## Script design

Create a new script:
- scripts/reanalyze-and-reclassify.js

Capabilities:
- Dry-run mode
- 5 concurrency pool
- Backup before mutation (reuse existing backup strategy)
- Progress + final report (counts of:
  - total processed
  - migrated to AdultContent
  - jina successes
  - defuddle fallbacks
  - AI successes / failures
  - average latency)

## UI changes

- Rename column header "分析者" -> "用户名"
- Continue using the same underlying field analyzedBy

## Testing

- Unit-test username extraction helper
- Spot-check:
  - A restricted X url -> falls back to defuddle, migrates to adult
  - Non-restricted X url -> stays in its table
  - Hover tooltip never jumps

