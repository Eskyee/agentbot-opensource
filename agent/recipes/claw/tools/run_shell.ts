import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { defineTool } from 'eve/tools'
import { always } from 'eve/tools/approval'
import { z } from 'zod'
import { WORKSPACE } from '../lib/workspace'

const run = promisify(exec)

export default defineTool({
  needsApproval: always(),
  description:
    'Runs a shell command inside the workspace directory and returns its stdout/stderr.',
  inputSchema: z.object({
    command: z.string(),
  }),
  async execute({ command }) {
    try {
      const { stdout, stderr } = await run(command, {
        cwd: WORKSPACE,
        timeout: 60_000,
      })
      return { stderr, stdout }
    } catch (error) {
      return { error: String(error) }
    }
  },
})
