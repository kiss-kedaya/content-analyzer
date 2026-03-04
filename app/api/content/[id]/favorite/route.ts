import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST /api/content/[id]/favorite - 收藏
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const content = await prisma.content.update({
      where: { id },
      data: {
        favorited: true,
        favoritedAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true, favorited: true })
  } catch (error) {
    console.error('Favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to favorite content' },
      { status: 500 }
    )
  }
}

// DELETE /api/content/[id]/favorite - 取消收藏
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const content = await prisma.content.update({
      where: { id },
      data: {
        favorited: false,
        favoritedAt: null
      }
    })
    
    return NextResponse.json({ success: true, favorited: false })
  } catch (error) {
    console.error('Unfavorite error:', error)
    return NextResponse.json(
      { error: 'Failed to unfavorite content' },
      { status: 500 }
    )
  }
}
