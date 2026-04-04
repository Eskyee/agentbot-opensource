import { NextResponse } from 'next/server'
import { createPublicClient, erc20Abi, formatEther, formatUnits, http, isAddress, type Address } from 'viem'
import { BASE_CHAIN, BASE_RPC_URL, BASE_USDC_ADDRESS, getBaseAddressUrl } from '@/app/lib/base-wallet'

const client = createPublicClient({
  chain: BASE_CHAIN,
  transport: http(BASE_RPC_URL),
})

type WalletAsset = {
  address: string
  name: string
  symbol: string
  decimals: number
  balance: string
  balanceRaw: string
  explorerUrl: string
}

function toAddress(value: string | null): Address | null {
  return value && isAddress(value) ? (value as Address) : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = toAddress(searchParams.get('address'))

  if (!address) {
    return NextResponse.json({ error: 'Valid address parameter required' }, { status: 400 })
  }

  try {
    const [nativeBalance, usdcRaw] = await Promise.all([
      client.getBalance({ address }),
      client.readContract({
        address: BASE_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      }),
    ])

    const assets: WalletAsset[] = [
      {
        address: 'native',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        balance: formatEther(nativeBalance),
        balanceRaw: nativeBalance.toString(),
        explorerUrl: getBaseAddressUrl(address),
      },
      {
        address: BASE_USDC_ADDRESS,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        balance: formatUnits(usdcRaw, 6),
        balanceRaw: usdcRaw.toString(),
        explorerUrl: `${getBaseAddressUrl(address)}#tokentxns`,
      },
    ]

    return NextResponse.json({
      address,
      chain: BASE_CHAIN.name,
      chainId: BASE_CHAIN.id,
      testnet: false,
      explorerUrl: getBaseAddressUrl(address),
      nativeBalance: assets[0],
      primaryToken: assets[1],
      allTokens: assets.filter((asset) => Number(asset.balance) > 0),
      assets,
    })
  } catch (error) {
    console.error('[Wallet API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 })
  }
}
