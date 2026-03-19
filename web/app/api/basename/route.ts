import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, isAddress } from 'viem'
import { base } from 'viem/chains'

// Base mainnet L2 Universal Resolver for Basenames (.base.eth)
const BASE_UNIVERSAL_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD'

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: 'Valid Ethereum address required' }, { status: 400 })
  }

  try {
    const name = await publicClient.getEnsName({
      address: address as `0x${string}`,
      universalResolverAddress: BASE_UNIVERSAL_RESOLVER,
    })

    return NextResponse.json({ name: name ?? null })
  } catch {
    // Resolution failure is not an error — address just has no Basename
    return NextResponse.json({ name: null })
  }
}
