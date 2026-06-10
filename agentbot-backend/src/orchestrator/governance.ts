import { ethers } from 'ethers';
import { log } from '../lib/logger';

// $AGENT Staking Tiers (Example thresholds in whole tokens)
export const STAKING_TIERS = {
  SOLO: 1000,
  COLLECTIVE: 5000,
  LABEL: 25000,
  NETWORK: 100000
};

export type ResourceTier = 'solo' | 'collective' | 'label' | 'network';

/**
 * GovernanceService handles interaction with the $AGENT token and staking contracts.
 */
export class GovernanceService {
  private provider: ethers.providers.JsonRpcProvider;
  private agentTokenAddress: string;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'https://mainnet.base.org');
    this.agentTokenAddress = process.env.AGENT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
  }

  /**
   * Checks the $AGENT staking balance for a given user wallet.
   * Returns the eligible resource tier.
   */
  async getResourceTier(walletAddress: string): Promise<ResourceTier> {
    if (!ethers.utils.isAddress(walletAddress)) {
      log.warn('Governance', { error: { event: 'invalid_address', address: walletAddress } })
      return 'solo';
    }

    try {
      // Basic ERC20 balance check for $AGENT (Staking check would be a separate contract call)
      const abi = ['function balanceOf(address owner) view returns (uint256)'];
      const contract = new ethers.Contract(this.agentTokenAddress, abi, this.provider);
      
      const balanceWei = await contract.balanceOf(walletAddress);
      const balance = parseFloat(ethers.utils.formatEther(balanceWei));

      log.info('Governance', { details: { event: 'stake_check', address: walletAddress, balance } })

      if (balance >= STAKING_TIERS.NETWORK) return 'network';
      if (balance >= STAKING_TIERS.LABEL) return 'label';
      if (balance >= STAKING_TIERS.COLLECTIVE) return 'collective';
      return 'solo';
    } catch (error) {
      log.error('Governance', { error: { event: 'stake_check_failed', address: walletAddress, error: String(error) } })
      return 'solo'; // Fallback to basic tier
    }
  }
}

export const governance = new GovernanceService();
