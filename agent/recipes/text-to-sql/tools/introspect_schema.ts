import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { db } from '../lib/db'

export default defineTool({
  needsApproval: never(),
  description:
    'Lists the database tables and their columns so you can write correct SQL.',
  inputSchema: z.object({}),
  async execute() {
    const tables = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    )
    const schema: Record<string, unknown> = {}
    for (const row of tables.rows) {
      const name = String(row.name)
      const info = await db.execute(`PRAGMA table_info(${name})`)
      schema[name] = info.rows.map((c) => ({ name: c.name, type: c.type }))
    }
    return { schema }
  },
})
