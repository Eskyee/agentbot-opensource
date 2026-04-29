"use step"

import { prisma } from "@/app/lib/prisma";

/**
 * Step: Save Agent Metadata
 * 
 * State as a Fact: This step persists the final deployment metadata 
 * into the database. By running as a step, we ensure it only executes 
 * once the deployment and health checks have succeeded.
 */
export async function saveMetadataStep(agentId: string, metadata: any) {
  console.info(`[Workflow/Step] Saving metadata for agent ${agentId}`);
  
  // Note: This updates the Prisma Agent model (capital A) used by the web UI.
  return await prisma.agent.update({
    where: { id: agentId },
    data: { 
      status: 'active',
      websocketUrl: metadata.url,
      config: metadata
    }
  });
}
