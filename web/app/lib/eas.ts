// EAS (Ethereum Attestation Service) Integration Utilities
// This module provides utilities for verifying onchain attestations

// EAS Contract Addresses (Sepolia testnet - would need Mainnet addresses for production)
export const EAS_CONTRACTS = {
  'sepolia': '0xAcfE09eD6d4A94C7aCA04D6D36C3B5E2f8d87dC5',
  'mainnet': '0xA0b86a33E6441C4A4f6E3ege8C7B3b8eE4f6d3C2',
} as const

// Schema UID for Human Verification (would be created/deployed by the platform)
export const HUMAN_VERIFICATION_SCHEMA_UID = {
  'sepolia': '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  'mainnet': '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
} as const

export type Network = 'sepolia' | 'mainnet'

export interface EASAttestation {
  uid: string
  schema: string
  recipient: string
  attester: string
  data: string
  timestamp: number
  expirationTime: number
  revocationTime: number
  version: number
  nonce: number
  revoked: boolean
}

export interface VerificationRequest {
  walletAddress: string
  network?: Network
  schemaUid?: string
}

export interface VerificationResult {
  success: boolean
  attested: boolean
  attestationUid?: string
  attester?: string
  timestamp?: number
  error?: string
}

/**
 * Verify an EAS attestation exists for a given wallet address
 * In production, this would query the EAS contract directly via JSON-RPC
 */
export async function verifyEASAttestation(request: VerificationRequest): Promise<VerificationResult> {
  const { walletAddress, network = 'sepolia', schemaUid } = request
  
  // TODO: Implement actual EAS SDK verification via JSON-RPC
  
  console.log(`[EAS] Verifying attestation for ${walletAddress} on ${network}`)
  
  return {
    success: true,
    attested: false,
    error: 'EAS verification requires wallet connection and EAS SDK integration',
  }
}

/**
 * Generate a verification message for wallet signature
 * This is what users sign to prove they own the wallet
 */
export function getVerificationMessage(agentId: string, nonce: string): string {
  return `Verify your Agentbot agent

Agent ID: ${agentId}
Nonce: ${nonce}

This signature proves you are a real human controlling this agent.
Timestamp: ${Date.now()}
`
}

/**
 * Format attestation UID for display
 */
export function formatAttestationUid(uid: string): string {
  if (!uid || uid.length < 16) return uid
  return `${uid.slice(0, 8)}...${uid.slice(-8)}`
}

/**
 * Get verification type label
 */
export function getVerificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    eas: 'Ethereum Attestation (EAS)',
    coinbase: 'Coinbase Verify',
    ens: 'ENS (Ethereum Name Service)',
    webauthn: 'Passkey / WebAuthn',
  }
  return labels[type] || type
}
