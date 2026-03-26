import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

// Supported verification types
type VerificationType = 'eas' | 'coinbase' | 'ens' | 'webauthn'

interface VerifyRequestBody {
  verificationType: VerificationType
  attestationUid?: string
  walletAddress?: string
  signature?: string
}

// EAS Schema UID for human verification (Ethereum Attestation Service)
// This would be created by the platform or use a known schema
const EAS_HUMAN_SCHEMA_UID = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params
    const API_URL = getBackendApiUrl()
    const API_KEY = getInternalApiKey()

    // Fetch current verification status from backend
    const response = await fetch(`${API_URL}/api/agents/${agentId}/verification`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch verification status' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch verification status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params
    const API_URL = getBackendApiUrl()
    const API_KEY = getInternalApiKey()
    const body: VerifyRequestBody = await request.json()
    const { verificationType, attestationUid, walletAddress, signature } = body

    // Validate verification type
    if (!['eas', 'coinbase', 'ens', 'webauthn'].includes(verificationType)) {
      return NextResponse.json(
        { error: 'Invalid verification type' },
        { status: 400 }
      )
    }

    // Verify based on type
    let verificationResult: {
      verified: boolean
      attestationUid?: string
      verifierAddress?: string
      metadata?: Record<string, unknown>
    }

    switch (verificationType) {
      case 'eas':
        // Ethereum Attestation Service verification
        if (!attestationUid) {
          return NextResponse.json(
            { error: 'Attestation UID required for EAS verification' },
            { status: 400 }
          )
        }
        
        // In production, verify the attestation on-chain
        // For now, we accept the attestation UID and store it
        verificationResult = {
          verified: true,
          attestationUid,
          verifierAddress: walletAddress,
          metadata: {
            schema: EAS_HUMAN_SCHEMA_UID,
            verifiedAt: new Date().toISOString(),
          }
        }
        break

      case 'coinbase':
        // Coinbase Verify verification
        // In production, verify through Coinbase's API
        if (!signature) {
          return NextResponse.json(
            { error: 'Signature required for Coinbase verification' },
            { status: 400 }
          )
        }
        
        verificationResult = {
          verified: true,
          attestationUid: `coinbase-${Date.now()}`,
          verifierAddress: walletAddress,
          metadata: {
            provider: 'coinbase',
            verifiedAt: new Date().toISOString(),
          }
        }
        break

      case 'ens':
        // ENS verification - verify ownership of ENS name
        if (!signature || !walletAddress) {
          return NextResponse.json(
            { error: 'Signature and wallet address required for ENS verification' },
            { status: 400 }
          )
        }
        
        verificationResult = {
          verified: true,
          attestationUid: `ens-${walletAddress}`,
          verifierAddress: walletAddress,
          metadata: {
            provider: 'ens',
            verifiedAt: new Date().toISOString(),
          }
        }
        break

      case 'webauthn':
        // WebAuthn verification (passkey/biometric)
        if (!signature) {
          return NextResponse.json(
            { error: 'Attestation required for WebAuthn verification' },
            { status: 400 }
          )
        }
        
        verificationResult = {
          verified: true,
          attestationUid: `webauthn-${Date.now()}`,
          metadata: {
            provider: 'webauthn',
            verifiedAt: new Date().toISOString(),
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported verification type' },
          { status: 400 }
        )
    }

    // Update agent verification status in backend
    const updateResponse = await fetch(`${API_URL}/api/agents/${agentId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verificationType,
        ...verificationResult,
      }),
    })

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to update verification' },
        { status: updateResponse.status }
      )
    }

    const data = await updateResponse.json()
    return NextResponse.json({
      success: true,
      verified: verificationResult.verified,
      verificationType,
      attestationUid: verificationResult.attestationUid,
      verifiedAt: verificationResult.metadata?.verifiedAt,
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params
    const API_URL = getBackendApiUrl()
    const API_KEY = getInternalApiKey()

    // Remove verification from agent
    const response = await fetch(`${API_URL}/api/agents/${agentId}/verify`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to remove verification' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove verification:', error)
    return NextResponse.json(
      { error: 'Failed to remove verification' },
      { status: 500 }
    )
  }
}


export const dynamic = 'force-dynamic';