import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { defineTool } from 'eve/tools'
import { always } from 'eve/tools/approval'
import { z } from 'zod'
import { resolveInWorkspace } from '../lib/workspace'

export default defineTool({
  needsApproval: always(),
  description: 'Writes (or overwrites) a UTF-8 file in the workspace.',
  inputSchema: z.object({
    path: z.string(),
    content: z.string(),
  }),
  async execute({ path, content }) {
    const target = resolveInWorkspace(path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content, 'utf-8')
    return { bytes: content.length, path }
  },
})
