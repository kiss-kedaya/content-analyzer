import { expect, test, type Page } from '@playwright/test'

const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || 'test-password'
type SeededRecord = { kind: 'content' | 'adult-content'; id: string }
const seededRecords = new WeakMap<Page, SeededRecord[]>()

function buildContentFixtures(count: number, kind: 'tech' | 'adult') {
  return Array.from({ length: count }, (_, index) => ({
    source: 'X',
    url: `https://x.com/content_analyzer_e2e/status/${kind === 'tech' ? 10_000 + index : 20_000 + index}`,
    title: `${kind === 'tech' ? '技术' : '视频'}测试内容 ${index + 1}`,
    content: `浏览器测试内容 ${index + 1}，用于验证无刷新分页、筛选状态和媒体目录。`,
    analyzedBy: 'playwright',
    mediaUrls: kind === 'adult'
      ? [`https://video.twimg.com/ext_tw_video/e2e/vid/avc1/720x1280/video-${index + 1}.mp4?tag=12`]
      : [],
  }))
}

async function loginAndSeed(page: Page) {
  const records: SeededRecord[] = []
  seededRecords.set(page, records)
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('/login')
  await page.getByLabel('访问密码').fill(ACCESS_PASSWORD)
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  const cookieHeader = (await page.context().cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const techResponse = await page.request.post('/api/content/batch', {
    headers: { cookie: cookieHeader },
    data: buildContentFixtures(30, 'tech'),
  })
  if (!techResponse.ok()) {
    const cookies = await page.context().cookies()
    throw new Error(`Tech seed failed (${techResponse.status()}): ${await techResponse.text()}; authCookie=${cookies.some((cookie) => cookie.name === 'auth-token')}`)
  }
  const techResult = await techResponse.json() as { created?: Array<{ id: string }> }
  records.push(...(techResult.created || []).map(({ id }) => ({ kind: 'content' as const, id })))

  const adultResponse = await page.request.post('/api/adult-content/batch', {
    headers: { cookie: cookieHeader },
    data: buildContentFixtures(15, 'adult'),
  })
  if (!adultResponse.ok()) {
    throw new Error(`Adult seed failed (${adultResponse.status()}): ${await adultResponse.text()}`)
  }
  const adultResult = await adultResponse.json() as { created?: Array<{ id: string }> }
  records.push(...(adultResult.created || []).map(({ id }) => ({ kind: 'adult-content' as const, id })))
}

test.beforeEach(async ({ page }) => {
  await loginAndSeed(page)
})

test.afterEach(async ({ page }) => {
  const records = seededRecords.get(page) || []
  const cookieHeader = (await page.context().cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
  await Promise.all(records.map(({ kind, id }) => page.request.delete(`/api/${kind}/${id}`, {
    headers: { cookie: cookieHeader },
  })))
  seededRecords.delete(page)
})

test('load-more appends records without document or RSC navigation', async ({ page }) => {
  await page.goto('/?tab=tech')
  await expect(page.locator('article')).toHaveCount(12)

  const unexpectedNavigations: string[] = []
  const paginationRequests: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (request.isNavigationRequest() || url.includes('_rsc=')) unexpectedNavigations.push(url)
    if (url.includes('/api/content/paginated')) paginationRequests.push(url)
  })

  const initialUrl = page.url()
  await page.getByRole('button', { name: '加载更多' }).click()
  await expect.poll(() => page.locator('article').count()).toBeGreaterThan(12)

  expect(page.url()).toBe(initialUrl)
  expect(unexpectedNavigations).toEqual([])
  expect(paginationRequests.some((url) => url.includes('page=2'))).toBeTruthy()
})

test('scrolling near the bottom automatically loads the next page in place', async ({ page }) => {
  await page.goto('/?tab=tech')
  await expect(page.locator('article')).toHaveCount(12)

  const initialUrl = page.url()
  const initialHeight = await page.evaluate(() => document.body.scrollHeight)
  const unexpectedNavigations: string[] = []
  page.on('request', (request) => {
    if (request.isNavigationRequest() || request.url().includes('_rsc=')) {
      unexpectedNavigations.push(request.url())
    }
  })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect.poll(() => page.locator('article').count()).toBeGreaterThan(12)

  expect(page.url()).toBe(initialUrl)
  expect(await page.evaluate(() => document.body.scrollHeight)).toBeGreaterThan(initialHeight)
  expect(unexpectedNavigations).toEqual([])
})

test('returning from details restores loaded records and the reading position', async ({ page }) => {
  await page.goto('/?tab=tech')
  await expect(page.locator('article')).toHaveCount(12)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect.poll(() => page.locator('article').count()).toBeGreaterThan(12)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect.poll(() => page.locator('article').count()).toBeGreaterThan(24)

  const loadedCount = await page.locator('article').count()
  const targetCard = page.locator('article').nth(Math.max(0, loadedCount - 7))
  await targetCard.scrollIntoViewIfNeeded()
  const savedScrollY = await page.evaluate(() => window.scrollY)
  await targetCard.locator('a[href^="/content/"]').first().click()
  await expect(page).toHaveURL(/\/content\//)

  await page.getByRole('button', { name: '返回列表' }).click()
  await expect(page).toHaveURL(/\/?\?tab=tech$/)
  await expect.poll(() => page.locator('article').count()).toBeGreaterThanOrEqual(loadedCount)
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - savedScrollY)).toBeLessThan(120)
})

test('short-video player uses the complete video directory and restores focus', async ({ page }) => {
  await page.goto('/?tab=adult')
  await expect(page.locator('article')).toHaveCount(12)

  const trigger = page.getByRole('button', { name: /播放视频/ }).first()
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: '短视频播放模式' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/^1 \/ \d+$/)).toBeVisible()
  await expect(dialog.locator('video')).toHaveCount(1)
  await expect(dialog.getByLabel('播放速度').locator('option')).toHaveCount(9)
  await expect(dialog.getByRole('button', { name: '暂停' })).toHaveCount(0)
  await expect(dialog.getByRole('region', { name: '帖子信息' })).toBeVisible()
  await expect(dialog.getByText(/浏览器测试内容/).first()).toBeVisible()
  const dialogBox = await dialog.boundingBox()
  expect(dialogBox).toMatchObject({ x: 0, y: 0 })
  expect(dialogBox?.height).toBeGreaterThan(700)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('mobile navigation, theme persistence, and touch geometry remain accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/?tab=tech')

  expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBeTruthy()

  const themeToggle = page.getByRole('button', { name: '切换为浅色模式' }).first()
  await themeToggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  const menuButton = page.getByRole('button', { name: '打开导航菜单' })
  await menuButton.click()
  const drawer = page.getByRole('dialog', { name: '主导航' })
  await expect(drawer).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(menuButton).toBeFocused()

  const undersizedButtons = await page.locator('button:visible').evaluateAll((buttons) => buttons
    .map((button) => {
      const rect = button.getBoundingClientRect()
      return { name: button.getAttribute('aria-label') || button.textContent?.trim(), width: rect.width, height: rect.height }
    })
    .filter(({ width, height }) => width < 44 || height < 44))
  expect(undersizedButtons).toEqual([])
})
