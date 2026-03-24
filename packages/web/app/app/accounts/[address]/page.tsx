"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { usePublicClient } from "wagmi";
import {
  useAccountStatus,
  useStakeholders,
  useClaimableForAddress,
} from "@/hooks/use-capz-accounts";
import {
  useSellerClaim,
  useStakeholderClaim,
  useClosePeriod,
} from "@/hooks/use-capz-write";
import {
  formatAmount,
  formatAddress,
  formatPercent,
  formatTimeRemaining,
  calcProgress,
} from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  CheckCheck,
  Loader2,
  Clock,
  TrendingUp,
  Users,
  ShoppingCart,
  Zap,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ${className}`}
      aria-label="Copy"
    >
      {copied ? (
        <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded shimmer ${className}`} />;
}

// ─── Payment event row ────────────────────────────────────────────────────────

interface PaymentEvent {
  from: string;
  amount: bigint;
  periodTotal: bigint;
  blockNumber: bigint;
  txHash: string;
}

function usePaymentEvents(accountAddress: string) {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!publicClient || !isAddress(accountAddress)) return;
    setLoading(true);
    const paymentReceivedEvent = {
      type: "event" as const,
      name: "PaymentReceived" as const,
      inputs: [
        { name: "from", type: "address" as const, indexed: true },
        { name: "amount", type: "uint256" as const, indexed: false },
        { name: "periodTotal", type: "uint256" as const, indexed: false },
      ],
    };

    publicClient
      .getLogs({
        address: accountAddress as `0x${string}`,
        event: paymentReceivedEvent,
        fromBlock: "earliest",
        toBlock: "latest",
      })
      .then((logs) => {
        const parsed = logs.map((log) => ({
          from: (log.args as { from?: string }).from ?? "",
          amount: (log.args as { amount?: bigint }).amount ?? 0n,
          periodTotal: (log.args as { periodTotal?: bigint }).periodTotal ?? 0n,
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? "",
        }));
        setEvents(parsed.reverse());
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [publicClient, accountAddress]);

  return { events, loading };
}

// ─── StakeholderRow ───────────────────────────────────────────────────────────

function StakeholderRow({
  accountAddress,
  recipient,
  shareBps,
  isOwner,
}: {
  accountAddress: `0x${string}`;
  recipient: `0x${string}`;
  shareBps: number;
  isOwner: boolean;
}) {
  const { claimable, isLoading } = useClaimableForAddress(accountAddress, recipient);
  const { write, isPending, isConfirming } = useStakeholderClaim(accountAddress);

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
          {recipient.slice(2, 4).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{formatAddress(recipient)}</span>
            <CopyButton text={recipient} />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatPercent(shareBps)} allocation
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <span className="text-sm font-medium">{formatAmount(claimable)} ETH</span>
        )}
        {isOwner && claimable > 0n && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => write()}
            disabled={isPending || isConfirming}
            className="gap-1.5"
          >
            {isPending || isConfirming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Claim
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Account detail page ──────────────────────────────────────────────────────

export default function AccountDetailPage() {
  const params = useParams();
  const rawAddress = Array.isArray(params.address) ? params.address[0] : params.address;
  const accountAddress = (rawAddress ?? "") as `0x${string}`;

  const { address: ownerAddress } = useAccount();

  const status = useAccountStatus(accountAddress);
  const { stakeholders } = useStakeholders(accountAddress);
  const { events: payments, loading: paymentsLoading } = usePaymentEvents(accountAddress);

  const isActualOwner =
    !!ownerAddress && !!status.owner &&
    status.owner.toLowerCase() === ownerAddress.toLowerCase();

  const progress = calcProgress(status.periodIncome, status.threshold);
  const isBuyersMode = status.beneficiaryMode === 1;

  const sellerClaimHook = useSellerClaim(accountAddress);
  const closeHook = useClosePeriod(accountAddress);

  if (!isAddress(accountAddress)) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Invalid account address.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        {status.isLoading ? (
          <Skeleton className="h-7 w-48" />
        ) : (
          <h1 className="text-2xl font-bold">{status.name || "Unnamed account"}</h1>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">{accountAddress}</span>
          <CopyButton text={accountAddress} />
          {status.paused && <Badge variant="warning">Paused</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/pay/${accountAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View payment page
          </a>
        </div>
      </div>

      {/* Period status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Current period
            </CardTitle>
            {status.canClose && (
              <Button
                size="sm"
                onClick={() => closeHook.write()}
                disabled={closeHook.isPending || closeHook.isConfirming}
                className="gap-1.5"
              >
                {closeHook.isPending || closeHook.isConfirming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Close period
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {status.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Income this period</span>
                  <span className="font-medium">
                    {formatAmount(status.periodIncome)} / {formatAmount(status.threshold)} ETH ({progress.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Period income",
                    value: `${formatAmount(status.periodIncome)} ETH`,
                    icon: TrendingUp,
                  },
                  {
                    label: "Redistribution held",
                    value: `${formatAmount(status.redistributionHeld)} ETH`,
                    icon: isBuyersMode ? ShoppingCart : Users,
                  },
                  {
                    label: "Time remaining",
                    value: status.periodStatus
                      ? formatTimeRemaining(status.periodStatus.timeRemaining)
                      : "—",
                    icon: Clock,
                  },
                  {
                    label: "Contract balance",
                    value: `${formatAmount(status.balance)} ETH`,
                    icon: Zap,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1"
                  >
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payout settings (owner view) */}
      {isActualOwner && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payout settings</CardTitle>
            <CardDescription>
              Where your income flows. Income below your cap is instantly forwarded to your payout address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Payout address</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{formatAddress(status.payoutAddress)}</span>
                {status.payoutAddress && <CopyButton text={status.payoutAddress} />}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Overflow split</span>
              <span className="font-medium">
                {(Number(status.sellerOverflowBps) / 100).toFixed(0)}% you ·{" "}
                {(100 - Number(status.sellerOverflowBps) / 100).toFixed(0)}% redistribution
              </span>
            </div>

            {/* Seller claimable escape hatch */}
            {status.sellerClaimable > 0n && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-amber-400">Failed forward recovery</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ETH that failed to forward automatically to your payout address.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold">{formatAmount(status.sellerClaimable)} ETH</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sellerClaimHook.write()}
                      disabled={sellerClaimHook.isPending || sellerClaimHook.isConfirming}
                      className="gap-1.5"
                    >
                      {sellerClaimHook.isPending || sellerClaimHook.isConfirming ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                      Recover
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Redistribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {isBuyersMode ? (
              <ShoppingCart className="h-4 w-4 text-primary" />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
            {isBuyersMode ? "Buyer redistribution" : "Stakeholders"}
          </CardTitle>
          <CardDescription>
            {isBuyersMode
              ? "Anyone who paid this period can claim their proportional share after the period closes."
              : "Wallets that share income above your cap."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBuyersMode ? (
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground space-y-2">
              <p>
                This account uses <span className="font-medium text-foreground">buyers mode</span>. At period end,
                buyers can visit the{" "}
                <a href="/claim" className="text-primary hover:underline">
                  claim page
                </a>{" "}
                to collect their share of{" "}
                <span className="font-medium text-foreground">
                  {formatAmount(status.redistributionHeld)} ETH
                </span>{" "}
                held so far this period.
              </p>
            </div>
          ) : stakeholders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No stakeholders configured.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {stakeholders.map((s) => (
                <StakeholderRow
                  key={s.recipient}
                  accountAddress={accountAddress}
                  recipient={s.recipient}
                  shareBps={s.shareBps}
                  isOwner={isActualOwner}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent payments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent payments</CardTitle>
          <CardDescription>
            Payments received by this account, most recent first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payments received yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {payments.slice(0, 20).map((p) => (
                <div
                  key={`${p.txHash}-${p.blockNumber}`}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                      ↓
                    </div>
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatAddress(p.from)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Block #{p.blockNumber.toString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatAmount(p.amount)} ETH</p>
                    <p className="text-xs text-muted-foreground">
                      Period total: {formatAmount(p.periodTotal)} ETH
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
