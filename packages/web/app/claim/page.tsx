"use client";

import { useState, useCallback } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useClaimableForAddress } from "@/hooks/use-capz-accounts";
import { useStakeholderClaim } from "@/hooks/use-capz-write";
import { formatAmount, formatAddress } from "@/lib/format";
import { FACTORY_ABI, getFactoryAddress } from "@/lib/contracts";
import { useReadContract, useChainId } from "wagmi";
import { Loader2, Search, ArrowDownToLine, CheckCheck } from "lucide-react";

// ─── Single claimable row ────────────────────────────────────────────────────

function ClaimRow({
  accountAddress,
  stakerAddress,
}: {
  accountAddress: `0x${string}`;
  stakerAddress: string;
}) {
  const { claimable, isLoading, refetch } = useClaimableForAddress(
    accountAddress,
    stakerAddress
  );
  const { write, isPending, isConfirming, isSuccess } =
    useStakeholderClaim(accountAddress);

  const handleClaim = useCallback(async () => {
    write();
    // refetch after confirm
    setTimeout(refetch, 3000);
  }, [write, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="h-8 w-8 rounded-full shimmer" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-32 rounded shimmer" />
          <div className="h-3 w-20 rounded shimmer" />
        </div>
        <div className="h-8 w-24 rounded-md shimmer" />
      </div>
    );
  }

  if (claimable === 0n) return null;

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-mono text-sm font-medium">
          {formatAddress(accountAddress)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatAmount(claimable)} ETH claimable
        </p>
      </div>
      <Button
        size="sm"
        onClick={handleClaim}
        disabled={isPending || isConfirming || isSuccess}
        className="gap-1.5"
      >
        {isSuccess ? (
          <>
            <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
            Claimed
          </>
        ) : isPending || isConfirming ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {isPending ? "Confirm…" : "Confirming…"}
          </>
        ) : (
          <>
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Claim
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Account list fetcher ─────────────────────────────────────────────────────

function ClaimList({
  stakerAddress,
}: {
  stakerAddress: string;
}) {
  const chainId = useChainId();

  let factoryAddress: `0x${string}` | undefined;
  try {
    factoryAddress = getFactoryAddress(chainId);
  } catch {
    factoryAddress = undefined;
  }

  const { data: allAccounts, isLoading } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: "getAllAccounts",
    query: { enabled: !!factoryAddress },
  });

  const accounts = (allAccounts as `0x${string}`[] | undefined) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Scanning accounts…
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No Capz accounts found on this network.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground mb-4">
        Checking {accounts.length} account{accounts.length !== 1 ? "s" : ""}…
      </p>
      <div className="divide-y divide-border">
        {accounts.map((addr) => (
          <ClaimRow
            key={addr}
            accountAddress={addr}
            stakerAddress={stakerAddress}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClaimPage() {
  const { address: connectedAddress } = useAccount();

  const defaultAddress = connectedAddress ?? "";

  const [inputAddress, setInputAddress] = useState(defaultAddress);
  const [checkedAddress, setCheckedAddress] = useState<string>("");

  const handleCheck = useCallback(() => {
    if (isAddress(inputAddress)) {
      setCheckedAddress(inputAddress);
    }
  }, [inputAddress]);

  const isValid = isAddress(inputAddress);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold">Claim your Capz earnings</h1>
            <p className="text-muted-foreground">
              Enter your wallet address to see all claimable balances across
              Capz accounts on this network.
            </p>
          </div>

          {/* Input */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stakerAddress">Your wallet address</Label>
                <div className="flex gap-2">
                  <Input
                    id="stakerAddress"
                    placeholder="0x..."
                    value={inputAddress}
                    onChange={(e) => setInputAddress(e.target.value)}
                    className={`flex-1 font-mono text-sm ${
                      inputAddress && !isValid ? "border-destructive" : ""
                    }`}
                  />
                  <Button
                    onClick={handleCheck}
                    disabled={!isValid}
                    className="gap-1.5"
                  >
                    <Search className="h-4 w-4" />
                    Check
                  </Button>
                </div>
                {inputAddress && !isValid && (
                  <p className="text-xs text-destructive">
                    Enter a valid Ethereum address.
                  </p>
                )}
                {!inputAddress && connectedAddress && (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => setInputAddress(connectedAddress)}
                  >
                    Use connected wallet ({formatAddress(connectedAddress)})
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {checkedAddress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Claimable balances
                </CardTitle>
                <CardDescription>
                  For {formatAddress(checkedAddress)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClaimList stakerAddress={checkedAddress} />
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>
              You need a connected wallet to submit claim transactions.
            </p>
            <p>
              No wallet? You can still check balances by entering an address
              above.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
