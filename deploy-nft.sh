#!/bin/bash
# Deploy BaseFMDigitalWristband to Base Mainnet
# Usage: ./deploy-nft.sh YOUR_PRIVATE_KEY

set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy-nft.sh YOUR_PRIVATE_KEY"
  echo ""
  echo "Your private key is needed to sign the deployment transaction."
  echo "Make sure you have ~0.005 ETH on Base Mainnet for gas."
  exit 1
fi

PRIVATE_KEY=$1

echo "🚀 Deploying BaseFMDigitalWristband to Base Mainnet..."
echo ""

# Deploy
PRIVATE_KEY=$PRIVATE_KEY forge script contracts/script/DeployWristband.s.sol:DeployWristband \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  --etherscan-api-key ${BASESCAN_API_KEY:-""}

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the contract address from above"
echo "2. Add to Vercel: vercel env add WRISTBAND_CONTRACT_ADDRESS production"
echo "3. Allowlist in CDP Paymaster"
echo "4. Test mint at agentbot.sh/wristband"
