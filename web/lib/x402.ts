const payTo = process.env.X402_PAY_TO || '0xYOUR_WALLET_ADDRESS_HERE';
const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

export const x402Config = {
  payTo,
  facilitatorUrl,
  accepts: {
    scheme: 'exact',
    network: 'eip155:8453',
    payTo,
  },
};

export function getX402Config() {
  return x402Config;
}
