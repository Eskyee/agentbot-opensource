import { paymentProxy, x402ResourceServer } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

// ClawRouter EVM wallet — receives x402 payments
const payTo = "0x451cE4B37ad54BcFCD49b8a4140C17315358EDa5";

// CDP facilitator (production) — handles verification & settlement
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://api.cdp.coinbase.com/platform/v2/x402",
});

const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:8453", new ExactEvmScheme()); // Base mainnet

export const middleware = paymentProxy(
  {
    "/v1/x402/chat/completions": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.001",
          network: "eip155:8453",
          payTo,
        },
      ],
      description: "MiMo V2.5 Pro chat completions — pay per request in USDC on Base",
      mimeType: "application/json",
    },
  },
  server,
);

// Only apply x402 middleware to /v1/x402/* routes
// Existing /v1/chat/completions keeps API key auth
export const config = {
  matcher: ["/v1/x402/:path*"],
};
