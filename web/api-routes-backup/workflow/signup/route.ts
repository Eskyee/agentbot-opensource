export const dynamic = "force-static"
import { start } from "@workflow/core/runtime";
import { handleUserSignup } from "./workflow";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: "Email required" }, { status: 400 });
    }

    const run = await start(handleUserSignup, [email]);
    
    return Response.json({ 
      runId: run.runId,
      message: "Workflow started" 
    });
  } catch (error: any) {
    console.error("Workflow error:", error);
    return Response.json({ error: error.message || "Workflow failed" }, { status: 500 });
  }
}
