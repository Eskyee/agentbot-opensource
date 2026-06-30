import { defineTool } from 'eve/tools'
import { always } from 'eve/tools/approval'
import { z } from 'zod'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

export default defineTool({
  needsApproval: always(),
  description:
    'Writes a 2D array of values to a range in a Google Sheet using A1 notation.',
  inputSchema: z.object({
    spreadsheetId: z.string(),
    range: z.string(),
    values: z.array(z.array(z.union([z.string(), z.number()]))),
  }),
  async execute({ spreadsheetId, range, values }) {
    const res = await fetch(
      `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GOOGLE_ACCESS_TOKEN ?? ''}`,
        },
        body: JSON.stringify({ range, values }),
      }
    )
    return res.json()
  },
})
