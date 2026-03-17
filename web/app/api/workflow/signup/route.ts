import { start } from "workflow/api";
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
      message: "Signup workflow started" 
    });
  } catch (error) {
    console.error("Workflow error:", error);
    return Response.json({ error: "Workflow failed" }, { status: 500 });
  }
}
