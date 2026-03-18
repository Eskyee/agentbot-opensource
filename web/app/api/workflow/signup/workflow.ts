"use workflow"

import { sleep } from "workflow";
import { sendWelcomeEmailStep } from "./steps/send-welcome-email";
import { notifyNewUser } from "./steps/discord-notify";
import { notifyNewUserTelegram } from "./steps/telegram-notify";
import { provisionAgentStep } from "./steps/provision-agent";

export async function handleUserSignup(email: string) {
  const userId = "user_" + Date.now();
  
  await sendWelcomeEmailStep({ 
    email, 
    name: email.split("@")[0] 
  });

  await notifyNewUser(email, userId);

  await notifyNewUserTelegram(email, userId);

  const provisioningResult = await provisionAgentStep({ 
    userId, 
    email,
    plan: "free"
  });

  await sleep("1s");

  return { 
    userId, 
    email, 
    status: "welcome_sent",
    agentProvisioned: provisioningResult.success
  };
}
