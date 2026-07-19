/* global chrome */

const MESSAGE_SOURCE = 'content-analyzer-x-capture'

window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return
  const message = event.data
  if (message?.source !== MESSAGE_SOURCE || message.version !== 1 || !message.payload) return

  chrome.runtime.sendMessage({ type: 'CAPTURE_POSTS', payload: message.payload }).catch(() => {
    // The extension may be reloading while X is still open; the next timeline response will retry.
  })
})
