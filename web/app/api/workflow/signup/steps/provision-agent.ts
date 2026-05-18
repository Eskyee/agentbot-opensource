"use step"

import { signedFetch } from '@/app/lib/backend-client';

interface ProvisionAgentInput {
  userId: string;
  email: string;
  plan?: string;
}

export async function provisionAgentStep({ userId, email, plan = "free" }: ProvisionAgentInput) {
  try {
    const response = await signedFetch('/provision', {
      method: "POST",
      headers: {
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
