import { defineChain } from "viem";

const megaethRpc =
  process.env.NEXT_PUBLIC_MEGAETH_RPC || "https://missing-megaeth-rpc.invalid";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: "https://monad-testnet.socialscan.io",
    },
  },
  testnet: true,
});

export const megaethTestnet = defineChain({
  id: 6343,
  name: "MegaETH Testnet",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [megaethRpc],
    },
  },
  blockExplorers: {
    default: {
      name: "MegaETH Explorer",
      url: "https://www.megaexplorer.xyz",
    },
  },
  testnet: true,
});

export const supportedBattleChains = [monadTestnet, megaethTestnet] as const;

export function isMegaethRpcConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_MEGAETH_RPC);
}
