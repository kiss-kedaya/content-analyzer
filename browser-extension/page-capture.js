(() => {
  const MESSAGE_SOURCE = 'content-analyzer-x-capture'
  const seenPostIds = new Set()

  function isHomeTimelineRequest(value) {
    try {
      const url = decodeURIComponent(String(value || ''))
      return /(?:HomeTimeline|HomeLatestTimeline|HomeTimelineHome)/i.test(url)
    } catch {
      return false
    }
  }

  function unwrapTweet(value) {
    let current = value
    for (let depth = 0; depth < 6 && current && typeof current === 'object'; depth += 1) {
      if (current.rest_id && current.legacy) return current
      if (current.tweet) current = current.tweet
      else if (current.result) current = current.result
      else break
    }
    return current?.rest_id && current?.legacy ? current : null
  }

  function unwrapUser(value) {
    let current = value
    for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth += 1) {
      if (current.rest_id && (current.legacy || current.core)) return current
      if (current.result) current = current.result
      else break
    }
    return current || null
  }

  function normalizeMedia(entry, postId, index) {
    const type = entry?.type
    if (!['photo', 'video', 'animated_gif'].includes(type)) return null
    const mediaKey = entry.media_key || `${type}_${postId}_${index}`

    if (type === 'photo') {
      const url = entry.media_url_https || entry.media_url
      return url ? { media_key: mediaKey, type, url, width: entry.original_info?.width, height: entry.original_info?.height } : null
    }

    const variants = (entry.video_info?.variants || [])
      .filter((variant) => variant?.url)
      .map((variant) => ({
        bit_rate: Number.isFinite(variant.bitrate) ? variant.bitrate : undefined,
        content_type: variant.content_type,
        url: variant.url,
      }))
    if (!variants.some((variant) => variant.content_type === 'video/mp4')) return null

    return {
      media_key: mediaKey,
      type,
      preview_image_url: entry.media_url_https || entry.media_url,
      variants,
      width: entry.original_info?.width,
      height: entry.original_info?.height,
    }
  }

  function normalizeTweet(value) {
    const tweet = unwrapTweet(value)
    const legacy = tweet?.legacy
    const id = String(tweet?.rest_id || '')
    if (!legacy || !/^\d+$/.test(id) || seenPostIds.has(id)) return null

    const userResult = unwrapUser(tweet.core?.user_results?.result || tweet.user_results?.result)
    const userLegacy = userResult?.legacy || userResult?.core || {}
    const authorId = String(userResult?.rest_id || legacy.user_id_str || '')
    const username = userLegacy.screen_name || userResult?.core?.screen_name
    const name = userLegacy.name || userResult?.core?.name
    const media = (legacy.extended_entities?.media || legacy.entities?.media || [])
      .map((entry, index) => normalizeMedia(entry, id, index))
      .filter(Boolean)
    if (media.length === 0) return null

    seenPostIds.add(id)
    const text = tweet.note_tweet?.note_tweet_results?.result?.text || legacy.full_text || legacy.text || ''
    return {
      post: {
        id,
        text,
        url: username ? `https://x.com/${username}/status/${id}` : `https://x.com/i/status/${id}`,
        author_id: authorId || undefined,
        created_at: legacy.created_at ? new Date(legacy.created_at).toISOString() : undefined,
        possibly_sensitive: legacy.possibly_sensitive === true,
        attachments: { media_keys: media.map((item) => item.media_key) },
      },
      user: authorId ? { id: authorId, name, username } : null,
      media,
    }
  }

  function extractTimelinePayload(json) {
    const normalized = []
    const stack = [json]
    const visited = new Set()

    while (stack.length > 0) {
      const node = stack.pop()
      if (!node || typeof node !== 'object' || visited.has(node)) continue
      visited.add(node)

      if (node.tweet_results?.result) {
        const tweet = normalizeTweet(node.tweet_results.result)
        if (tweet) normalized.push(tweet)
      }

      if (Array.isArray(node)) {
        for (const item of node) stack.push(item)
      } else {
        for (const [key, value] of Object.entries(node)) {
          if (key !== 'tweet_results') stack.push(value)
        }
      }
    }

    if (normalized.length === 0) return null
    const users = new Map()
    const media = new Map()
    for (const item of normalized) {
      if (item.user?.id) users.set(item.user.id, item.user)
      for (const entity of item.media) media.set(entity.media_key, entity)
    }

    return {
      data: normalized.map((item) => item.post),
      includes: { users: [...users.values()], media: [...media.values()] },
    }
  }

  function publish(json) {
    try {
      const payload = extractTimelinePayload(json)
      if (!payload) return
      window.postMessage({ source: MESSAGE_SOURCE, version: 1, payload }, window.location.origin)
    } catch {
      // X response shapes change frequently; a bad response must never break the page.
    }
  }

  const nativeFetch = window.fetch
  window.fetch = async function capturedFetch(...args) {
    const response = await Reflect.apply(nativeFetch, this, args)
    const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url
    if (isHomeTimelineRequest(requestUrl || response.url)) {
      response.clone().json().then(publish).catch(() => {})
    }
    return response
  }

  const nativeOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function capturedOpen(method, url, ...rest) {
    this.__contentAnalyzerTimeline = isHomeTimelineRequest(url)
    return nativeOpen.call(this, method, url, ...rest)
  }

  const nativeSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function capturedSend(...args) {
    if (this.__contentAnalyzerTimeline) {
      this.addEventListener('load', () => {
        try {
          publish(this.responseType === 'json' ? this.response : JSON.parse(this.responseText))
        } catch {
          // Ignore non-JSON or incomplete responses.
        }
      }, { once: true })
    }
    return nativeSend.apply(this, args)
  }
})()
