import { prisma } from './db'
import { getShanghaiDayRange } from './date'
import { validateOrderBy } from './adult-api'

export async function getAdultContentsByDate(date: string, orderBy: string, page: number, pageSize: number) {
  const validatedOrderBy = validateOrderBy(orderBy)
  const range = getShanghaiDayRange(date)
  
  // 确保 page 和 pageSize 是有效的数字
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.max(1, Number(pageSize) || 10)
  const skip = (safePage - 1) * safePageSize

  const orderByClause = validatedOrderBy === 'createdAt'
    ? [{ createdAt: 'desc' as const }]
    : [{ [validatedOrderBy]: 'desc' as const }, { createdAt: 'desc' as const }]

  return await prisma.adultContent.findMany({
    where: {
      analyzedAt: {
        gte: range.start,
        lt: range.end,
      }
    },
    orderBy: orderByClause,
    skip: skip,
    take: safePageSize,
  })
}

export async function getAdultContentsCountByDate(date: string) {
  const range = getShanghaiDayRange(date)
  return await prisma.adultContent.count({
    where: {
      analyzedAt: {
        gte: range.start,
        lt: range.end,
      }
    }
  })
}

export async function getAdultStatsByDate(date: string) {
  const range = getShanghaiDayRange(date)
  const bySource = await prisma.adultContent.groupBy({
    by: ['source'],
    where: {
      analyzedAt: {
        gte: range.start,
        lt: range.end,
      }
    },
    _count: true
  })

  return {
    bySource: bySource.reduce((acc, item) => {
      acc[item.source] = item._count
      return acc
    }, {} as Record<string, number>)
  }
}
