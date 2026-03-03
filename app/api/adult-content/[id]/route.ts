import { NextRequest, NextResponse } from 'next/server'
import { getAdultContentById, deleteAdultContent } from '@/lib/adult-api'

// GET /api/adult-content/[id] - 获取成人内容详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const content = await getAdultContentById(id)
    
    if (!content) {
      return NextResponse.json(
        { error: 'Adult content not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching adult content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adult content' },
      { status: 500 }
    )
  }
}

// DELETE /api/adult-content/[id] - 删除成人内容
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteAdultContent(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting adult content:', error)
    return NextResponse.json(
      { error: 'Failed to delete adult content' },
      { status: 500 }
    )
  }
}
