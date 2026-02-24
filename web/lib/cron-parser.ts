// Natural language to cron converter
// Examples:
// "every day at 9am" -> "0 9 * * *"
// "every monday at 2pm" -> "0 14 * * 1"
// "every 6 hours" -> "0 */6 * * *"

const patterns = [
  {
    regex: /every day at (\d+)(am|pm)/i,
    convert: (match: RegExpMatchArray) => {
      let hour = parseInt(match[1])
      if (match[2].toLowerCase() === 'pm' && hour !== 12) hour += 12
      if (match[2].toLowerCase() === 'am' && hour === 12) hour = 0
      return `0 ${hour} * * *`
    }
  },
  {
    regex: /every (monday|tuesday|wednesday|thursday|friday|saturday|sunday) at (\d+)(am|pm)/i,
    convert: (match: RegExpMatchArray) => {
      const days: Record<string, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 }
      let hour = parseInt(match[2])
      if (match[3].toLowerCase() === 'pm' && hour !== 12) hour += 12
      if (match[3].toLowerCase() === 'am' && hour === 12) hour = 0
      return `0 ${hour} * * ${days[match[1].toLowerCase()]}`
    }
  },
  {
    regex: /every (\d+) hours?/i,
    convert: (match: RegExpMatchArray) => `0 */${match[1]} * * *`
  },
  {
    regex: /every (\d+) minutes?/i,
    convert: (match: RegExpMatchArray) => `*/${match[1]} * * * *`
  },
  {
    regex: /every hour/i,
    convert: () => `0 * * * *`
  },
  {
    regex: /every week/i,
    convert: () => `0 9 * * 1`
  },
  {
    regex: /every month/i,
    convert: () => `0 9 1 * *`
  }
]

export function naturalToCron(text: string): string | null {
  const normalized = text.toLowerCase().trim()
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex)
    if (match) {
      return pattern.convert(match)
    }
  }
  
  return null
}

export function cronToNatural(cron: string): string {
  const parts = cron.split(' ')
  
  // Simple conversions
  if (cron === '0 9 * * *') return 'Every day at 9am'
  if (cron === '0 */6 * * *') return 'Every 6 hours'
  if (cron === '0 9 * * 1') return 'Every Monday at 9am'
  if (cron === '0 9 1 * *') return 'First day of every month at 9am'
  
  return cron
}
