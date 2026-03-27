import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token required' }, { status: 400 })
    }
    
    // Validate with Telegram API
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('Telegram API error:', response.status, errorText)
      return NextResponse.json({ valid: false, error: 'Failed to validate with Telegram' }, { status: response.status })
    }
    
    const data = await response.json()
    
    if (data.ok) {
      return NextResponse.json({ 
        valid: true, 
        bot: {
          id: data.result.id,
          username: data.result.username,
          firstName: data.result.first_name
        }
      })
    } else {
      return NextResponse.json({ valid: false, error: data.description })
    }
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 })
  }
}
