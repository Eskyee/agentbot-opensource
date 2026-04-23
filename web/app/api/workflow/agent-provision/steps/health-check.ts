"use step"

import { sleep } from "workflow";

/**
 * Step: Wait for Agent Health Check
 * 
 * Durable Execution: This step polls the newly deployed agent's health 
 * endpoint. Because it runs within a durable workflow, it can safely 
 * wait for minutes across platform restarts.
 */
export async function waitForHealthCheckStep(url: string) {
  console.info(`[Workflow/Step] Waiting for health check at ${url}/health`);
  
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes total (10s intervals)
  
  while (attempts < maxAttempts) {
    try {
      // Use short timeout for each probe
      const res = await fetch(`${url}/health`, { 
        signal: AbortSignal.timeout(5000),
        cache: 'no-store'
      });
      
      if (res.ok) {
        console.info(`[Workflow/Step] Agent is healthy!`);
        return { success: true };
      }
    } catch {
      // Ignore network errors during boot and retry
    }
    
    attempts++;
    console.info(`[Workflow/Step] Health check attempt ${attempts}/${maxAttempts}...`);
    await sleep("10s");
  }
  
  throw new Error(`Agent health check timed out at ${url} after 5 minutes.`);
}
