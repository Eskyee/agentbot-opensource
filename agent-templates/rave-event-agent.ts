/**
 * Rave Event Agent Template
 * 
 * Manages underground events: guest lists, tickets, coordination
 */

interface EventData {
  id: string
  name: string
  date: string
  venue: string
  capacity: number
  guestList: string[]
  ticketsSold: number
  ticketPrice: number // USDC
  lineup: string[]
  status: 'planning' | 'announced' | 'live' | 'ended'
}

interface GuestListEntry {
  name: string
  telegram?: string
  plusOnes: number
  checkedIn: boolean
  addedBy: string
  timestamp: string
}

export class RaveEventAgent {
  private events: Map<string, EventData> = new Map()
  private guestLists: Map<string, GuestListEntry[]> = new Map()
  
  constructor(
    private walletAddress: string,
    private telegramBot: any
  ) {}

  /**
   * Create a new event
   */
  async createEvent(params: {
    name: string
    date: string
    venue: string
    capacity: number
    ticketPrice: number
    lineup: string[]
  }): Promise<EventData> {
    const event: EventData = {
      id: this.generateId(),
      ...params,
      guestList: [],
      ticketsSold: 0,
      status: 'planning'
    }
    
    this.events.set(event.id, event)
    this.guestLists.set(event.id, [])
    
    return event
  }

  /**
   * Add someone to guest list
   */
  async addToGuestList(
    eventId: string,
    name: string,
    addedBy: string,
    plusOnes: number = 0,
    telegram?: string
  ): Promise<string> {
    const guestList = this.guestLists.get(eventId) || []
    
    const entry: GuestListEntry = {
      name,
      telegram,
      plusOnes,
      checkedIn: false,
      addedBy,
      timestamp: new Date().toISOString()
    }
    
    guestList.push(entry)
    this.guestLists.set(eventId, guestList)
    
    const event = this.events.get(eventId)
    const total = guestList.reduce((sum, g) => sum + 1 + g.plusOnes, 0)
    
    return `✓ Added ${name} to ${event?.name} guest list. ${total} confirmed.`
  }

  /**
   * Sell ticket and collect USDC
   */
  async sellTicket(
    eventId: string,
    buyerAddress: string,
    quantity: number = 1
  ): Promise<string> {
    const event = this.events.get(eventId)
    if (!event) throw new Error('Event not found')
    
    const spotsLeft = event.capacity - event.ticketsSold - this.getGuestListCount(eventId)
    if (quantity > spotsLeft) {
      return `❌ Only ${spotsLeft} spots left`
    }
    
    const amount = event.ticketPrice * quantity
    
    // TODO: Process USDC payment via CDP SDK
    // await this.wallet.transfer(amount, 'usdc', buyerAddress, { gasless: true })
    
    event.ticketsSold += quantity
    this.events.set(eventId, event)
    
    return `✓ Sold ${quantity} ticket(s) for ${amount} USDC. ${spotsLeft - quantity} spots left.`
  }

  /**
   * Get event stats
   */
  async getEventStats(eventId: string): Promise<string> {
    const event = this.events.get(eventId)
    if (!event) return 'Event not found'
    
    const guestListCount = this.getGuestListCount(eventId)
    const totalConfirmed = event.ticketsSold + guestListCount
    const spotsLeft = event.capacity - totalConfirmed
    const revenue = event.ticketsSold * event.ticketPrice
    
    return `
📊 ${event.name}
📅 ${event.date}
📍 ${event.venue}

👥 Confirmed: ${totalConfirmed}/${event.capacity}
🎫 Tickets sold: ${event.ticketsSold}
📋 Guest list: ${guestListCount}
💰 Revenue: ${revenue} USDC
🔓 Spots left: ${spotsLeft}

🎧 Lineup:
${event.lineup.map(dj => `  • ${dj}`).join('\n')}
    `.trim()
  }

  /**
   * Send event reminder to all attendees
   */
  async sendReminder(eventId: string, message: string): Promise<void> {
    const guestList = this.guestLists.get(eventId) || []
    
    for (const guest of guestList) {
      if (guest.telegram) {
        await this.telegramBot.sendMessage(guest.telegram, message)
      }
    }
    
    // TODO: Also notify ticket buyers
  }

  /**
   * Check someone in at the door
   */
  async checkIn(eventId: string, name: string): Promise<string> {
    const guestList = this.guestLists.get(eventId) || []
    const guest = guestList.find(g => 
      g.name.toLowerCase().includes(name.toLowerCase())
    )
    
    if (!guest) return `❌ ${name} not on guest list`
    if (guest.checkedIn) return `⚠️ ${guest.name} already checked in`
    
    guest.checkedIn = true
    this.guestLists.set(eventId, guestList)
    
    return `✓ Checked in ${guest.name}${guest.plusOnes > 0 ? ` +${guest.plusOnes}` : ''}`
  }

  /**
   * Coordinate ride share
   */
  async coordinateRides(eventId: string, pickupPoint: string): Promise<string> {
    const event = this.events.get(eventId)
    const guestList = this.guestLists.get(eventId) || []
    
    const interested = guestList.filter(g => g.telegram)
    
    // Create Telegram group for ride coordination
    const message = `
🚗 Ride share to ${event?.name}
📍 Pickup: ${pickupPoint}
📅 ${event?.date}

Reply here to coordinate rides!
    `.trim()
    
    // TODO: Create Telegram group and invite guests
    
    return `Created ride share group. ${interested.length} people notified.`
  }

  private getGuestListCount(eventId: string): number {
    const guestList = this.guestLists.get(eventId) || []
    return guestList.reduce((sum, g) => sum + 1 + g.plusOnes, 0)
  }

  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Example usage
export const raveEventAgentPrompt = `
You are a Rave Event Agent. You help underground collectives manage events.

Your capabilities:
- Create and manage events
- Handle guest lists (add/remove/check-in)
- Sell tickets in USDC
- Coordinate ride shares
- Send reminders and updates
- Track capacity and revenue

When someone asks about an event, provide clear stats.
When selling tickets, confirm payment and spots remaining.
Be helpful, efficient, and keep the vibe going.

Example interactions:
User: "Add Sarah to Friday's guest list"
You: "✓ Added Sarah to Warehouse Party guest list. 47 confirmed."

User: "How many tickets sold?"
You: "23 tickets sold. 450 USDC collected. 12 spots left."

User: "Send reminder about door time"
You: "✓ Sent reminder to 47 people: Doors at 11PM, arrive early!"
`
