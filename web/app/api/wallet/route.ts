import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const IV_LENGTH = 16

function encryptWalletSeed(seed: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf8')
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(seed, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

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

function generateRandomAddress(): string {
  const randomBytes = crypto.randomBytes(20)
  return '0x' + randomBytes.toString('hex')
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const wallet = await prisma.wallet.findFirst({
      where: { user_id: user.id },
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
      const user = await prisma.user.findFirst({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const existingWallet = await prisma.wallet.findFirst({
        where: { user_id: user.id },
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
          user_id: user.id,
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

    if (action === 'get_seed') {
      const user = await prisma.user.findFirst({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const wallet = await prisma.wallet.findFirst({
        where: { user_id: user.id },
      })

      if (!wallet) {
        return NextResponse.json({ error: 'No wallet found' }, { status: 404 })
      }

      const seedJson = decryptWalletSeed(wallet.walletSeedEncrypted)
      
      return NextResponse.json({
        seed: JSON.parse(seedJson),
        warning: 'Keep this seed secure.'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Wallet error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
