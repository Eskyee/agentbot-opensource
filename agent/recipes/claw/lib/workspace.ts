import path from 'node:path'

/** Root of the sandbox. Everything the agent reads/writes stays under here. */
export const WORKSPACE = path.resolve(process.env.WORKSPACE_DIR ?? 'workspace')

/** Resolves a user-supplied path and refuses anything that escapes the sandbox. */
export function resolveInWorkspace(relativePath: string): string {
  const resolved = path.resolve(WORKSPACE, relativePath)
  if (resolved !== WORKSPACE && !resolved.startsWith(WORKSPACE + path.sep)) {
    throw new Error(`Path escapes the workspace: ${relativePath}`)
  }
  return resolved
}
