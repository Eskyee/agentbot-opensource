"use step"

import { Resend } from "resend";

interface SendWelcomeEmailInput {
  email: string;
  name: string;
}

export async function sendWelcomeEmailStep({ email, name }: SendWelcomeEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY || "");
  
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set, skipping email");
    return { success: false, error: "RESEND_API_KEY not set" };
  }

  const result = await resend.emails.send({
    from: "Agentbot <noreply@raveculture.space>",
    to: email,
    subject: "Welcome to Agentbot!",
    html: `
      <h1>Welcome to Agentbot, ${name}!</h1>
      <p>Thanks for signing up. You can now deploy your first AI agent in 60 seconds.</p>
      <p>Get started at: <a href="https://agentbot.raveculture.xyz/onboard">https://agentbot.raveculture.xyz/onboard</a></p>
      <hr />
      <p>Best,<br>The Agentbot Team</p>
    `,
  });

  return result;
}
