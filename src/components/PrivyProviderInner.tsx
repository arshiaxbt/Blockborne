"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import {
  megaethTestnet,
  monadTestnet,
  supportedBattleChains,
} from "@/lib/chains";

const wagmiConfig = createConfig({
  chains: supportedBattleChains,
  transports: {
    [monadTestnet.id]: http(),
    [megaethTestnet.id]: http(
      process.env.NEXT_PUBLIC_MEGAETH_RPC ||
        "https://missing-megaeth-rpc.invalid",
    ),
  },
});

export function PrivyProviderInner({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const appId =
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || "missing-privy-app-id";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["google", "twitter"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet, megaethTestnet],
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
