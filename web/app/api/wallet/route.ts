import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { CdpClient, Wallet } from '@coinbase/cdp-sdk'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'

// Check if CDP API keys are configured
const isCDPConfigured = !!(process.env.CDP_API_KEY_NAME && process.env.CDP_API_KEY_PRIVATE_KEY)

// Encryption key derived from environment variable (should be set in production)
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const IV_LENGTH = 16

// Encrypt wallet seed for secure storage
function encryptWalletSeed(seed: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf8')
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  
  let encrypted = cipher.update(seed, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

// Decrypt wallet seed (for server-side operations only)
function decryptWalletSeed(encryptedSeed: string): string {
  const parts = encryptedSeed.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf8')
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Initialize CDP SDK
function initializeCDP(): CdpClient {
  if (!isCDPConfigured) {
    throw new Error('CDP API keys not configured')
  }
  
  return CdpClient.configure({
    apiKeyName: process.env.CDP_API_KEY_NAME!,
    privateKey: process.env.CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  })
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has a wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    })

    if (!wallet) {
      return NextResponse.json({
        address: null,
        balance: '0',
        network: 'base-sepolia',
        hasWallet: false,
        configured: isCDPConfigured,
        message: isCDPConfigured 
          ? 'No wallet found. Create one to get started.'
          : 'Wallet feature not yet configured. Contact administrator to enable CDP API keys.'
      })
    }

    // Return wallet info (without seed)
    return NextResponse.json({
      address: wallet.address,
      balance: '0', // TODO: Fetch actual balance from CDP
      network: wallet.network,
      hasWallet: true,
      configured: isCDPConfigured,
      createdAt: wallet.created_at,
    })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    if (action === 'create') {
      // Check if CDP API keys are configured
      if (!isCDPConfigured) {
        return NextResponse.json({
          error: 'Wallet creation not yet configured',
          message: 'To enable wallet features, add CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables.',
          docs: 'https://docs.agentbot.com/wallet-setup',
          configured: false
        }, { status: 501 })
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Check if user already has a wallet
      const existingWallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
      })

      if (existingWallet) {
        return NextResponse.json({
          error: 'Wallet already exists',
          address: existingWallet.address,
          message: 'You already have a wallet associated with this account.'
        }, { status: 400 })
      }

      // Initialize CDP SDK
      initializeCDP()

      // Create new wallet using CDP SDK
      const wallet = await Wallet.create()
      const address = await wallet.getDefaultAddress()
      const addressId = address.getId()
      const networkId = wallet.getNetworkId()

      // Export wallet seed for backup/recovery
      // Note: In production, consider using CDP's seedless wallet feature
      const walletData = wallet.export()
      const seedJson = JSON.stringify(walletData)
      const encryptedSeed = encryptWalletSeed(seedJson)

      // Store wallet in database
      const newWallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          address: addressId,
          walletSeedEncrypted: encryptedSeed,
          network: networkId || 'base-sepolia',
          walletType: 'cdp',
        },
      })

      console.log(`[Wallet] Created wallet ${addressId} for user ${user.email}`)

      return NextResponse.json({
        address: newWallet.address,
        network: newWallet.network,
        message: 'Wallet created successfully',
        warning: 'Store your wallet seed securely. It is encrypted but backed up.'
      })
    }

    // Handle other actions
    if (action === 'get_seed') {
      if (!isCDPConfigured) {
        return NextResponse.json({ error: 'CDP not configured' }, { status: 501 })
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
      })

      if (!wallet) {
        return NextResponse.json({ error: 'No wallet found' }, { status: 404 })
      }

      // Decrypt and return seed (with warning)
      const seedJson = decryptWalletSeed(wallet.walletSeedEncrypted)
      
      return NextResponse.json({
        seed: JSON.parse(seedJson),
        warning: 'Keep this seed secure. Anyone with this seed can access your wallet.'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Wallet creation error:', error)
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('CDP API keys not configured')) {
        return NextResponse.json({ 
          error: 'Wallet service not configured',
          message: error.message 
        }, { status: 501 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
  }
}
