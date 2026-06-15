/**
 * Input Validation Utility — Deterministic, Code-First
 *
 * PAI Principle #5: As Deterministic as Possible
 * PAI Principle #6: Code Before Prompts
 *
 * Validation rules are code, not prompts. Same input → Same output.
 * Use these in route handlers before database operations.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a string field
 */
export function validateString(
  value: unknown,
  name: string,
  opts: { required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp } = {}
): ValidationResult {
  const { required = true, minLength = 1, maxLength = 10000, pattern } = opts;

  if (value == null || value === '') {
    if (required) return { valid: false, error: `${name} is required` };
    return { valid: true };
  }

  if (typeof value !== 'string') {
    return { valid: false, error: `${name} must be a string` };
  }

  if (value.length < minLength) {
    return { valid: false, error: `${name} must be at least ${minLength} characters` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${name} must be at most ${maxLength} characters` };
  }

  if (pattern && !pattern.test(value)) {
    return { valid: false, error: `${name} has invalid format` };
  }

  return { valid: true };
}

/**
 * Validate a number field
 */
export function validateNumber(
  value: unknown,
  name: string,
  opts: { required?: boolean; min?: number; max?: number; integer?: boolean } = {}
): ValidationResult {
  const { required = true, min = -Infinity, max = Infinity, integer = false } = opts;

  if (value == null) {
    if (required) return { valid: false, error: `${name} is required` };
    return { valid: true };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${name} must be a number` };
  }

  if (integer && !Number.isInteger(value)) {
    return { valid: false, error: `${name} must be an integer` };
  }

  if (value < min) {
    return { valid: false, error: `${name} must be at least ${min}` };
  }

  if (value > max) {
    return { valid: false, error: `${name} must be at most ${max}` };
  }

  return { valid: true };
}

/**
 * Validate an array field
 */
export function validateArray(
  value: unknown,
  name: string,
  opts: { required?: boolean; minLength?: number; maxLength?: number } = {}
): ValidationResult {
  const { required = true, minLength = 0, maxLength = 1000 } = opts;

  if (value == null || !Array.isArray(value)) {
    if (required) return { valid: false, error: `${name} must be an array` };
    return { valid: true };
  }

  if (value.length < minLength) {
    return { valid: false, error: `${name} must have at least ${minLength} items` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${name} must have at most ${maxLength} items` };
  }

  return { valid: true };
}

/**
 * Validate multiple fields at once. Returns first error or null if all valid.
 */
export function validateAll(
  checks: ValidationResult[]
): { valid: boolean; error?: string } {
  for (const check of checks) {
    if (!check.valid) return check;
  }
  return { valid: true };
}

/**
 * Express middleware helper — validates body against a schema.
 * Returns 400 with the first validation error.
 *
 * Usage:
 *   router.post('/events', authenticate, validateBody(eventSchema), handler)
 */
type Schema = Record<string, (value: unknown) => ValidationResult>;

export function validateBody(schema: Schema) {
  return (req: any, res: any, next: any) => {
    for (const [field, checker] of Object.entries(schema)) {
      const result = checker(req.body[field]);
      if (!result.valid) {
        return res.status(400).json({ error: result.error });
      }
    }
    next();
  };
}
