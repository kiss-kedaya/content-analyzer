import { NextRequest, NextResponse } from 'next/server'
import { getContentById, deleteContent } from '@/lib/api'

// GET /api/content/[id] - 获取内容详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const content = await getContentById(params.id)
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// DELETE /api/content/[id] - 删除内容
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteContent(params.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}
