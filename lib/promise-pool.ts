export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  const workers = new Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (true) {
      const current = nextIndex
      nextIndex += 1
      if (current >= items.length) return

      results[current] = await fn(items[current])
    }
  })

  await Promise.all(workers)
  return results
}
