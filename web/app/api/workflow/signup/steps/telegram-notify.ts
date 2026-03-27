"use step"

interface TelegramNotifyInput {
  message: string;
  chatId?: string;
}

export async function sendTelegramNotification({ message, chatId }: TelegramNotifyInput) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.log("TELEGRAM_BOT_TOKEN not set, skipping Telegram notification");
    return { success: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }

  const targetChatId = chatId || process.env.TELEGRAM_ADMIN_CHAT_ID;
  
  if (!targetChatId) {
    console.log("TELEGRAM_ADMIN_CHAT_ID not set, skipping Telegram notification");
    return { success: false, error: "TELEGRAM_ADMIN_CHAT_ID not set" };
  }

  const result = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  const data = await result.json();
  return { success: result.ok, data };
}

export async function notifyNewUserTelegram(email: string, userId: string) {
  return sendTelegramNotification({
    message: `🎉 <b>New User Signup</b>\n\n📧 Email: ${email}\n🆔 User ID: ${userId}\n⏰ Time: ${new Date().toISOString()}`,
  });
}
