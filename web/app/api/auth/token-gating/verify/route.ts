import { NextRequest, NextResponse } from 'next/server'

/**
 * Farcaster Token Gating Verification API
 * Validates $RAVE token balance for Farcaster users
 */

const RAVE_TOKEN_ADDRESS = '0x6EE72eEDEfBa8937Ec8c36dEd9B8c1ef9ca7A3db'
const MIN_BALANCE = '1000000000000000000' // 1 RAVE (18 decimals)
const BASE_RPC = 'https://mainnet.base.org'

// Simple ERC20 balance checker
async function checkTokenBalance(address: string): Promise<boolean> {
  try {
    const payload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: RAVE_TOKEN_ADDRESS,
          data: `0x70a08231000000000000000000000000${address.slice(2).padStart(40, '0')}`,
        },
        'latest',
      ],
      id: 1,
    }

    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    
    if (data.result) {
      const balance = BigInt(data.result)
      const minBalance = BigInt(MIN_BALANCE)
      return balance >= minBalance
    }
    
    return false
  } catch (error) {
    console.error('Token balance check failed:', error)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fid, address } = await req.json()

    if (!address || !fid) {
      return NextResponse.json(
        { error: 'Missing fid or address' },
        { status: 400 }
      )
    }

    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      )
    }

    // Check token balance
    const hasAccess = await checkTokenBalance(address)

    return NextResponse.json({
      fid,
      address,
      hasAccess,
      tokenGated: true,
      minBalance: MIN_BALANCE,
      token: 'RAVE',
      chain: 'base',
      message: hasAccess 
        ? 'User has sufficient $RAVE balance' 
        : 'Insufficient $RAVE balance. Minimum 1 RAVE required.',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Token gating verification failed:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address')

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid or missing address parameter' },
        { status: 400 }
      )
    }

    const hasAccess = await checkTokenBalance(address)

    return NextResponse.json({
      address,
      hasAccess,
      tokenGated: true,
      minBalance: MIN_BALANCE,
      token: 'RAVE',
      chain: 'base',
      contractAddress: RAVE_TOKEN_ADDRESS,
      rpcEndpoint: BASE_RPC,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
