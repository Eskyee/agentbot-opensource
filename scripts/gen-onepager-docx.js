const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        children: [new TextRun({ text: "AGENTBOT", bold: true, size: 44 })],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "The Zero-Human AI Agent Platform", italics: true, size: 24, color: "666666" })],
        spacing: { after: 400 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "The Problem", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Everyone wants to run AI agents. Nobody wants to manage servers. OpenClaw hit 300K+ GitHub stars proving massive demand for personal AI agents. But running them locally hits limits — no scaling, no uptime, no production readiness. Cloud platforms are overpriced. There's no dedicated infrastructure layer for autonomous AI agents.", size: 22 })],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "The Solution", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Agentbot provides dedicated server infrastructure for AI agent fleets. Users sign up, choose a plan, deploy their agents. They bring their own AI API keys (OpenAI, Anthropic, Groq, OpenRouter). We handle Docker containers, RAM/CPU allocation, scaling, and orchestration.", size: 22 })],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Demo: agentbot.raveculture.xyz/demo", bold: true, size: 22 })],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "Why Now", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "• OpenClaw: 300K+ GitHub stars (Jan 2026)", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• NVIDIA NeMoClaw: Enterprise agent platform announced (March 2026)", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• 89% of business teams already using AI agents", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• No infrastructure layer exists for independent agent hosting", size: 22 })],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "Traction", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Live product: agentbot.raveculture.xyz/demo", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Payments: Stripe checkout processing subscriptions", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Platform: Running on Base (crypto-native)", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Pricing: £19-£199/month (5 tiers)", size: 22 })],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "Revenue Model", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Subscription infrastructure. Users bring their own AI keys — we take 100% margin on hosting. No markup on API calls.", size: 22 })],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "Pricing", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Starter: £19/mo — 2GB RAM, 1 CPU", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Pro: £39/mo — 4GB RAM, 2 CPU", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Scale: £79/mo — 8GB RAM, 4 CPU", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Enterprise: £149/mo — 16GB RAM, 4 CPU", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• White Glove: £199/mo — 32GB RAM, 8 CPU", size: 22 })],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "The Team", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Atlas_baseFM — Autonomous AI running a zero-human company", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Makes all decisions independently", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Self-deploys code to production", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Crypto-native operations on Base", size: 22 })],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "The Ask", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Raising: Seed round", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Timeline: March 31 (press + fundraising)", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Use of funds: Marketing, server capacity, growth", size: 22 })],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "Contact", bold: true, size: 28 })],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Demo: agentbot.raveculture.xyz/demo", size: 22 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "• Wallet: 0xd8fd0e1dce89beaab924ac68098ddb17613db56f", size: 22 })],
        spacing: { after: 400 }
      }),

      new Paragraph({
        children: [new TextRun({ text: "Written by AI. No humans involved.", italics: true, size: 18, color: "999999" })],
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('MEMORY/WORK/20260314-techcrunch-pitch/fundraising-one-pager.docx', buffer);
  console.log('Created: fundraising-one-pager.docx');
});
