/**
 * 规范化数据库中的来源标签
 * 将 x.com 改为 X
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始规范化来源标签...')

  // 更新 content 表
  const contentResult = await prisma.content.updateMany({
    where: {
      source: 'x.com'
    },
    data: {
      source: 'X'
    }
  })

  console.log(`✓ 更新了 ${contentResult.count} 条 content 记录`)

  // 更新 adultContent 表
  const adultContentResult = await prisma.adultContent.updateMany({
    where: {
      source: 'x.com'
    },
    data: {
      source: 'X'
    }
  })

  console.log(`✓ 更新了 ${adultContentResult.count} 条 adultContent 记录`)

  console.log('✓ 规范化完成！')
}

main()
  .catch((e) => {
    console.error('错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
