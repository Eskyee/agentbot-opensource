import { createConfig, http } from "wagmi";
import { createWalletClient, http as viemHttp } from "viem";
import { base, baseSepolia } from "wagmi/chains";
import { base as baseChain } from "viem/chains";
import { coinbaseWallet } from "wagmi/connectors";
import { Attribution } from "ox/erc8021";

const BUILDER_CODE = 'bc_4k0319ta'

const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

/**
 * Shared wagmi config with ERC-8021 Builder Code attribution.
 * All onchain transactions automatically include the dataSuffix.
 */
export const wagmiConfig = createConfig({
  ssr: true,
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Agentbot',
      preference: 'eoaOnly',
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  dataSuffix: DATA_SUFFIX,
});

export const walletClient = createWalletClient({
  chain: baseChain,
  transport: viemHttp(),
  dataSuffix: DATA_SUFFIX,
});

export { BUILDER_CODE }
