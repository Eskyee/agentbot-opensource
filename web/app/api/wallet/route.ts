import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'

// WALLET_ENCRYPTION_KEY - MUST be set in production
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY
if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('WALLET_ENCRYPTION_KEY must be set in production')
}
const DEV_ENCRYPTION_KEY = 'dev-fallback-key-for-build-only-32bytes'
const ACTIVE_KEY = ENCRYPTION_KEY || DEV_ENCRYPTION_KEY
const IV_LENGTH = 16

function encryptWalletSeed(seed: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = Buffer.from(ACTIVE_KEY.slice(0, 32), 'utf8')
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(seed, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decryptWalletSeed(encryptedSeed: string): string {
  const parts = encryptedSeed.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const key = Buffer.from(ACTIVE_KEY.slice(0, 32), 'utf8')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function generateRandomAddress(): string {
  const randomBytes = crypto.randomBytes(20)
  return '0x' + randomBytes.toString('hex')
}

export async function GET(req: NextRequest) {
  // Return CDP Agentic Wallet status if configured
  const hasCDP = !!(process.env.CDP_PROJECT_ID);
  
  if (hasCDP) {
    return NextResponse.json({
      agenticWallet: {
        status: 'configured',
        projectId: process.env.CDP_PROJECT_ID?.slice(0, 8) + '...',
        features: ['create_wallet', 'get_balance', 'send_usdc', 'trade_tokens', 'x402_payments'],
      },
      instructions: 'CDP Agentic Wallet is configured. Use /api/wallet/cdp/* endpoints.',
    });
  }

  // Otherwise return user wallet status
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wallet = await prisma.wallet.findFirst({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({
        address: null,
        balance: '0',
        network: 'base-sepolia',
        hasWallet: false,
        message: 'No wallet found. Create one to get started.'
      })
    }

    return NextResponse.json({
      address: wallet.address,
      balance: '0',
      network: wallet.network,
      hasWallet: true,
      createdAt: wallet.createdAt,
    })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    if (action === 'create') {
      const existingWallet = await prisma.wallet.findFirst({
        where: { userId: session.user.id },
      })

      if (existingWallet) {
        return NextResponse.json({
          error: 'Wallet already exists',
          address: existingWallet.address,
        }, { status: 400 })
      }

      const newAddress = generateRandomAddress()
      const walletData = { address: newAddress, privateKey: crypto.randomBytes(32).toString('hex') }
      const encryptedSeed = encryptWalletSeed(JSON.stringify(walletData))

      const newWallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          address: newAddress,
          walletSeedEncrypted: encryptedSeed,
          network: 'base-sepolia',
          walletType: 'generated',
        },
      })

      return NextResponse.json({
        address: newWallet.address,
        network: newWallet.network,
        message: 'Wallet created successfully'
      })
    }

    // get_seed: Returns ONLY the address — private key NEVER leaves the server.
    // If you need to sign transactions, do it server-side via a dedicated signing endpoint.
    if (action === 'get_seed') {
      const wallet = await prisma.wallet.findFirst({
        where: { userId: session.user.id },
      })

      if (!wallet) {
        return NextResponse.json({ error: 'No wallet found' }, { status: 404 })
      }

      // Return wallet address only — never expose private key material over HTTP
      return NextResponse.json({
        address: wallet.address,
        network: wallet.network,
        createdAt: wallet.createdAt,
        warning: 'Private keys are stored encrypted server-side and never exposed.'
      })
    }

    // export_seed: Admin-only, requires re-authentication (future implementation)
    if (action === 'export_seed') {
      return NextResponse.json(
        { error: 'Seed export is disabled for security. Contact support if you need your private key.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Wallet error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
