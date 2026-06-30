// Mock for @coinbase/agentkit.
// The real package pulls in the ESM-only @across-protocol/app-sdk, which the
// CJS Jest runtime cannot parse. The app imports this transitively via
// src/services/agentkit.ts (which only uses it inside lazy functions), and the
// tests never exercise real AgentKit behaviour — so runtime stubs are enough.

export class CdpEvmWalletProvider {
  static configureWithWallet(): Promise<CdpEvmWalletProvider> {
    return Promise.resolve(new CdpEvmWalletProvider());
  }
  getAddress(): string {
    return '0x0000000000000000000000000000000000000000';
  }
}

export class AgentKit {
  static from(): Promise<AgentKit> {
    return Promise.resolve(new AgentKit());
  }
}

export function walletActionProvider() {
  return { name: 'wallet', getActions: () => [] };
}

export function erc20ActionProvider() {
  return { name: 'erc20', getActions: () => [] };
}
