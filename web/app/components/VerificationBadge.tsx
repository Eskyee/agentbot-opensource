'use client'

import { useState, useEffect } from 'react'

type VerificationType = 'eas' | 'coinbase' | 'ens' | 'webauthn'

interface VerificationStatus {
  verified: boolean
  verificationType: VerificationType | null
  attestationUid: string | null
  verifierAddress: string | null
  verifiedAt: string | null
}

interface VerificationBadgeProps {
  agentId?: string
  verified?: boolean
  verificationType?: string | null
  className?: string
}

// Badge component for displaying verification status
export function AgentVerifiedBadge({ verified, verificationType, className = '' }: VerificationBadgeProps) {
  if (!verified) return null

  const typeLabels: Record<string, string> = {
    eas: 'EAS Verified',
    coinbase: 'Coinbase Verified',
    ens: 'ENS Verified',
    webauthn: 'Passkey Verified',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 ${className}`}
      title={`Verified via ${typeLabels[verificationType || ''] || 'onchain attestation'}`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>Verified Human</span>
    </span>
  )
}

// Compact badge for agent cards
export function AgentVerifiedBadgeCompact({ verified, className = '' }: { verified?: boolean; className?: string }) {
  if (!verified) return null

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white ${className}`}
      title="Verified Human"
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </span>
  )
}

// Verification UI component for agent settings
export function AgentVerificationPanel({ agentId, verified, verificationType }: VerificationBadgeProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [selectedType, setSelectedType] = useState<VerificationType>('eas')

  useEffect(() => {
    fetchVerificationStatus()
  }, [agentId])

  const fetchVerificationStatus = async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/verify`)
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      // For EAS, we would need to integrate with the EAS SDK
      // This is a placeholder for the verification flow
      const res = await fetch(`/api/agents/${agentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationType: selectedType,
          // These would come from the actual verification flow
          walletAddress: '', // Would be filled by wallet connection
          attestationUid: `attestation-${Date.now()}`, // Would come from EAS
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setStatus({
          verified: data.verified,
          verificationType: data.verificationType,
          attestationUid: data.attestationUid,
          verifierAddress: null,
          verifiedAt: data.verifiedAt,
        })
      }
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setVerifying(false)
    }
  }

  const handleRemoveVerification = async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/verify`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setStatus({
          verified: false,
          verificationType: null,
          attestationUid: null,
          verifierAddress: null,
          verifiedAt: null,
        })
      }
    } catch (error) {
      console.error('Failed to remove verification:', error)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-20 bg-gray-800 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Verified Human Badge</h3>
        {status?.verified && <AgentVerifiedBadge verified={status.verified} verificationType={status.verificationType} />}
      </div>

      {status?.verified ? (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Your agent is verified</span>
            </div>
            <p className="text-sm text-gray-400">
              This agent is linked to a verified human through {status.verificationType?.toUpperCase()} attestation.
            </p>
            {status.attestationUid && (
              <p className="text-xs text-gray-500 mt-2 font-mono">
                Attestation: {status.attestationUid}
              </p>
            )}
          </div>

          <button
            onClick={handleRemoveVerification}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Remove verification
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Link your agent to an onchain identity to prove a real human is behind it.
            Trust matters in crypto.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Verification Method</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'eas', label: 'Ethereum Attestation', icon: '🔗', desc: 'EAS onchain attestation' },
                { id: 'coinbase', label: 'Coinbase Verify', icon: '₿', desc: 'Wallet-based verification' },
                { id: 'ens', label: 'ENS', icon: '🧾', desc: 'Ethereum Name Service' },
                { id: 'webauthn', label: 'Passkey', icon: '🔐', desc: 'Biometric verification' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedType(method.id as VerificationType)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedType === method.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{method.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{method.label}</div>
                      <div className="text-xs text-gray-500">{method.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {verifying ? 'Verifying...' : 'Connect & Verify'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AgentVerifiedBadge
