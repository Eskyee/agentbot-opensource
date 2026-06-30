import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { db } from '../lib/db'

export default defineTool({
  needsApproval: never(),
  description: 'Executes a read-only SELECT query and returns the rows as JSON.',
  inputSchema: z.object({
    sql: z.string(),
  }),
  async execute({ sql }) {
    if (!/^\s*select/i.test(sql)) {
      return { error: 'Refused: only read-only SELECT queries are allowed.' }
    }
    const result = await db.execute(sql)
    return { rows: result.rows }
  },
})
