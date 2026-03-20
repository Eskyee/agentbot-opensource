/**
 * Tempo Chain Definition for viem
 * 
 * Defines the Tempo blockchain for use with viem clients.
 * Used for MPP payment verification and transaction signing.
 */

import { defineChain } from 'viem';

export const tempo = defineChain({
  id: 4217,
  name: 'Tempo',
  network: 'tempo',
  nativeCurrency: {
    decimals: 18,
    name: 'Tempo',
    symbol: 'TEMPO',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explore.tempo.xyz',
    },
  },
});

export const tempoTestnet = defineChain({
  id: 42431,
  name: 'Tempo Testnet',
  network: 'tempo-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Tempo',
    symbol: 'TEMPO',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.moderato.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Testnet Explorer',
      url: 'https://explore.testnet.tempo.xyz',
    },
  },
  testnet: true,
});
