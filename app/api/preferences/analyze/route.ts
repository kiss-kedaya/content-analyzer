import { NextResponse } from 'next/server'
import { getPreferences } from '@/lib/preferences'

export async function GET() {
  try {
    const preferences = await getPreferences()
    if (!preferences) return NextResponse.json({ message: 'No favorites found', preferences: null })
    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    console.error('Preferences analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze preferences' }, { status: 500 })
  }
}
