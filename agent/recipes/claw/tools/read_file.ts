import { readFile } from 'node:fs/promises'
import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { resolveInWorkspace } from '../lib/workspace'

export default defineTool({
  needsApproval: never(),
  description: 'Reads a UTF-8 file from the workspace.',
  inputSchema: z.object({
    path: z.string(),
  }),
  async execute({ path }) {
    const content = await readFile(resolveInWorkspace(path), 'utf-8')
    return { content, path }
  },
})
