const payTo = process.env.X402_PAY_TO || '0xd8fd0e1dce89beaab924ac68098ddb17613db56f';
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
