"use client";

import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther } from "viem";
import { SMART_ACCOUNT_ABI, FACTORY_ABI, getFactoryAddress } from "@/lib/contracts";
import { useCallback } from "react";

// ─── Shared result shape ──────────────────────────────────────────────────────

export interface WriteResult {
  write: (...args: unknown[]) => void;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  txHash: `0x${string}` | undefined;
}

function useWaitState(hash: `0x${string}` | undefined) {
  return useWaitForTransactionReceipt({ hash, confirmations: 1 });
}

// ─── useCreateAccount ─────────────────────────────────────────────────────────

export interface CreateAccountArgs {
  payoutAddress: `0x${string}`;
  threshold: bigint;
  sellerOverflowBps: bigint;
  periodDuration: bigint;
  token: `0x${string}`;
  beneficiaryMode: number;   // 0 = FIXED_LIST, 1 = BUYERS
  stakeholders: { recipient: `0x${string}`; shareBps: number }[];
  accountName: string;
}

export function useCreateAccount() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(
    (args: CreateAccountArgs) => {
      let factoryAddress: `0x${string}`;
      try {
        factoryAddress = getFactoryAddress(chainId);
      } catch (e) {
        console.error("Factory not deployed on this chain:", e);
        return;
      }

      writeContract({
        address: factoryAddress,
        abi: FACTORY_ABI,
        functionName: "createAccount",
        args: [
          args.payoutAddress,
          args.threshold,
          args.sellerOverflowBps,
          args.periodDuration,
          args.token,
          args.beneficiaryMode,
          args.stakeholders,
          args.accountName,
        ],
      });
    },
    [chainId, writeContract]
  );

  return {
    write,
    isPending,
    isConfirming,
    isSuccess,
    error: error as Error | null,
    txHash: hash,
  } satisfies Omit<WriteResult, "write"> & { write: (args: CreateAccountArgs) => void };
}

// ─── useSellerClaim ───────────────────────────────────────────────────────────
// Escape hatch: claims ETH that failed to forward automatically to payoutAddress

export function useSellerClaim(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "sellerClaim",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

// ─── useStakeholderClaim ──────────────────────────────────────────────────────

export function useStakeholderClaim(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "stakeholderClaim",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

// ─── useClaimBuyerRedistribution ─────────────────────────────────────────────

export function useClaimBuyerRedistribution(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(
    (pid: bigint) => {
      writeContract({
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: "claimBuyerRedistribution",
        args: [pid],
      });
    },
    [accountAddress, writeContract]
  );

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

// ─── useClosePeriod ───────────────────────────────────────────────────────────

export function useClosePeriod(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "closePeriod",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

// ─── Economic params timelock ─────────────────────────────────────────────────

export function useQueueEconomicParamsChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(
    (newThreshold: bigint, newSellerOverflowBps: bigint) => {
      writeContract({
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: "queueEconomicParamsChange",
        args: [newThreshold, newSellerOverflowBps],
      });
    },
    [accountAddress, writeContract]
  );

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

export function useExecuteEconomicParamsChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "executeEconomicParamsChange",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

export function useCancelEconomicParamsChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "cancelEconomicParamsChange",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

// ─── Payout address timelock ──────────────────────────────────────────────────

export function useQueuePayoutAddressChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(
    (newAddress: `0x${string}`) => {
      writeContract({
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: "queuePayoutAddressChange",
        args: [newAddress],
      });
    },
    [accountAddress, writeContract]
  );

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

export function useExecutePayoutAddressChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "executePayoutAddressChange",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

export function useCancelPayoutAddressChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "cancelPayoutAddressChange",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

// ─── Stakeholders timelock ────────────────────────────────────────────────────

export function useQueueStakeholdersChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(
    (stakeholders: { recipient: `0x${string}`; shareBps: number }[]) => {
      writeContract({
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: "queueStakeholdersChange",
        args: [stakeholders],
      });
    },
    [accountAddress, writeContract]
  );

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

export function useExecuteStakeholdersChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "executeStakeholdersChange",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

export function useCancelStakeholdersChange(accountAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitState(hash);

  const write = useCallback(() => {
    writeContract({
      address: accountAddress,
      abi: SMART_ACCOUNT_ABI,
      functionName: "cancelStakeholdersChange",
      args: [],
    });
  }, [accountAddress, writeContract]);

  return { write, isPending, isConfirming, isSuccess, error: error as Error | null, txHash: hash };
}

// Re-export for convenience
export { parseEther };
