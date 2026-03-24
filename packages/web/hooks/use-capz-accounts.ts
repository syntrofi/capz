"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { isAddress } from "viem";
import { SMART_ACCOUNT_ABI, FACTORY_ABI, getFactoryAddress } from "@/lib/contracts";
import { useChainId } from "wagmi";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PeriodStatus {
  id: bigint;
  start: bigint;
  end: bigint;
  income: bigint;
  held: bigint;       // redistributionHeld
  timeRemaining: bigint;
}

export interface AccountStatus {
  name: string;
  owner: string;
  token: string;
  payoutAddress: string;
  threshold: bigint;
  sellerOverflowBps: bigint;
  beneficiaryMode: number;   // 0 = FIXED_LIST, 1 = BUYERS
  periodDuration: bigint;
  periodIncome: bigint;
  redistributionHeld: bigint;
  sellerClaimable: bigint;
  balance: bigint;
  canClose: boolean;
  paused: boolean;
  periodStatus: PeriodStatus | null;
  isLoading: boolean;
  error: Error | null;
}

export interface Stakeholder {
  recipient: `0x${string}`;
  shareBps: number;
}

// ─── useOwnerAccounts ────────────────────────────────────────────────────────

export function useOwnerAccounts(ownerAddress?: string) {
  const chainId = useChainId();

  let factoryAddress: `0x${string}` | undefined;
  try {
    factoryAddress = getFactoryAddress(chainId);
  } catch {
    factoryAddress = undefined;
  }

  const enabled =
    !!ownerAddress &&
    isAddress(ownerAddress) &&
    !!factoryAddress;

  const { data, isLoading, error, refetch } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: "getAccountsByOwner",
    args: ownerAddress && isAddress(ownerAddress)
      ? [ownerAddress as `0x${string}`]
      : undefined,
    query: { enabled },
  });

  return {
    accounts: (data as `0x${string}`[] | undefined) ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ─── useAccountStatus ────────────────────────────────────────────────────────

const EMPTY_STATUS: AccountStatus = {
  name: "",
  owner: "",
  token: "",
  payoutAddress: "",
  threshold: 0n,
  sellerOverflowBps: 0n,
  beneficiaryMode: 0,
  periodDuration: 0n,
  periodIncome: 0n,
  redistributionHeld: 0n,
  sellerClaimable: 0n,
  balance: 0n,
  canClose: false,
  paused: false,
  periodStatus: null,
  isLoading: true,
  error: null,
};

export function useAccountStatus(accountAddress?: string): AccountStatus {
  const enabled = !!accountAddress && isAddress(accountAddress);
  const addr = accountAddress as `0x${string}` | undefined;

  const contract = { address: addr, abi: SMART_ACCOUNT_ABI } as const;

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      { ...contract, functionName: "accountName" },
      { ...contract, functionName: "owner" },
      { ...contract, functionName: "token" },
      { ...contract, functionName: "payoutAddress" },
      { ...contract, functionName: "threshold" },
      { ...contract, functionName: "sellerOverflowBps" },
      { ...contract, functionName: "beneficiaryMode" },
      { ...contract, functionName: "periodDuration" },
      { ...contract, functionName: "periodIncome" },
      { ...contract, functionName: "redistributionHeld" },
      { ...contract, functionName: "sellerClaimable" },
      { ...contract, functionName: "getBalance" },
      { ...contract, functionName: "paused" },
      { ...contract, functionName: "getPeriodStatus" },
    ],
    query: { enabled },
  });

  if (!data || isLoading) {
    return { ...EMPTY_STATUS, isLoading, error: error as Error | null };
  }

  const [
    nameResult,
    ownerResult,
    tokenResult,
    payoutAddressResult,
    thresholdResult,
    sellerOverflowBpsResult,
    beneficiaryModeResult,
    periodDurationResult,
    periodIncomeResult,
    redistributionHeldResult,
    sellerClaimableResult,
    balanceResult,
    pausedResult,
    periodStatusResult,
  ] = data;

  const ps = periodStatusResult.result as
    | readonly [bigint, bigint, bigint, bigint, bigint, bigint]
    | undefined;

  const canClose = ps ? ps[5] === 0n && !((pausedResult.result as boolean) ?? false) : false;

  return {
    name: (nameResult.result as string) ?? "",
    owner: (ownerResult.result as string) ?? "",
    token: (tokenResult.result as string) ?? "",
    payoutAddress: (payoutAddressResult.result as string) ?? "",
    threshold: (thresholdResult.result as bigint) ?? 0n,
    sellerOverflowBps: (sellerOverflowBpsResult.result as bigint) ?? 0n,
    beneficiaryMode: Number((beneficiaryModeResult.result as bigint | number) ?? 0),
    periodDuration: (periodDurationResult.result as bigint) ?? 0n,
    periodIncome: (periodIncomeResult.result as bigint) ?? 0n,
    redistributionHeld: (redistributionHeldResult.result as bigint) ?? 0n,
    sellerClaimable: (sellerClaimableResult.result as bigint) ?? 0n,
    balance: (balanceResult.result as bigint) ?? 0n,
    canClose,
    paused: (pausedResult.result as boolean) ?? false,
    periodStatus: ps
      ? { id: ps[0], start: ps[1], end: ps[2], income: ps[3], held: ps[4], timeRemaining: ps[5] }
      : null,
    isLoading: false,
    error: error as Error | null,
  };
}

// ─── useStakeholders ─────────────────────────────────────────────────────────

export function useStakeholders(accountAddress?: string) {
  const enabled = !!accountAddress && isAddress(accountAddress);

  const { data, isLoading, error } = useReadContract({
    address: accountAddress as `0x${string}` | undefined,
    abi: SMART_ACCOUNT_ABI,
    functionName: "getStakeholders",
    query: { enabled },
  });

  return {
    stakeholders: (data as Stakeholder[] | undefined) ?? [],
    isLoading,
    error: error as Error | null,
  };
}

// ─── useClaimableForAddress ───────────────────────────────────────────────────

export function useClaimableForAddress(
  accountAddress?: string,
  stakerAddress?: string
) {
  const enabled =
    !!accountAddress &&
    isAddress(accountAddress) &&
    !!stakerAddress &&
    isAddress(stakerAddress);

  const { data, isLoading, error, refetch } = useReadContract({
    address: accountAddress as `0x${string}` | undefined,
    abi: SMART_ACCOUNT_ABI,
    functionName: "getClaimable",
    args:
      stakerAddress && isAddress(stakerAddress)
        ? [stakerAddress as `0x${string}`]
        : undefined,
    query: { enabled },
  });

  return {
    claimable: (data as bigint | undefined) ?? 0n,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ─── useBuyerContribution ────────────────────────────────────────────────────

export function useBuyerContribution(
  accountAddress?: string,
  pid?: bigint,
  buyerAddress?: string
) {
  const enabled =
    !!accountAddress &&
    isAddress(accountAddress) &&
    pid !== undefined &&
    !!buyerAddress &&
    isAddress(buyerAddress);

  const { data, isLoading, error, refetch } = useReadContract({
    address: accountAddress as `0x${string}` | undefined,
    abi: SMART_ACCOUNT_ABI,
    functionName: "getBuyerContribution",
    args:
      pid !== undefined && buyerAddress && isAddress(buyerAddress)
        ? [pid, buyerAddress as `0x${string}`]
        : undefined,
    query: { enabled },
  });

  return {
    contribution: (data as bigint | undefined) ?? 0n,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
