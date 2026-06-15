/**
 * utils/fs.js — filesystem helpers
 */

import fs from 'fs/promises';
import path from 'path';
import { OPENCLAW_HOME, DATA_DIR } from '../config/index.js';

export async function ensureDataDir() {
  const dirs = [
    DATA_DIR,
    OPENCLAW_HOME,
    path.join(OPENCLAW_HOME, 'nodes'),
    path.join(OPENCLAW_HOME, 'workspace'),
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}
