import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

async function confirm(token: string | null) {
  if (!token || typeof token !== 'string') {
    return { status: 400, body: { error: 'Missing token' } }
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || !record.identifier.startsWith('email-change:')) {
    return { status: 400, body: { error: 'Invalid or expired token' } }
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return { status: 400, body: { error: 'Token has expired' } }
  }

  const parts = record.identifier.split(':')
  if (parts.length < 3) {
    return { status: 400, body: { error: 'Malformed token' } }
  }
  const userId = parts[1]
  const newEmail = parts.slice(2).join(':')

  const emailTaken = await prisma.user.findUnique({ where: { email: newEmail } })
  if (emailTaken && emailTaken.id !== userId) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return { status: 409, body: { error: 'Email is no longer available' } }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail, emailVerified: new Date() },
  })
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {})

  return { status: 200, body: { message: 'Email updated successfully', email: newEmail } }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const safeToken = token.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 256)
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Confirm email change</title>
<meta name="robots" content="noindex"><meta name="referrer" content="no-referrer">
<style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#111;border:1px solid #333;border-radius:16px;padding:32px;max-width:420px;text-align:center}
button{margin-top:20px;padding:12px 24px;background:#fff;color:#000;border:0;border-radius:8px;font-weight:600;cursor:pointer}
#msg{margin-top:16px;font-size:14px;color:#aaa}</style></head>
<body><div class="card"><h1>Confirm email change</h1>
<p>Click the button below to finish updating your email address.</p>
<form method="POST" action="/api/settings/email/confirm" onsubmit="event.preventDefault();submit()">
<button type="submit">Confirm email change</button></form>
<p id="msg"></p>
<script>
async function submit(){
  const r=await fetch('/api/settings/email/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:${JSON.stringify(safeToken)}})});
  const j=await r.json().catch(()=>({}));
  document.getElementById('msg').textContent=j.message||j.error||'Done.';
}
</script></div></body></html>`
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  const { token } = await request.json().catch(() => ({ token: null }))
  const result = await confirm(token)
  return NextResponse.json(result.body, { status: result.status })
}
