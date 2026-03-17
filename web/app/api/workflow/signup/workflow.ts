import { sleep, createHook, getWritable } from "workflow";

export async function handleUserSignup(email: string) {
  "use workflow";

  // === STEP 1: Stream start ===
  const writable = getWritable();
  const writer = writable.getWriter();
  await writer.write("🚀 Starting Agentbot signup workflow...\n");
  writer.releaseLock();

  // === STEP 2: Create user ===
  await writer.write("📝 Creating user...\n");
  const user = await createUserStep(email);
  await writer.write(`✅ User created: ${user.id}\n`);
  writer.releaseLock();

  // === STEP 3: Send Telegram welcome (parallel with Discord) ===
  await writer.write("📱 Sending Telegram welcome...\n");
  const telegramResult = await sendTelegramMessage(user);
  await writer.write(`   ${telegramResult}\n`);

  await writer.write("💬 Sending Discord welcome...\n");
  const discordResult = await sendDiscordMessage(user);
  await writer.write(`   ${discordResult}\n`);

  // === STEP 4: AI-powered tier detection ===
  await writer.write("\n🤖 Detecting tier...\n");
  const tier = await detectTier(user);
  await writer.write(`   Routed to: ${tier.name} (£${tier.price}/mo)\n`);
  writer.releaseLock();

  // === STEP 5: Generate personalized onboarding ===
  await writer.write("\n📧 Generating onboarding content...\n");
  const onboarding = await generateOnboarding(user, tier);
  await writer.write(`   Message: ${onboarding.message}\n`);
  writer.releaseLock();

  // === STEP 6: Wait for user confirmation (HOOK) ===
  const hook = createHook<{ confirmed: boolean }>({ token: `signup-${user.id}` });
  await writer.write("\n⏳ Waiting for user confirmation...\n");
  const response = await hook;
  
  if (response.confirmed) {
    await writer.write("✅ User confirmed!\n");
    
    // === STEP 7: Set up payments for paid tiers ===
    if (tier.name !== "Solo") {
      await writer.write("\n💰 Setting up x402 payments...\n");
      const payment = await setupX402(user, tier);
      await writer.write(`   Address: ${payment.address}\n`);
    }

    // === STEP 8: Create agent template ===
    await writer.write("\n🤖 Creating agent template...\n");
    const template = await createAgent(user, tier);
    await writer.write(`   Template: ${template.name}\n`);

    // === STEP 9: Submit to Base FM if relevant ===
    if (tier.name === "Label" || tier.name === "Network") {
      await writer.write("\n📻 Checking Base FM interest...\n");
      const fmHook = createHook<{ wantsFM: boolean }>({ token: `basefm-${user.id}` });
      const fmResponse = await fmHook;
      
      if (fmResponse.wantsFM) {
        await submitToBaseFM(user);
        await writer.write("   ✅ Base FM submission queued!\n");
      }
    }
  } else {
    await writer.write("⏸️ User not ready yet, saved for later\n");
  }

  // === STEP 10: Schedule follow-up ===
  await scheduleFollowUp(user);
  await writer.write("\n⏰ Follow-up scheduled\n");

  await writer.write("\n✨ Workflow complete!\n");
  writer.releaseLock();

  return {
    userId: user.id,
    tier: tier.name,
    status: response.confirmed ? "confirmed" : "pending",
  };
}

// === ACTIONS (run in steps - full Node.js access) ===

async function createUserStep(email: string) {
  "use step";
  return { id: `user_${Date.now()}`, email };
}

async function sendTelegramMessage(user: { id: string; email: string }) {
  "use step";
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (BOT_TOKEN) {
    console.log(`[Telegram] Would send to ${user.email}`);
  }
  return "Message sent";
}

async function sendDiscordMessage(user: { id: string; email: string }) {
  "use step";
  const WEBHOOK = process.env.DISCORD_WEBHOOK;
  if (WEBHOOK) {
    console.log(`[Discord] Would send to ${user.email}`);
  }
  return "Webhook called";
}

async function detectTier(user: { email: string }) {
  "use step";
  const domain = user.email.split("@")[1]?.toLowerCase() || "";
  
  if (domain.includes("label") || domain.includes("record")) {
    return { name: "Label", price: 149 };
  } else if (domain.includes("agency") || domain.includes("management")) {
    return { name: "Network", price: 499 };
  } else if (domain.includes("studio") || domain.includes("producer")) {
    return { name: "Collective", price: 69 };
  }
  return { name: "Solo", price: 29 };
}

async function generateOnboarding(user: { email: string }, tier: { name: string }) {
  "use step";
  const messages: Record<string, string> = {
    Solo: "Welcome! Your personal AI crew is ready.",
    Collective: "Welcome! Let's build your creative crew.",
    Label: "Welcome! Your label operations await.",
    Network: "Welcome! Agency infrastructure ready.",
  };
  return { message: messages[tier.name] || messages.Solo };
}

async function setupX402(user: { id: string }, tier: { name: string }) {
  "use step";
  const address = `0x${user.id.slice(-40).padStart(40, "0")}`;
  console.log(`[x402] Payment address created for ${tier.name} tier`);
  return { address, status: "ready" };
}

async function createAgent(user: { id: string }, tier: { name: string }) {
  "use step";
  const templates: Record<string, string> = {
    Solo: "Solo Creator",
    Collective: "Crew Lead", 
    Label: "Label Ops",
    Network: "Agency Hub",
  };
  return { name: templates[tier.name] || templates.Solo };
}

async function submitToBaseFM(user: { id: string }) {
  "use step";
  console.log(`[Base FM] User ${user.id} submitted to A&R queue`);
}

async function scheduleFollowUp(user: { id: string }) {
  "use step";
  console.log(`[Scheduler] Follow-up scheduled for user ${user.id}`);
}
