import { base, baseSepolia, optimism, optimismSepolia, hardhat } from "viem/chains";
import type { Chain } from "viem";

const isLocal = process.env.NEXT_PUBLIC_LOCAL_DEV === "true";

export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = isLocal
  ? [hardhat, baseSepolia, base, optimismSepolia, optimism]
  : [baseSepolia, base, optimismSepolia, optimism];

export const DEFAULT_CHAIN: Chain = isLocal
  ? hardhat
  : process.env.NODE_ENV === "production"
    ? base
    : baseSepolia;

export function getChainById(id: number): Chain {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === id);
  if (!chain) {
    throw new Error(`Unsupported chain id: ${id}`);
  }
  return chain;
}
