"use step"

interface ProvisionAgentInput {
  userId: string;
  email: string;
  plan?: string;
}

export async function provisionAgentStep({ userId, email, plan = "free" }: ProvisionAgentInput) {
  const backendUrl = process.env.BACKEND_API_URL || process.env.AGENTBOT_BACKEND_URL;
  const apiSecret = process.env.BACKEND_API_SECRET || process.env.API_SECRET;
  
  if (!backendUrl) {
    console.log("BACKEND_API_URL not set, skipping agent provisioning");
    return { success: false, error: "BACKEND_API_URL not set" };
  }

  if (!apiSecret) {
    console.log("API_SECRET not set, skipping agent provisioning");
    return { success: false, error: "API_SECRET not set" };
  }

  try {
    const response = await fetch(`${backendUrl}/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiSecret}`,
        "X-User-Id": userId,
        "X-User-Email": email,
      },
      body: JSON.stringify({
        plan,
        telegramToken: process.env.DEFAULT_TELEGRAM_TOKEN,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Provisioning failed: ${response.status} - ${error}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Agent provisioning error:", error);
    return { success: false, error: String(error) };
  }
}
