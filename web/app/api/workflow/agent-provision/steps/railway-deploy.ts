"use step"

import { signedFetch } from '@/app/lib/backend-client';

/**
 * Step: Trigger Railway Deployment
 * 
 * Execution as a Fact: This step delegates the actual infrastructure
 * orchestration to the Express backend (running on Railway) to bypass
 * IP blocking, while maintaining the durable workflow's state.
 */
export async function railwayDeployStep(agentId: string, plan: string) {
  console.info(`[Workflow/Step] Deploying agent ${agentId} on plan ${plan}`);
  
  // This is a platform-initiated infrastructure step with no interactive user
  // in scope. /api/railway/provision authenticates the user context but does
  // not use the identity, so we sign a stable service context so the call
  // still passes once HMAC enforcement is enabled.
  const res = await signedFetch('/api/railway/provision', {
    method: 'POST',
    body: JSON.stringify({ agentId, plan }),
  }, {
    id: 'service:agent-provision',
    email: '',
    role: 'service',
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Railway deployment failed: ${error}`);
  }
  
  const data = await res.json();
  console.info(`[Workflow/Step] Deployment triggered: ${data.url}`);
  return data;
}
