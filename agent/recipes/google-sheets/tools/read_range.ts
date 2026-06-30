import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

export default defineTool({
  needsApproval: never(),
  description:
    'Reads a range of cells from a Google Sheet using A1 notation (e.g. "Sheet1!A1:F100").',
  inputSchema: z.object({
    spreadsheetId: z.string(),
    range: z.string(),
  }),
  async execute({ spreadsheetId, range }) {
    const res = await fetch(
      `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_ACCESS_TOKEN ?? ''}`,
        },
      }
    )
    return res.json()
  },
})
