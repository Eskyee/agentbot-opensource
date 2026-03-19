import { createConfig, http } from "wagmi";
import { createWalletClient, http as viemHttp } from "viem";
import { base } from "wagmi/chains";
import { base as baseChain } from "viem/chains";
import { Attribution } from "ox/erc8021";

const BUILDER_CODE = 'bc_upjlm3yl'

const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  dataSuffix: DATA_SUFFIX,
});

export const walletClient = createWalletClient({
  chain: baseChain,
  transport: viemHttp(),
  dataSuffix: DATA_SUFFIX,
});

export { BUILDER_CODE }
