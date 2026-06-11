import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface InvoiceData {
  id?: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  clientAddress?: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
  notes?: string
  createdAt?: string
}

// POST /api/invoice — create or update invoice
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, invoice } = body

    if (action === 'create') {
      const inv = await prisma.managedAgentSession.create({
        data: {
          userId: session.user.id,
          type: 'invoice',
          metadata: {
            ...invoice,
            status: 'draft',
            createdBy: session.user.id,
            createdAt: new Date().toISOString(),
          },
        },
      })

      return NextResponse.json({ ok: true, invoice: { id: inv.id, ...invoice } })
    }

    if (action === 'update' && invoice.id) {
      const inv = await prisma.managedAgentSession.update({
        where: { id: invoice.id },
        data: {
          metadata: {
            ...invoice,
            updatedAt: new Date().toISOString(),
          },
        },
      })

      return NextResponse.json({ ok: true, invoice: { id: inv.id, ...invoice } })
    }

    if (action === 'send' && invoice.id) {
      const inv = await prisma.managedAgentSession.update({
        where: { id: invoice.id },
        data: {
          metadata: {
            ...invoice,
            status: 'sent',
            sentAt: new Date().toISOString(),
          },
        },
      })

      // Send email via Resend
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Agentbot <onboarding@resend.dev>',
          to: invoice.clientEmail,
          subject: `Invoice ${invoice.invoiceNumber} from ${invoice.clientName || 'Agentbot'}`,
          html: generateInvoiceEmail(invoice),
        })
      } catch (err) {
        console.error('[Invoice] Email send failed:', err)
      }

      return NextResponse.json({ ok: true, invoice: { id: inv.id, ...invoice, status: 'sent' } })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Invoice] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET /api/invoice — list invoices
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoices = await prisma.managedAgentSession.findMany({
      where: {
        userId: session.user.id,
        type: 'invoice',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      ...(inv.metadata as Record<string, unknown>),
    }))

    return NextResponse.json({ ok: true, invoices: formatted })
  } catch (error) {
    console.error('[Invoice] List error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function generateInvoiceEmail(invoice: InvoiceData): string {
  const items = invoice.items || []
  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #222;color:#fff;font-size:14px;">${item.description}</td>
      <td style="padding:12px;border-bottom:1px solid #222;color:#888;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #222;color:#888;font-size:14px;text-align:right;">${invoice.currency === 'GBP' ? '£' : '$'}${item.unitPrice.toFixed(2)}</td>
      <td style="padding:12px;border-bottom:1px solid #222;color:#fff;font-size:14px;text-align:right;font-weight:bold;">${invoice.currency === 'GBP' ? '£' : '$'}${item.amount.toFixed(2)}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#000;font-family:monospace;">
<div style="max-width:600px;margin:40px auto;background:#0a0a0a;border:1px solid #222;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">🦞</div>
    <h1 style="color:#fff;font-size:24px;margin:0;">Invoice ${invoice.invoiceNumber}</h1>
  </div>
  <div style="padding:32px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
      <div>
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Bill To</div>
        <div style="color:#fff;font-size:14px;margin-top:4px;">${invoice.clientName}</div>
        <div style="color:#666;font-size:12px;">${invoice.clientEmail}</div>
      </div>
      <div style="text-align:right;">
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Due Date</div>
        <div style="color:#fff;font-size:14px;margin-top:4px;">${invoice.dueDate}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="border-bottom:2px solid #222;">
          <th style="padding:12px;text-align:left;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">Description</th>
          <th style="padding:12px;text-align:center;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">Qty</th>
          <th style="padding:12px;text-align:right;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">Price</th>
          <th style="padding:12px;text-align:right;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <div style="border-top:2px solid #222;padding-top:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#888;font-size:12px;">Subtotal</span>
        <span style="color:#fff;font-size:12px;">${invoice.currency === 'GBP' ? '£' : '$'}${invoice.subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#888;font-size:12px;">Tax (${invoice.taxRate}%)</span>
        <span style="color:#fff;font-size:12px;">${invoice.currency === 'GBP' ? '£' : '$'}${invoice.taxAmount.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #222;">
        <span style="color:#fff;font-size:16px;font-weight:bold;">Total</span>
        <span style="color:#10b981;font-size:16px;font-weight:bold;">${invoice.currency === 'GBP' ? '£' : '$'}${invoice.total.toFixed(2)}</span>
      </div>
    </div>
    ${invoice.notes ? `<div style="margin-top:24px;padding:16px;background:#111;border-radius:8px;"><div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Notes</div><div style="color:#666;font-size:12px;">${invoice.notes}</div></div>` : ''}
  </div>
  <div style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">Generated by Agentbot · agentbot.sh</p>
  </div>
</div>
</body>
</html>`
}
