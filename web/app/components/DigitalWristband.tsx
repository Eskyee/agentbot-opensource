'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Identity, Name, Avatar, Badge } from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton } from '@coinbase/onchainkit/transaction';

/**
 * baseFM / RaveCulture — Digital Wristband
 * The primary onchain access ticket for streams and events.
 */
export default function DigitalWristband() {
  const { address, isConnected } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleMint = async () => {
    if (!address) return;
    setIsMinting(true);
    setMintStatus('idle');

    try {
      const response = await fetch('/api/bankr-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          assetName: 'baseFM-Digital-Wristband',
          network: 'base'
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMintStatus('success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Minting failed:', error);
      setMintStatus('error');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="p-6 border border-zinc-800 bg-zinc-950 rounded-none max-w-md mx-auto font-mono">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tighter text-white uppercase">Digital Wristband</h2>
        <div className="h-3 w-3 bg-blue-600 animate-pulse" />
      </div>

      {!isConnected ? (
        <div className="py-12 text-center border-t border-zinc-800 mt-4">
          <p className="text-zinc-500 text-xs mb-4 uppercase">Connect wallet to access the booth</p>
          {/* Note: This assumes ConnectWallet is handled in Navbar/Identity */}
          <div className="text-zinc-700 italic">Authentication Required</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity Preview */}
          <div className="flex items-center space-x-4 bg-zinc-900/50 p-4 border border-zinc-800">
            <Identity address={address} schemaId="0x123...">
              <Avatar address={address} className="h-10 w-10 rounded-none border border-zinc-700" />
              <div className="flex flex-col">
                <Name address={address} className="text-white font-bold" />
                <Badge className="bg-zinc-800 text-zinc-500 text-[10px] uppercase px-1">Verified Member</Badge>
              </div>
            </Identity>
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <p className="text-zinc-400 text-xs leading-relaxed mb-6">
              Mint your Digital Wristband to unlock the high-definition live stream and exclusive 
              $AGENTBOT community channels.
            </p>

            <button
              onClick={handleMint}
              disabled={isMinting || mintStatus === 'success'}
              className={`w-full py-4 px-6 text-sm font-bold uppercase transition-all duration-200 border ${
                mintStatus === 'success' 
                  ? 'bg-green-900/20 border-green-500 text-green-500 cursor-not-allowed'
                  : 'bg-white text-black border-white hover:bg-transparent hover:text-white disabled:opacity-50'
              }`}
            >
              {isMinting ? 'Minting in Progress...' : mintStatus === 'success' ? 'Wristband Active' : 'Mint Wristband'}
            </button>

            {mintStatus === 'error' && (
              <p className="text-red-500 text-[10px] mt-4 uppercase text-center">Transaction failed. Try again.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between items-center text-[10px] text-zinc-600 uppercase tracking-widest">
        <span>Network: Base</span>
        <span>Secured by Bankr</span>
      </div>
    </div>
  );
}
