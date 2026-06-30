'use client';

import { useState, useEffect } from 'react';
import { Plus, Send, FileText, DollarSign, Clock, Check, Loader2, Trash2, Eye } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  notes?: string;
}

const STATUS_COLORS = {
  draft: 'text-zinc-500 border-zinc-700 bg-zinc-900',
  sent: 'text-blue-400 border-blue-800 bg-blue-950',
  paid: 'text-green-400 border-green-800 bg-green-950',
  overdue: 'text-red-400 border-red-800 bg-red-950',
};

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
    clientName: '',
    clientEmail: '',
    currency: 'GBP',
    taxRate: 20,
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoice');
      const data = await res.json();
      if (data.ok) setInvoices(data.invoices);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const addItem = () =>
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);

  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      updated[i].amount = updated[i].quantity * updated[i].unitPrice;
    }
    setItems(updated);
  };

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount;

  const createInvoice = async (action: 'create' | 'send') => {
    setSending(true);
    try {
      const invoice = {
        ...form,
        items,
        subtotal,
        taxAmount,
        total,
        status: action === 'send' ? 'sent' : 'draft',
      };
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, invoice }),
      });
      const data = await res.json();
      if (data.ok) {
        setInvoices((prev) => [{ ...invoice, id: data.invoice.id } as Invoice, ...prev]);
        setShowForm(false);
        setForm({
          invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
          clientName: '',
          clientEmail: '',
          currency: 'GBP',
          taxRate: 20,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          notes: '',
        });
        setItems([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  const postInvoiceAction = async (action: 'send' | 'delete' | 'markPaid', inv: Invoice) => {
    setActionBusy(true);
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, invoice: inv }),
      });
      const data = await res.json();
      if (!data.ok) return;
      if (action === 'delete') {
        setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
        setSelected(null);
      } else {
        const updated = { ...inv, ...data.invoice } as Invoice;
        setInvoices((prev) => prev.map((i) => (i.id === inv.id ? updated : i)));
        setSelected(updated);
      }
    } catch {
      // network error — list stays as-is
    } finally {
      setActionBusy(false);
    }
  };

  const cur = (c: string) => (c === 'GBP' ? '£' : '$');

  const printInvoice = (inv: Invoice) => {
    const s = cur(inv.currency);
    const rows = (inv.items || [])
      .map(
        (it) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${
            it.description || ''
          }</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${
            it.quantity
          }</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${s}${(
            it.unitPrice || 0
          ).toFixed(
            2
          )}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${s}${(
            it.amount || 0
          ).toFixed(2)}</td></tr>`
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${
      inv.invoiceNumber
    }</title></head><body style="font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#111">
      <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h1 style="margin:0">Invoice ${
        inv.invoiceNumber
      }</h1><div style="color:#666;text-transform:uppercase;font-size:12px;letter-spacing:.1em;margin-top:4px">${
        inv.status
      }</div></div><div style="text-align:right;color:#666;font-size:13px">Due ${
        inv.dueDate || '—'
      }</div></div>
      <div style="margin:24px 0;color:#444"><strong>Bill To</strong><br>${
        inv.clientName || ''
      }<br>${inv.clientEmail || ''}</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;color:#888;font-size:12px;text-transform:uppercase"><th style="padding:8px">Description</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th><th style="padding:8px;text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="margin-top:24px;margin-left:auto;width:240px;font-size:14px">
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:#666">Subtotal</span><span>${s}${(
          inv.subtotal || 0
        ).toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:#666">Tax (${
          inv.taxRate || 0
        }%)</span><span>${s}${(inv.taxAmount || 0).toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #111;font-weight:bold;font-size:16px"><span>Total</span><span>${s}${(
          inv.total || 0
        ).toFixed(2)}</span></div>
      </div>
      ${
        inv.notes
          ? `<div style="margin-top:24px;color:#666;font-size:13px"><strong>Notes:</strong> ${inv.notes}</div>`
          : ''
      }
      <p style="margin-top:40px;color:#aaa;font-size:11px">Generated by Agentbot · agentbot.sh</p>
      <script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const symbol = form.currency === 'GBP' ? '£' : '$';

  return (
    <main className="min-h-screen bg-black text-white font-mono pt-14">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500 mb-2">
              Finance
            </div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">Invoices</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total',
              value: `${symbol}${invoices.reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}`,
              icon: DollarSign,
            },
            {
              label: 'Paid',
              value: `${invoices.filter((i) => i.status === 'paid').length}`,
              icon: Check,
            },
            {
              label: 'Outstanding',
              value: `${invoices.filter((i) => i.status === 'sent').length}`,
              icon: Clock,
            },
            {
              label: 'Draft',
              value: `${invoices.filter((i) => i.status === 'draft').length}`,
              icon: FileText,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
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
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                  Invoice #
                </label>
                <input
                  value={form.invoiceNumber}
                  onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                  Client Name
                </label>
                <input
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                  Client Email
                </label>
                <input
                  value={form.clientEmail}
                  onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                    Tax %
                  </label>
                  <input
                    type="number"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                  Notes
                </label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500">Items</label>
                <button
                  onClick={addItem}
                  className="text-[10px] text-green-400 hover:text-green-300"
                >
                  + Add item
                </button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                    className="w-20 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-green-500/50"
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                    className="w-24 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-green-500/50"
                  />
                  <span className="flex items-center text-sm text-zinc-500 w-24 text-right">
                    {symbol}
                    {item.amount.toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-zinc-900 pt-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-500">Subtotal</span>
                <span>
                  {symbol}
                  {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-500">Tax ({form.taxRate}%)</span>
                <span>
                  {symbol}
                  {taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-zinc-900">
                <span>Total</span>
                <span className="text-green-400">
                  {symbol}
                  {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => createInvoice('create')}
                disabled={sending}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => createInvoice('send')}
                disabled={sending || !form.clientEmail}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Invoice
              </button>
            </div>
          </div>
        )}

        {/* Invoice List */}
        <div className="space-y-2">
          {loading && <div className="text-center py-8 text-zinc-500">Loading invoices...</div>}
          {!loading && invoices.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No invoices yet. Create your first one.</p>
            </div>
          )}
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors"
            >
              <button
                onClick={() => setSelected(inv)}
                className="flex-1 flex items-center gap-4 text-left min-w-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{inv.invoiceNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        STATUS_COLORS[inv.status]
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1 truncate">
                    {inv.clientName || 'No client'}
                    {inv.clientEmail ? ` · ${inv.clientEmail}` : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold">
                    {cur(inv.currency)}
                    {(inv.total || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Due {inv.dueDate}</div>
                </div>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSelected(inv)}
                  title="Open"
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => printInvoice(inv)}
                  title="Print / Download"
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <FileText className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete invoice ${inv.invoiceNumber}?`))
                      postInvoiceAction('delete', inv);
                  }}
                  title="Delete"
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal — open / read / act on an invoice */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selected.invoiceNumber}</h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border ${
                      STATUS_COLORS[selected.status]
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {selected.clientName || 'No client'}
                  {selected.clientEmail ? ` · ${selected.clientEmail}` : ''}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-500 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Items */}
            <div className="rounded-xl border border-zinc-800 overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500">
                    <th className="text-left px-4 py-2 font-normal">Description</th>
                    <th className="text-center px-4 py-2 font-normal">Qty</th>
                    <th className="text-right px-4 py-2 font-normal">Price</th>
                    <th className="text-right px-4 py-2 font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.items || []).map((it, i) => (
                    <tr key={i} className="border-b border-zinc-900 last:border-0">
                      <td className="px-4 py-2 text-white">{it.description || '—'}</td>
                      <td className="px-4 py-2 text-center text-zinc-400">{it.quantity}</td>
                      <td className="px-4 py-2 text-right text-zinc-400">
                        {cur(selected.currency)}
                        {(it.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold">
                        {cur(selected.currency)}
                        {(it.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-zinc-900 pt-4 mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-zinc-500">Subtotal</span>
                <span>
                  {cur(selected.currency)}
                  {(selected.subtotal || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-500">Tax ({selected.taxRate || 0}%)</span>
                <span>
                  {cur(selected.currency)}
                  {(selected.taxAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-zinc-900">
                <span>Total</span>
                <span className="text-green-400">
                  {cur(selected.currency)}
                  {(selected.total || 0).toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-2">Due {selected.dueDate}</div>
              {selected.notes && (
                <div className="mt-3 p-3 rounded-lg bg-zinc-900 text-xs text-zinc-400">
                  <span className="uppercase tracking-widest text-zinc-500 text-[10px] block mb-1">
                    Notes
                  </span>
                  {selected.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => printInvoice(selected)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <FileText className="h-4 w-4" /> Print / Download
              </button>
              {selected.status === 'draft' && (
                <button
                  onClick={() => postInvoiceAction('send', selected)}
                  disabled={actionBusy || !selected.clientEmail}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  title={
                    !selected.clientEmail
                      ? 'Add a client email to send'
                      : 'Finalize & send this draft'
                  }
                >
                  {actionBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}{' '}
                  Send Invoice
                </button>
              )}
              {selected.status === 'sent' && (
                <button
                  onClick={() => postInvoiceAction('markPaid', selected)}
                  disabled={actionBusy}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {actionBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}{' '}
                  Mark Paid
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(`Delete invoice ${selected.invoiceNumber}?`))
                    postInvoiceAction('delete', selected);
                }}
                disabled={actionBusy}
                className="flex items-center gap-2 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ml-auto"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
