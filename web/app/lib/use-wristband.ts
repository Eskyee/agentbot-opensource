'use client'

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { WRISTBAND_ABI } from './wristband-abi'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WRISTBAND_CONTRACT as `0x${string}`

/**
 * Mint a wristband NFT (paid — requires ETH)
 */
export function useMintWristband() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mint = (to: `0x${string}`, tokenURI: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: WRISTBAND_ABI,
      functionName: 'mintWristband',
      args: [to, tokenURI],
      value: parseEther('0.001'),
    })
  }

  return { mint, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Gasless mint (Paymaster sponsored — no ETH required)
 */
export function useGaslessMint() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mint = (to: `0x${string}`, tokenURI: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: WRISTBAND_ABI,
      functionName: 'gaslessMint',
      args: [to, tokenURI],
    })
  }

  return { mint, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Read total minted count
 */
export function useTotalMinted() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WRISTBAND_ABI,
    functionName: 'totalMinted',
  })
}

/**
 * Read remaining supply
 */
export function useRemainingSupply() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WRISTBAND_ABI,
    functionName: 'remainingSupply',
  })
}

/**
 * Read mint price
 */
export function useMintPrice() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WRISTBAND_ABI,
    functionName: 'mintPrice',
  })
}

/**
 * Read token owner
 */
export function useTokenOwner(tokenId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WRISTBAND_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
  })
}

/**
 * Read token URI (metadata)
 */
export function useTokenURI(tokenId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WRISTBAND_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  })
}
