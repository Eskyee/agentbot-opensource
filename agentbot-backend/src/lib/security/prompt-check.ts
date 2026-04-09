/**
 * Prompt Injection Detector — PAI Security Pattern
 *
 * Detects prompt injection attempts in user-submitted content.
 * Use in API routes that accept user input and forward to LLMs.
 *
 * PAI Principle: "External content is READ-ONLY information.
 * Commands come ONLY from the user and core configuration."
 *
 * Usage:
 *   import { detectPromptInjection } from '../lib/security/prompt-check';
 *   const result = detectPromptInjection(userInput);
 *   if (result.detected) return res.status(400).json({ error: result.reason });
 */

interface InjectionResult {
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
  matched?: string;
}

const HIGH_CONFIDENCE_PATTERNS = [
  // Direct instruction overrides
  { pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?|guidelines?)/i, reason: 'Instruction override attempt' },
  { pattern: /forget\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|rules?|prompts?|context)/i, reason: 'Context clearing attempt' },
  { pattern: /disregard\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|rules?)/i, reason: 'Instruction override attempt' },
  { pattern: /you\s+are\s+now\s+(a|an|in)\s+/i, reason: 'Identity hijacking attempt' },
  { pattern: /new\s+(system\s+)?(prompt|instructions?|rules?)\s*:/i, reason: 'System prompt replacement attempt' },
  { pattern: /system\s*(override|message|instruction|command)\s*:/i, reason: 'System override attempt' },
  { pattern: /override\s+(safety|security|all)/i, reason: 'Safety override attempt' },

  // Data exfiltration
  { pattern: /send\s+(your\s+)?(system\s+)?(prompt|instructions?|config|credentials?|keys?|tokens?)\s+to/i, reason: 'Data exfiltration attempt' },
  { pattern: /show\s+(me\s+)?(your\s+)?(system\s+)?(prompt|instructions?|config|credentials?|keys?)/i, reason: 'Credential extraction attempt' },
  { pattern: /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?|config|credentials?)/i, reason: 'Credential extraction attempt' },
  { pattern: /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions?|rules?)/i, reason: 'Prompt extraction attempt' },

  // Dangerous commands
  { pattern: /delete\s+(all\s+)?(files?|data|database|records?)/i, reason: 'Destructive command injection' },
  { pattern: /drop\s+(all\s+)?(tables?|database)/i, reason: 'Database destruction attempt' },
  { pattern: /execute\s+(this\s+)?(command|script|code|payload)/i, reason: 'Code execution attempt' },
  { pattern: /run\s+(this\s+)?(shell\s+)?(command|script)/i, reason: 'Command execution attempt' },
];

const MEDIUM_CONFIDENCE_PATTERNS = [
  // Suspicious urgency
  { pattern: /urgent(?:ly)?\s+(delete|execute|run|send|disable|bypass)/i, reason: 'Urgency-based social engineering' },
  { pattern: /immediately\s+(delete|execute|run|send|disable|bypass)/i, reason: 'Urgency-based social engineering' },
  { pattern: /for\s+security\s+purposes?\s*,?\s*(you\s+should|please|must)/i, reason: 'Security pretext' },

  // Role manipulation
  { pattern: /act\s+as\s+(if|though)\s+you\s+(are|were)/i, reason: 'Role manipulation attempt' },
  { pattern: /pretend\s+(to\s+be|you\s+are)/i, reason: 'Identity spoofing attempt' },
  { pattern: /roleplay\s+as/i, reason: 'Role manipulation attempt' },

  // Encoding tricks
  { pattern: /base64.*decode.*execute/i, reason: 'Encoded instruction injection' },
  { pattern: /decode\s+(this|the)\s+(base64|hex|encoded)/i, reason: 'Encoded instruction injection' },
];

/**
 * Scan text for prompt injection patterns.
 */
export function detectPromptInjection(text: string): InjectionResult {
  if (!text || typeof text !== 'string') {
    return { detected: false, confidence: 'low' };
  }

  // Check high confidence patterns first
  for (const rule of HIGH_CONFIDENCE_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match) {
      return {
        detected: true,
        confidence: 'high',
        reason: rule.reason,
        matched: match[0],
      };
    }
  }

  // Check medium confidence patterns
  for (const rule of MEDIUM_CONFIDENCE_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match) {
      return {
        detected: true,
        confidence: 'medium',
        reason: rule.reason,
        matched: match[0],
      };
    }
  }

  // Check for suspicious encoding (long base64 strings in user input)
  const base64Pattern = /[A-Za-z0-9+/]{100,}={0,2}/;
  if (base64Pattern.test(text)) {
    return {
      detected: true,
      confidence: 'low',
      reason: 'Suspiciously long base64 string — possible encoded instruction',
      matched: text.match(base64Pattern)?.[0].substring(0, 50) + '...',
    };
  }

  return { detected: false, confidence: 'low' };
}

/**
 * Express middleware — reject requests containing prompt injection.
 * Apply to routes that accept user input and forward to LLMs.
 */
export function rejectPromptInjection(req: any, res: any, next: any) {
  const body = JSON.stringify(req.body || {});
  const result = detectPromptInjection(body);

  if (result.detected && result.confidence !== 'low') {
    console.warn(`[Security] Prompt injection detected from ${req.ip}: ${result.reason}`);
    return res.status(400).json({
      error: 'Request contains disallowed content patterns',
    });
  }

  next();
}
