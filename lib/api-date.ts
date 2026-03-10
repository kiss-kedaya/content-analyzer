import { prisma } from './db'
import { getShanghaiDayRange } from './date'
import { validateOrderBy } from './api'

export async function getContentsByDate(date: string, orderBy: string, page: number, pageSize: number) {
  const validatedOrderBy = validateOrderBy(orderBy)
  const range = getShanghaiDayRange(date)
  const skip = (page - 1) * pageSize

  const orderByClause = validatedOrderBy === 'createdAt'
    ? [{ createdAt: 'desc' as const }]
    : [{ [validatedOrderBy]: 'desc' as const }, { createdAt: 'desc' as const }]

  return await prisma.content.findMany({
    where: {
      analyzedAt: {
        gte: range.start,
        lt: range.end,
      }
    },
    orderBy: orderByClause,
    skip,
    take: pageSize,
  })
}

export async function getContentsCountByDate(date: string) {
  const range = getShanghaiDayRange(date)
  return await prisma.content.count({
    where: {
      analyzedAt: {
        gte: range.start,
        lt: range.end,
      }
    }
  })
}

export async function getStatsByDate(date: string) {
  const range = getShanghaiDayRange(date)
  const bySource = await prisma.content.groupBy({
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
