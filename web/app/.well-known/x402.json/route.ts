import { NextResponse } from 'next/server'

/**
 * x402 Bazaar discovery endpoint.
 * Agentic Market indexes services by fetching /.well-known/x402.json
 * See: https://github.com/x402-foundation/x402/blob/main/docs/extensions/bazaar.mdx
 */
export async function GET() {
  return NextResponse.json({
    x402Version: 1,
    service: {
      name: "Agentbot",
      description: "MiMo V2.5 Pro AI inference — chat completions, reasoning, multimodal. Pay per request in USDC on Base.",
      icon: "https://agentbot.sh/icons/icon-192x192.png",
      externalUrl: "https://agentbot.sh",
    },
    endpoints: [
      {
        path: "/v1/x402/chat/completions",
        method: "POST",
        description: "OpenAI-compatible chat completions powered by MiMo V2.5 Pro. 1M context window, built-in reasoning.",
        mimeType: "application/json",
        accepts: [
          {
            scheme: "exact",
            price: "$0.001",
            network: "eip155:8453",
            payTo: "0x451cE4B37ad54BcFCD49b8a4140C17315358EDa5",
          },
        ],
        metadata: {
          model: "mimo-v2.5-pro",
          provider: "xiaomi",
          contextWindow: 1048576,
          features: ["reasoning", "multimodal", "streaming"],
        },
      },
    ],
  })
}
