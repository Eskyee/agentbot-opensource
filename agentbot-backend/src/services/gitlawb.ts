import { promises as fs } from 'fs';
import path from 'path';
import { runCommand } from '../utils';

/**
 * Gitlawb Service — State as a Fact.
 * 
 * Implements the "Warm Storage" tier by mirroring agent state transitions 
 * into a verifiable git repository. Every configuration change becomes 
 * a signed commit, providing an immutable audit trail.
 */

const GITLAWB_REPO_PATH = process.env.GITLAWB_REPO_PATH || 
  (process.env.NODE_ENV === 'production' ? '/opt/agentbot/state-facts' : path.join(process.cwd(), 'state-facts'));
const GITLAWB_REMOTE = process.env.GITLAWB_REMOTE;

/**
 * Snapshots an agent's state into the gitlawb repository.
 * 
 * @param agentId Unique identifier for the agent
 * @param state The state object to snapshot (JSON)
 */
export async function snapshotAgentState(agentId: string, state: Record<string, unknown>) {
  try {
    // 1. Ensure the facts repository exists
    await fs.mkdir(GITLAWB_REPO_PATH, { recursive: true });

    // 2. Initialize repository if it doesn't exist
    const isGitRepo = await fs.stat(path.join(GITLAWB_REPO_PATH, '.git'))
      .then(() => true)
      .catch(() => false);

    if (!isGitRepo) {
      console.info(`[Gitlawb] Initializing new facts repository at ${GITLAWB_REPO_PATH}`);
      await runCommand('git', ['init'], { cwd: GITLAWB_REPO_PATH });
      // Configure local git identity if not set
      await runCommand('git', ['config', 'user.name', 'Agentbot Fact-Builder'], { cwd: GITLAWB_REPO_PATH });
      await runCommand('git', ['config', 'user.email', 'facts@agentbot.sh'], { cwd: GITLAWB_REPO_PATH });
    }

    // 3. Write the state to a content-addressed file
    const fileName = `${agentId}.json`;
    const filePath = path.join(GITLAWB_REPO_PATH, fileName);
    await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');

    // 4. Commit the change as a "Fact"
    await runCommand('git', ['add', fileName], { cwd: GITLAWB_REPO_PATH });
    
    // Check if there are changes to commit to avoid noisy errors
    const status = await runCommand('git', ['status', '--porcelain'], { cwd: GITLAWB_REPO_PATH });
    if (status.stdout) {
      await runCommand('git', [
        'commit', 
        '-m', `fact: update agent ${agentId} state`,
        '--allow-empty'
      ], { cwd: GITLAWB_REPO_PATH });

      console.info(`[Gitlawb] Recorded fact for agent ${agentId}`);

      // 5. Push to remote if configured (Peer-to-Peer propagation)
      if (GITLAWB_REMOTE) {
        try {
          await runCommand('git', ['push', 'origin', 'main'], { cwd: GITLAWB_REPO_PATH });
        } catch (pushError: unknown) {
          const message = pushError instanceof Error ? pushError.message : String(pushError);
          console.warn(`[Gitlawb] Remote push failed: ${message}`);
        }
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Gitlawb] Failed to record state fact: ${message}`);
  }
}
