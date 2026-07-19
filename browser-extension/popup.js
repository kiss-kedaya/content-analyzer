/* global chrome */

const elements = {
  enabled: document.querySelector('#enabled'),
  baseUrl: document.querySelector('#baseUrl'),
  password: document.querySelector('#password'),
  pending: document.querySelector('#pending'),
  uploaded: document.querySelector('#uploaded'),
  captured: document.querySelector('#captured'),
  status: document.querySelector('#status'),
  save: document.querySelector('#save'),
  upload: document.querySelector('#upload'),
  clear: document.querySelector('#clear'),
}

function setStatus(message, error = false) {
  elements.status.textContent = message
  elements.status.classList.toggle('error', error)
}

async function send(message) {
  const response = await chrome.runtime.sendMessage(message)
  if (response?.ok === false) throw new Error(response.error || '操作失败')
  return response
}

async function refresh() {
  const state = await send({ type: 'GET_STATUS' })
  elements.enabled.checked = state.config.enabled
  elements.baseUrl.value = state.config.baseUrl
  elements.password.placeholder = state.config.hasPassword ? '已保存；留空不修改' : '输入网站访问密码'
  elements.pending.textContent = String(state.pending || 0)
  elements.uploaded.textContent = String(state.stats.uploaded || 0)
  elements.captured.textContent = String(state.stats.captured || 0)

  if (state.stats.lastError) setStatus(state.stats.lastError, true)
  else if (state.stats.lastUploadAt) setStatus(`上次上传：${new Date(state.stats.lastUploadAt).toLocaleString()}`)
  else setStatus(state.config.hasPassword ? '等待 X 主页时间线…' : '请先保存访问密码')
}

async function busy(button, action) {
  button.disabled = true
  try { await action() } catch (error) { setStatus(error.message || String(error), true) } finally { button.disabled = false }
}

elements.save.addEventListener('click', () => busy(elements.save, async () => {
  await send({
    type: 'SAVE_CONFIG',
    config: {
      enabled: elements.enabled.checked,
      baseUrl: elements.baseUrl.value,
      password: elements.password.value,
    },
  })
  elements.password.value = ''
  setStatus('设置已保存')
  await refresh()
}))

elements.upload.addEventListener('click', () => busy(elements.upload, async () => {
  setStatus('正在上传…')
  await send({ type: 'UPLOAD_NOW' })
  await refresh()
}))

elements.clear.addEventListener('click', () => busy(elements.clear, async () => {
  await send({ type: 'CLEAR_QUEUE' })
  await refresh()
}))

refresh().catch((error) => setStatus(error.message || String(error), true))
