import { start } from "@workflow/core/runtime";
import { provisionManagedAgent } from "./workflow";
import { getAuthSession } from "@/app/lib/getAuthSession";

/**
 * Trigger Managed Agent Provisioning Workflow
 * 
 * POST /api/workflow/agent-provision
 * Body: { agentId, plan }
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId, plan } = await req.json();
    
    if (!agentId || !plan) {
      return Response.json({ error: "agentId and plan required" }, { status: 400 });
    }

    // Execution as a Fact: Start the durable workflow
    const run = await start(provisionManagedAgent, [agentId, plan]);
    
    return Response.json({ 
      runId: run.runId,
      message: "Provisioning workflow started" 
    });
  } catch (error: any) {
    console.error("[Workflow/Provision] Start failed:", error);
    return Response.json({ 
      error: error.message || "Workflow failed to start" 
    }, { status: 500 });
  }
}
