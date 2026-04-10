function trimValue(value: string | undefined) {
  return value?.trim() || ''
}

export const BASE_AGENTBOT_TOKEN = {
  name: 'Agentbot',
  symbol: 'AGENTBOT',
  network: 'Base',
  dex: 'Uniswap',
  address: trimValue(process.env.NEXT_PUBLIC_AGENTBOT_BASE_TOKEN_ADDRESS),
  chartUrl: trimValue(process.env.NEXT_PUBLIC_AGENTBOT_BASE_TOKEN_CHART_URL),
  buyUrl: trimValue(process.env.NEXT_PUBLIC_AGENTBOT_BASE_TOKEN_BUY_URL),
  holdersLabel: trimValue(process.env.NEXT_PUBLIC_AGENTBOT_BASE_TOKEN_HOLDERS_LABEL),
  howToBuy: [
    'Bridge ETH or USDC to Base.',
    'Open the buy link and confirm the contract before swapping.',
    'Track liquidity and holders from the chart and explorer links.',
  ],
}

export function getBaseAgentbotTokenLinks() {
  const explorerUrl = BASE_AGENTBOT_TOKEN.address
    ? `https://basescan.org/token/${BASE_AGENTBOT_TOKEN.address}`
    : ''

  return {
    explorerUrl,
    chartUrl: BASE_AGENTBOT_TOKEN.chartUrl,
    buyUrl: BASE_AGENTBOT_TOKEN.buyUrl || 'https://app.uniswap.org/swap?chain=base',
    configured: Boolean(BASE_AGENTBOT_TOKEN.address && BASE_AGENTBOT_TOKEN.chartUrl),
  }
}
