import { randomBytes } from 'crypto';
import { Router } from 'express';

const router = Router();

// In-memory store for demo; replace with DB in production
const inviteCodes: Record<string, { used: boolean }> = {};

// Generate a new invite code
router.post('/generate', (req, res) => {
  const code = randomBytes(6).toString('hex');
  inviteCodes[code] = { used: false };
  res.json({ code });
});

// Validate invite code
router.post('/validate', (req, res) => {
  const { code } = req.body;
  if (!code || !inviteCodes[code] || inviteCodes[code].used) {
    return res.status(400).json({ valid: false });
  }
  inviteCodes[code].used = true;
  res.json({ valid: true });
});

export default router;
