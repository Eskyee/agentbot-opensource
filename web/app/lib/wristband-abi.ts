// ABI for BaseFMDigitalWristband ERC-721 contract
// Deployed on Base Mainnet (Chain ID: 8453)
export const WRISTBAND_ABI = [
  // Mint functions
  {
    name: 'mintWristband',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'gaslessMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'batchMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'tokenURIs', type: 'string[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  // Gasless allowlist management (owner only)
  {
    name: 'setGaslessAllowed',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'allowed', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'setGaslessAllowedBatch',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'allowed', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'gaslessAllowed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'gaslessClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // View functions
  {
    name: 'totalMinted',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'remainingSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'mintPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'MAX_SUPPLY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // ERC-721 standard
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Admin
  {
    name: 'setMintPrice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newPrice', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'setBaseURI',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newBaseURI', type: 'string' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // Events
  {
    name: 'WristbandMinted',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'tokenURI', type: 'string', indexed: false },
    ],
  },
  {
    name: 'MintPriceUpdated',
    type: 'event',
    inputs: [{ name: 'newPrice', type: 'uint256', indexed: false }],
  },
  {
    name: 'Withdrawn',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;
