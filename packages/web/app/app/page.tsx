"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useOwnerAccounts, useAccountStatus } from "@/hooks/use-capz-accounts";
import { formatAmount, formatPeriod, calcProgress } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ExternalLink, ArrowDownToLine } from "lucide-react";

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function AccountCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 rounded shimmer" />
        <div className="h-5 w-16 rounded-full shimmer" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded shimmer" />
          <div className="h-3 w-12 rounded shimmer" />
        </div>
        <div className="h-2 w-full rounded-full shimmer" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-md shimmer" />
        <div className="h-8 w-24 rounded-md shimmer" />
      </div>
    </div>
  );
}

// ─── Account card ─────────────────────────────────────────────────────────────

function AccountCard({ address }: { address: `0x${string}` }) {
  const status = useAccountStatus(address);

  if (status.isLoading) return <AccountCardSkeleton />;

  const progress = calcProgress(
    status.periodIncome,
    status.threshold
  );

  const periodLabel = status.periodDuration
    ? formatPeriod(Number(status.periodDuration))
    : "—";

  const thresholdStr = formatAmount(status.threshold);
  const incomeStr = formatAmount(status.periodIncome);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5 hover:border-primary/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base">
            {status.name || "Unnamed account"}
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {address.slice(0, 10)}…{address.slice(-6)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status.paused && <Badge variant="warning">Paused</Badge>}
          {status.canClose && (
            <Badge variant="success">Period ready</Badge>
          )}
        </div>
      </div>

      {/* Period progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {incomeStr} ETH received
          </span>
          <span>{progress.toFixed(0)}% of cap</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Cap: {thresholdStr} ETH / {periodLabel}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href={`/app/accounts/${address}`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </Button>
        </Link>
        {status.redistributionHeld > 0n && (
          <Link href={`/app/accounts/${address}`}>
            <Button size="sm" variant="default" className="gap-1.5">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              {formatAmount(status.redistributionHeld)} ETH held
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 text-center space-y-5">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <PlusCircle className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">No accounts yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
          Create your first Capz account to start receiving payments with
          automatic redistribution.
        </p>
      </div>
      <Link href="/app/setup">
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create your first account
        </Button>
      </Link>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { address: ownerAddress } = useAccount();

  const { accounts, isLoading } = useOwnerAccounts(ownerAddress);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Capz Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your income caps and stakeholder distributions.
          </p>
        </div>
        <Link href="/app/setup">
          <Button className="gap-2 hidden sm:flex">
            <PlusCircle className="h-4 w-4" />
            New account
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <AccountCardSkeleton />
          <AccountCardSkeleton />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((addr) => (
              <AccountCard key={addr} address={addr as `0x${string}`} />
            ))}
          </div>
          <div className="sm:hidden">
            <Link href="/app/setup">
              <Button className="w-full gap-2">
                <PlusCircle className="h-4 w-4" />
                New account
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
