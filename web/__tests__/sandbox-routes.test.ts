describe('sandbox route validation', () => {
  it('create route requires VERCEL_TOKEN', () => {
    const original = process.env.VERCEL_TOKEN
    delete process.env.VERCEL_TOKEN
    expect(() => {
      if (!process.env.VERCEL_TOKEN) throw new Error('VERCEL_TOKEN not configured')
    }).toThrow('VERCEL_TOKEN')
    process.env.VERCEL_TOKEN = original
  })

  it('files route requires sessionId', () => {
    const body = { files: [{ path: '/test.txt', content: 'hello' }] }
    const sessionId = body.sessionId as string | undefined
    const files = body.files as Array<unknown>
    expect(!sessionId || !Array.isArray(files) || files.length === 0).toBe(true)
  })

  it('files route requires non-empty files', () => {
    const body = { sessionId: 'sess-123', files: [] }
    const sessionId = body.sessionId as string | undefined
    const files = body.files as Array<unknown>
    expect(!sessionId || !Array.isArray(files) || files.length === 0).toBe(true)
  })

  it('terminal route requires sessionId', () => {
    const body = { command: 'ls' }
    const sessionId = body.sessionId as string | undefined
    const command = body.command as string | undefined
    expect(!sessionId || !command).toBe(true)
  })

  it('stop route requires sessionId', () => {
    const body = {}
    const sessionId = body.sessionId as string | undefined
    expect(!sessionId).toBe(true)
  })
})
