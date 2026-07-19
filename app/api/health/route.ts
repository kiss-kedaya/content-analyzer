import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const healthLogger = createLogger('health')
const headers = { 'Cache-Control': 'no-store' }

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok' }, { headers })
  } catch (error) {
    healthLogger.error({ message: error instanceof Error ? error.message : String(error) }, 'Database health check failed')
    return NextResponse.json({ status: 'degraded' }, { status: 503, headers })
  }
}
