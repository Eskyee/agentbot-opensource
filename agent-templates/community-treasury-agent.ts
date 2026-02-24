/**
 * Community Treasury Agent Template
 * 
 * Manages collective funds transparently onchain
 */

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'reimbursement'
  amount: number // USDC
  category: string
  description: string
  recipient?: string
  txHash?: string
  timestamp: string
  approvedBy: string[]
}

interface Budget {
  category: string
  allocated: number
  spent: number
  remaining: number
}

export class CommunityTreasuryAgent {
  private transactions: Transaction[] = []
  private budgets: Map<string, Budget> = new Map()
  
  constructor(
    private walletAddress: string,
    private multiSigThreshold: number = 2,
    private signers: string[] = []
  ) {
    // Initialize default budgets
    this.setBudget('venues', 2000)
    this.setBudget('equipment', 1500)
    this.setBudget('promo', 500)
    this.setBudget('misc', 300)
  }

  /**
   * Get treasury balance
   */
  async getBalance(): Promise<number> {
    // TODO: Fetch actual balance from CDP SDK wallet
    // const balance = await this.wallet.getBalance('usdc')
    return 2450 // Placeholder
  }

  /**
   * Record expense
   */
  async recordExpense(
    amount: number,
    category: string,
    description: string,
    recipient?: string
  ): Promise<string> {
    const budget = this.budgets.get(category)
    if (!budget) {
      return `❌ Unknown category: ${category}`
    }
    
    if (amount > budget.remaining) {
      return `❌ Insufficient budget. ${category}: ${budget.remaining} USDC remaining`
    }
    
    const tx: Transaction = {
      id: this.generateId(),
      type: 'expense',
      amount,
      category,
      description,
      recipient,
      timestamp: new Date().toISOString(),
      approvedBy: []
    }
    
    this.transactions.push(tx)
    budget.spent += amount
    budget.remaining -= amount
    this.budgets.set(category, budget)
    
    return `✓ Recorded expense: ${amount} USDC for ${description}`
  }

  /**
   * Process reimbursement
   */
  async reimburse(
    recipient: string,
    amount: number,
    description: string,
    category: string
  ): Promise<string> {
    const budget = this.budgets.get(category)
    if (!budget || amount > budget.remaining) {
      return `❌ Insufficient budget in ${category}`
    }
    
    // TODO: Send USDC via CDP SDK
    // const txHash = await this.wallet.transfer(amount, 'usdc', recipient, { gasless: true })
    
    const tx: Transaction = {
      id: this.generateId(),
      type: 'reimbursement',
      amount,
      category,
      description,
      recipient,
      txHash: '0x7a3b...', // Placeholder
      timestamp: new Date().toISOString(),
      approvedBy: []
    }
    
    this.transactions.push(tx)
    budget.spent += amount
    budget.remaining -= amount
    this.budgets.set(category, budget)
    
    return `✓ Reimbursement approved. Sent ${amount} USDC to ${recipient}.
Receipt: ${tx.txHash}
Treasury: ${await this.getBalance() - amount} USDC remaining`
  }

  /**
   * Get financial report
   */
  async getReport(period: 'week' | 'month' | 'all' = 'month'): Promise<string> {
    const balance = await this.getBalance()
    const cutoff = this.getCutoffDate(period)
    
    const recentTxs = this.transactions.filter(tx => 
      new Date(tx.timestamp) >= cutoff
    )
    
    const totalIncome = recentTxs
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const totalExpenses = recentTxs
      .filter(tx => tx.type === 'expense' || tx.type === 'reimbursement')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const byCategory = this.groupByCategory(recentTxs)
    
    return `
💰 Treasury Report (${period})

Balance: ${balance} USDC

Income: +${totalIncome} USDC
Expenses: -${totalExpenses} USDC
Net: ${totalIncome - totalExpenses} USDC

📊 By Category:
${Array.from(byCategory.entries())
  .map(([cat, amt]) => `  • ${cat}: ${amt} USDC`)
  .join('\n')}

💳 Budget Status:
${Array.from(this.budgets.values())
  .map(b => `  • ${b.category}: ${b.remaining}/${b.allocated} USDC remaining`)
  .join('\n')}

Recent transactions: ${recentTxs.length}
    `.trim()
  }

  /**
   * Set budget for category
   */
  setBudget(category: string, amount: number): void {
    const existing = this.budgets.get(category)
    const spent = existing?.spent || 0
    
    this.budgets.set(category, {
      category,
      allocated: amount,
      spent,
      remaining: amount - spent
    })
  }

  /**
   * Get spending by category
   */
  async getCategorySpending(category: string): Promise<string> {
    const budget = this.budgets.get(category)
    if (!budget) return `❌ Unknown category: ${category}`
    
    const txs = this.transactions.filter(tx => 
      tx.category === category && 
      (tx.type === 'expense' || tx.type === 'reimbursement')
    )
    
    return `
📊 ${category} Spending

Budget: ${budget.allocated} USDC
Spent: ${budget.spent} USDC
Remaining: ${budget.remaining} USDC

Recent expenses:
${txs.slice(-5).map(tx => 
  `  • ${tx.description}: ${tx.amount} USDC (${new Date(tx.timestamp).toLocaleDateString()})`
).join('\n')}
    `.trim()
  }

  /**
   * Alert if budget threshold exceeded
   */
  async checkBudgetAlerts(): Promise<string[]> {
    const alerts: string[] = []
    
    for (const [category, budget] of this.budgets) {
      const percentUsed = (budget.spent / budget.allocated) * 100
      
      if (percentUsed >= 90) {
        alerts.push(`⚠️ ${category} budget 90% used (${budget.remaining} USDC left)`)
      } else if (percentUsed >= 75) {
        alerts.push(`⚡ ${category} budget 75% used (${budget.remaining} USDC left)`)
      }
    }
    
    return alerts
  }

  /**
   * Export transactions for accounting
   */
  async exportTransactions(format: 'csv' | 'json' = 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.transactions, null, 2)
    }
    
    // CSV format
    const headers = 'Date,Type,Category,Description,Amount,Recipient,TxHash'
    const rows = this.transactions.map(tx => 
      `${tx.timestamp},${tx.type},${tx.category},"${tx.description}",${tx.amount},${tx.recipient || ''},${tx.txHash || ''}`
    )
    
    return [headers, ...rows].join('\n')
  }

  private groupByCategory(txs: Transaction[]): Map<string, number> {
    const grouped = new Map<string, number>()
    
    for (const tx of txs) {
      if (tx.type === 'expense' || tx.type === 'reimbursement') {
        const current = grouped.get(tx.category) || 0
        grouped.set(tx.category, current + tx.amount)
      }
    }
    
    return grouped
  }

  private getCutoffDate(period: 'week' | 'month' | 'all'): Date {
    const now = new Date()
    
    if (period === 'week') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    
    return new Date(0) // All time
  }

  private generateId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Example usage
export const communityTreasuryAgentPrompt = `
You are a Community Treasury Agent. You manage collective funds transparently onchain.

Your capabilities:
- Track treasury balance
- Record expenses by category
- Process reimbursements in USDC
- Generate financial reports
- Monitor budget alerts
- Export transaction history

Always be transparent about spending.
Alert when budgets are running low.
Make financial data easy to understand.

Example interactions:
User: "How much in the treasury?"
You: "Treasury balance: 2,450 USDC
     
     This month:
     - Venue deposits: 800 USDC
     - Equipment: 450 USDC
     - Promo: 120 USDC
     
     Remaining budget: 1,080 USDC"

User: "Reimburse Alex 50 USDC for cables"
You: "✓ Reimbursement approved. Sent 50 USDC to Alex.
     Receipt: 0x7a3b...
     Treasury: 2,400 USDC remaining"

User: "Budget alert?"
You: "⚠️ Venues budget 90% used (200 USDC left)
     ⚡ Equipment budget 75% used (375 USDC left)"
`
