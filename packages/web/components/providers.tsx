"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SUPPORTED_CHAINS } from "@/lib/chains";

// Build transport map from supported chains
const transports = Object.fromEntries(
  SUPPORTED_CHAINS.map((chain) => [chain.id, http()])
);

const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: SUPPORTED_CHAINS,
    transports,
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
    appName: "Capz",
    appDescription: "Non-extractive payment infrastructure",
  })
);

export type AppWagmiConfig = typeof wagmiConfig;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 2 },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
