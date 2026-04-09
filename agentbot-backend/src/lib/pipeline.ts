/**
 * Pipeline Verification Gate — PAI Pattern
 *
 * PAI Principle: "Pipelines chain Actions together with mandatory
 * verification between each step."
 *
 * In Agentbot, verification gates ensure each step succeeds before
 * the next one runs. This prevents cascading failures in team
 * provisioning, deployment, and multi-step agent workflows.
 */

/**
 * A single pipeline step with verification.
 */
export interface PipelineStep<TInput = any, TOutput = any> {
  name: string;
  action: (input: TInput) => Promise<TOutput>;
  verify?: (output: TOutput) => Promise<VerificationResult>;
  onFailure: 'abort' | 'retry' | 'continue';
  maxRetries?: number;
}

export interface VerificationResult {
  passed: boolean;
  criterion: string;
  evidence?: string;
}

export interface PipelineResult<T = any> {
  success: boolean;
  steps: Array<{
    name: string;
    passed: boolean;
    output?: T;
    verification?: VerificationResult;
    error?: string;
    attempts: number;
  }>;
  failedAt?: string;
}

/**
 * Execute a pipeline of steps with verification gates.
 *
 * Usage:
 *   const result = await runPipeline([
 *     { name: 'validate', action: validateInput, verify: checkValidation, onFailure: 'abort' },
 *     { name: 'create', action: createResource, verify: checkCreated, onFailure: 'retry', maxRetries: 3 },
 *     { name: 'notify', action: sendNotification, onFailure: 'continue' },
 *   ], initialInput);
 */
export async function runPipeline<TInput, TOutput>(
  steps: PipelineStep<any, any>[],
  initialInput: TInput
): Promise<PipelineResult> {
  const result: PipelineResult = { success: true, steps: [] };
  let currentInput: any = initialInput;

  for (const step of steps) {
    const stepResult: PipelineResult['steps'][0] = {
      name: step.name,
      passed: false,
      attempts: 0,
    };

    const maxAttempts = step.maxRetries != null ? step.maxRetries + 1 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      stepResult.attempts = attempt;

      try {
        const output = await step.action(currentInput);
        stepResult.output = output;

        // Run verification if provided
        if (step.verify) {
          const verification = await step.verify(output);
          stepResult.verification = verification;

          if (!verification.passed) {
            if (step.onFailure === 'retry' && attempt < maxAttempts) {
              console.warn(`[Pipeline] ${step.name} verification failed (attempt ${attempt}/${maxAttempts}): ${verification.criterion}`);
              continue; // retry
            }

            if (step.onFailure === 'abort') {
              stepResult.error = `Verification failed: ${verification.criterion}`;
              result.success = false;
              result.failedAt = step.name;
              result.steps.push(stepResult);
              return result;
            }

            // 'continue' — log warning and proceed
            console.warn(`[Pipeline] ${step.name} verification failed, continuing: ${verification.criterion}`);
          }
        }

        stepResult.passed = true;
        currentInput = output;
        break; // success, move to next step

      } catch (error: any) {
        if (step.onFailure === 'retry' && attempt < maxAttempts) {
          console.warn(`[Pipeline] ${step.name} error (attempt ${attempt}/${maxAttempts}): ${error.message}`);
          continue;
        }

        if (step.onFailure === 'abort') {
          stepResult.error = error.message;
          result.success = false;
          result.failedAt = step.name;
          result.steps.push(stepResult);
          return result;
        }

        // 'continue' — log and proceed
        console.error(`[Pipeline] ${step.name} error, continuing: ${error.message}`);
        stepResult.error = error.message;
      }
    }

    result.steps.push(stepResult);
  }

  return result;
}

/**
 * Pre-built verification checks for common Agentbot operations.
 */
export const Verifiers = {
  /** Verify HTTP response is healthy */
  httpOk: (expectedStatus: number = 200) => async (response: { status: number }) => ({
    passed: response.status === expectedStatus,
    criterion: `HTTP status must be ${expectedStatus}`,
    evidence: `Got ${response.status}`,
  }),

  /** Verify DB record was created */
  recordExists: async (rows: any[]) => ({
    passed: rows.length > 0,
    criterion: 'Database record must exist',
    evidence: `Found ${rows.length} rows`,
  }),

  /** Verify container is running */
  containerRunning: async (status: string) => ({
    passed: status === 'running',
    criterion: 'Container must be running',
    evidence: `Status: ${status}`,
  }),

  /** Verify no TypeScript errors (for deploy pipelines) */
  typeScriptClean: async (exitCode: number) => ({
    passed: exitCode === 0,
    criterion: 'TypeScript compilation must pass',
    evidence: `Exit code: ${exitCode}`,
  }),
};
