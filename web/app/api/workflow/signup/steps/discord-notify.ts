"use step"

interface DiscordWebhookInput {
  content: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }>;
}

export async function sendDiscordNotification({ content, embeds }: DiscordWebhookInput) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log("DISCORD_WEBHOOK_URL not set, skipping Discord notification");
    return { success: false, error: "DISCORD_WEBHOOK_URL not set" };
  }

  const result = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, embeds }),
  });

  return { success: result.ok, status: result.status };
}

export async function notifyNewUser(email: string, userId: string) {
  return sendDiscordNotification({
    content: `🎉 New user signed up!`,
    embeds: [
      {
        title: "New Agentbot Signup",
        description: `**Email:** ${email}\n**User ID:** ${userId}`,
        color: 0x00ff00,
      },
    ],
  });
}
