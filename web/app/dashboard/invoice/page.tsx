'use client'

import { useState, useEffect } from 'react'
import { Plus, Send, FileText, DollarSign, Clock, Check, Loader2, Copy, Trash2 } from 'lucide-react'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
  notes?: string
}

const STATUS_COLORS = {
  draft: 'text-zinc-500 border-zinc-700 bg-zinc-900',
  sent: 'text-blue-400 border-blue-800 bg-blue-950',
  paid: 'text-green-400 border-green-800 bg-green-950',
  overdue: 'text-red-400 border-red-800 bg-red-950',
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
    clientName: '',
    clientEmail: '',
    currency: 'GBP',
    taxRate: 20,
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoice')
      const data = await res.json()
      if (data.ok) setInvoices(data.invoices)
    } catch {} finally {
      setLoading(false)
    }
  }

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }])

  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      updated[i].amount = updated[i].quantity * updated[i].unitPrice
    }
    setItems(updated)
  }

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (form.taxRate / 100)
  const total = subtotal + taxAmount

  const createInvoice = async (action: 'create' | 'send') => {
    setSending(true)
    try {
      const invoice = {
        ...form,
        items,
        subtotal,
        taxAmount,
        total,
        status: action === 'send' ? 'sent' : 'draft',
      }
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, invoice }),
      })
      const data = await res.json()
      if (data.ok) {
        setInvoices((prev) => [{ id: data.invoice.id, ...invoice }, ...prev])
        setShowForm(false)
        setForm({
          invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
          clientName: '',
          clientEmail: '',
          currency: 'GBP',
          taxRate: 20,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          notes: '',
        })
        setItems([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }])
      }
    } catch {} finally {
      setSending(false)
    }
  }

  const symbol = form.currency === 'GBP' ? '£' : '$'

  return (
    <main className="min-h-screen bg-black text-white font-mono pt-14">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-2">Finance</div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">Invoices</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors">
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: `${symbol}${invoices.reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}`, icon: DollarSign },
            { label: 'Paid', value: `${invoices.filter((i) => i.status === 'paid').length}`, icon: Check },
            { label: 'Outstanding', value: `${invoices.filter((i) => i.status === 'sent').length}`, icon: Clock },
            { label: 'Draft', value: `${invoices.filter((i) => i.status === 'draft').length}`, icon: FileText },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
                <stat.icon className="h-3 w-3" />
                {stat.label}
              </div>
              <div className="mt-2 text-xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4">New Invoice</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Invoice #</label>
                <input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Client Name</label>
                <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Client Email</label>
                <input value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Tax %</label>
                  <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-600">Items</label>
                <button onClick={addItem} className="text-[10px] text-green-400 hover:text-green-300">+ Add item</button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Description" className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} className="w-20 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-green-500/50" />
                  <input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} className="w-24 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-green-500/50" />
                  <span className="flex items-center text-sm text-zinc-500 w-24 text-right">{symbol}{item.amount.toFixed(2)}</span>
                  {items.length > 1 && <button onClick={() => removeItem(i)} className="text-zinc-600 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-zinc-800 pt-4 mb-4">
              <div className="flex justify-between text-sm mb-1"><span className="text-zinc-500">Subtotal</span><span>{symbol}{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-zinc-500">Tax ({form.taxRate}%)</span><span>{symbol}{taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-zinc-800"><span>Total</span><span className="text-green-400">{symbol}{total.toFixed(2)}</span></div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => createInvoice('create')} disabled={sending} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                Save Draft
              </button>
              <button onClick={() => createInvoice('send')} disabled={sending || !form.clientEmail} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Invoice
              </button>
            </div>
          </div>
        )}

        {/* Invoice List */}
        <div className="space-y-2">
          {loading && <div className="text-center py-8 text-zinc-600">Loading invoices...</div>}
          {!loading && invoices.length === 0 && (
            <div className="text-center py-12 text-zinc-600">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No invoices yet. Create your first one.</p>
            </div>
          )}
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{inv.invoiceNumber}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">{inv.clientName} · {inv.clientEmail}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{inv.currency === 'GBP' ? '£' : '$'}{(inv.total || 0).toFixed(2)}</div>
                <div className="text-[10px] text-zinc-600">Due {inv.dueDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
