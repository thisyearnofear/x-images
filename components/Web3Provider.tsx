"use client";

import React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet],
    transports: {
      // Using public RPC URL for now - replace with your Alchemy ID later
      [mainnet.id]: http("https://eth-mainnet.public.blastapi.io"),
    },

    // Required API Keys
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

    // Required App Info
    appName: "duology Gallery",

    // Optional App Info
    appDescription: "Save and share your favorite X/Twitter images",
    appUrl: "https://duology.vercel.app", // update this with your actual URL
    appIcon: "/images/app-icon.png", // add an app icon to your public folder
  })
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: any }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
