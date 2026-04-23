"use workflow"

import { sleep } from "workflow";
import { railwayDeployStep } from "./steps/railway-deploy";
import { waitForHealthCheckStep } from "./steps/health-check";
import { saveMetadataStep } from "./steps/save-metadata";

/**
 * Managed Agent Provisioning Workflow
 * 
 * Execution as a Fact: This durable workflow orchestrates the entire 
 * lifecycle of a managed agent deployment. It is resilient to 
 * serverless timeouts and platform restarts.
 */
export async function provisionManagedAgent(agentId: string, plan: string) {
  console.info(`[Workflow] Starting provisioning for agent ${agentId}`);

  // 1. Trigger the infrastructure deployment (via Railway Proxy on backend)
  const deployResult = await railwayDeployStep(agentId, plan);

  // 2. Wait for the agent to boot and report healthy
  await waitForHealthCheckStep(deployResult.url);

  // 3. Persist the final state
  await saveMetadataStep(agentId, deployResult);

  // 4. Small cooldown to let DNS propagate fully
  await sleep("2s");

  console.info(`[Workflow] Provisioning complete for agent ${agentId}`);

  return {
    success: true,
    agentId,
    url: deployResult.url,
    status: 'active'
  };
}
