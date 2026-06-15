#!/usr/bin/env node
/**
 * Deploy BaseFMDigitalWristband to Base Mainnet
 * Usage: node deploy-nft.js YOUR_PRIVATE_KEY
 */

const { ethers } = require('ethers');

const RPC_URL = 'https://mainnet.base.org';
const CONTRACT_ARTIFACT = require('./out/BaseFMDigitalWristband.sol/BaseFMDigitalWristband.json');

async function main() {
  const privateKey = process.argv[2];
  if (!privateKey) {
    console.log('Usage: node deploy-nft.js YOUR_PRIVATE_KEY');
    console.log('');
    console.log('Make sure you have ~0.005 ETH on Base Mainnet for gas.');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('🚀 Deploying BaseFMDigitalWristband to Base Mainnet...');
  console.log(`   Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`   Balance:  ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther('0.005')) {
    console.log('❌ Insufficient ETH. Need ~0.005 ETH for deployment gas.');
    process.exit(1);
  }

  const factory = new ethers.ContractFactory(
    CONTRACT_ARTIFACT.abi,
    CONTRACT_ARTIFACT.bytecode,
    wallet
  );

  const contract = await factory.deploy(
    'baseFM Digital Wristband',
    'bfmw',
    'https://agentbot.sh/api/wristband/metadata/',
    wallet.address
  );

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('');
  console.log('✅ Deployed!');
  console.log(`   Contract: ${address}`);
  console.log(`   Owner:    ${wallet.address}`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. Verify on BaseScan: https://basescan.org/address/${address}`);
  console.log(`2. Add to Vercel: vercel env add WRISTBAND_CONTRACT_ADDRESS production`);
  console.log(`3. Allowlist in CDP Paymaster`);
  console.log(`4. Test mint at agentbot.sh/wristband`);
}

main().catch(console.error);
