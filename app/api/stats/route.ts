import { NextResponse } from 'next/server'
import { getStats } from '@/lib/api'

// GET /api/stats - 获取统计信息
export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
