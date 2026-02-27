import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || 'default'

    return NextResponse.json({ 
      files: [],
      agentId,
    })
  } catch (error: any) {
    return NextResponse.json({ files: [], error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const agentId = formData.get('agentId') as string || 'default'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      filename: file.name,
      size: file.size,
      agentId,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
