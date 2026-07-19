# Scripts

## Import X bookmarks

The importer accepts the JSON response returned by the X API bookmarks endpoint.
It stores original post text without AI scoring or summarization, routes
`possibly_sensitive` posts to adult content, and uploads in batches.
Request `attachments.media_keys` plus
`media.fields=media_key,type,url,preview_image_url,variants,width,height` so the
importer can persist one mobile-compatible media URL per attachment.

```bash
# Inspect counts only
npm run import:x-bookmarks -- .local/x-bookmarks.json dry-run

# Upload to https://ca.kedaya.xyz
npm run import:x-bookmarks -- .local/x-bookmarks.json

# Upload to another deployment
$env:CONTENT_ANALYZER_URL='http://localhost:3000'
npm run import:x-bookmarks -- .local/x-bookmarks.json
```

Authentication uses `CONTENT_ANALYZER_PASSWORD` when set and otherwise falls
back to `ACCESS_PASSWORD` from `.env`. Import payloads belong in `.local/`,
which is excluded from Git.
