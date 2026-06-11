'use client'

import { useState } from 'react'
import { Download, FileText, Calendar, Filter } from 'lucide-react'

interface ExportRow {
  date: string
  description: string
  category: string
  amount: number
  currency: string
  type: 'income' | 'expense'
}

const DEMO_DATA: ExportRow[] = [
  { date: '2026-06-10', description: 'Client Payment - Project Alpha', category: 'Income', amount: 2500, currency: 'GBP', type: 'income' },
  { date: '2026-06-09', description: 'AWS Hosting', category: 'Expense', amount: -142.50, currency: 'GBP', type: 'expense' },
  { date: '2026-06-08', description: 'Freelance Work - Beta', category: 'Income', amount: 1800, currency: 'GBP', type: 'income' },
  { date: '2026-06-05', description: 'Office Supplies', category: 'Expense', amount: -67.20, currency: 'GBP', type: 'expense' },
  { date: '2026-06-03', description: 'Consulting - Gamma', category: 'Income', amount: 3200, currency: 'GBP', type: 'income' },
]

export default function ExportPage() {
  const [data] = useState<ExportRow[]>(DEMO_DATA)
  const [dateFrom, setDateFrom] = useState('2026-06-01')
  const [dateTo, setDateTo] = useState('2026-06-30')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const filtered = data.filter((row) => {
    const matchDate = row.date >= dateFrom && row.date <= dateTo
    const matchCategory = categoryFilter === 'All' || row.category === categoryFilter
    return matchDate && matchCategory
  })

  const totalIncome = filtered.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpenses = filtered.filter((r) => r.type === 'expense').reduce((s, r) => s + Math.abs(r.amount), 0)
  const netProfit = totalIncome - totalExpenses

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Type']
    const rows = filtered.map((r) => [r.date, r.description, r.category, r.amount, r.currency, r.type])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agentbot-export-${dateFrom}-to-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono pt-14">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-2">Finance</div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">Export</h1>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-600" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
              <span className="text-zinc-600">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              <option value="All">All Categories</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Income</div>
            <div className="mt-2 text-2xl font-bold text-green-400">£{totalIncome.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Expenses</div>
            <div className="mt-2 text-2xl font-bold text-red-400">£{totalExpenses.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Net Profit</div>
            <div className={`mt-2 text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>£{netProfit.toFixed(2)}</div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-[10px] uppercase tracking-widest text-zinc-600 px-4 py-3">Date</th>
                <th className="text-left text-[10px] uppercase tracking-widest text-zinc-600 px-4 py-3">Description</th>
                <th className="text-left text-[10px] uppercase tracking-widest text-zinc-600 px-4 py-3">Category</th>
                <th className="text-right text-[10px] uppercase tracking-widest text-zinc-600 px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                  <td className="px-4 py-3 text-sm text-zinc-400">{row.date}</td>
                  <td className="px-4 py-3 text-sm text-white">{row.description}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{row.category}</td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${row.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    £{Math.abs(row.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
