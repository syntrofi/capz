"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { isAddress } from "viem";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAccountStatus, useStakeholders } from "@/hooks/use-capz-accounts";
import { formatAmount, formatAddress, formatPercent, formatPeriod, calcProgress } from "@/lib/format";
import { Copy, CheckCheck, ExternalLink, Shield, Users } from "lucide-react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={`rounded shimmer ${className}`} />;
}

// ─── Pay page ─────────────────────────────────────────────────────────────────

export default function PayPage() {
  const params = useParams();
  const rawAddress = Array.isArray(params.address)
    ? params.address[0]
    : params.address;
  const accountAddress = (rawAddress ?? "") as `0x${string}`;

  const [copied, setCopied] = useState(false);

  const status = useAccountStatus(accountAddress);
  const { stakeholders } = useStakeholders(accountAddress);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(accountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAddress(accountAddress)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Invalid address.
        </main>
      </div>
    );
  }

  const progress = calcProgress(status.periodIncome, status.threshold);
  const periodLabel = status.periodDuration
    ? formatPeriod(Number(status.periodDuration))
    : "—";

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <main className="flex-1 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-lg space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            {status.isLoading ? (
              <Sk className="h-8 w-48 mx-auto" />
            ) : (
              <h1 className="text-3xl font-bold">
                {status.name || "Capz Account"}
              </h1>
            )}
            <p className="text-muted-foreground text-sm">
              This seller uses Capz to automatically share income above a set
              cap with their community.
            </p>
          </div>

          {/* Cap explanation */}
          {!status.isLoading && status.threshold > 0n && (
            <div className="rounded-xl border border-border/50 bg-primary/5 p-5 space-y-1">
              <p className="text-sm font-medium">
                This seller caps their income at{" "}
                <span className="text-primary font-semibold">
                  {formatAmount(status.threshold)} ETH
                </span>{" "}
                per {periodLabel}.
              </p>
              <p className="text-sm text-muted-foreground">
                Every ETH above that cap is automatically redistributed to their
                stakeholders. No manual action required.
              </p>
            </div>
          )}

          {/* Period progress */}
          {!status.isLoading && status.threshold > 0n && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current period progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatAmount(status.periodIncome)} ETH received
                  </span>
                  <span className="font-medium">
                    {progress.toFixed(1)}% of cap
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>
                    Cap: {formatAmount(status.threshold)} ETH / {periodLabel}
                  </span>
                </div>
                {progress >= 100 && (
                  <Badge variant="success" className="w-full justify-center">
                    Cap reached — redistribution pending
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stakeholders */}
          {stakeholders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Where the excess goes
                </CardTitle>
                <CardDescription className="text-xs">
                  Income above the cap is split between these wallets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stakeholders.map((s) => (
                    <div key={s.recipient} className="flex items-center gap-3">
                      {/* Allocation bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatAddress(s.recipient)}
                          </span>
                          <span className="text-xs font-medium shrink-0 ml-2">
                            {formatPercent(s.shareBps)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${s.shareBps / 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment address */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pay to this address</CardTitle>
              <CardDescription>
                Send ETH directly to this address. Your payment is tracked and
                the cap logic applies automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR placeholder */}
              <div className="mx-auto h-44 w-44 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground bg-secondary/30">
                QR code
              </div>

              {/* Address */}
              <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3">
                <p className="font-mono text-sm break-all text-center">
                  {accountAddress}
                </p>
              </div>

              <Button
                variant="default"
                className="w-full gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <CheckCheck className="h-4 w-4 text-emerald-400" />
                    Address copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy address
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Trust signals */}
          <div className="flex flex-col sm:flex-row gap-3 text-xs text-muted-foreground">
            {[
              {
                icon: <Shield className="h-4 w-4 text-emerald-400" />,
                text: "Non-custodial — funds go directly on-chain",
              },
              {
                icon: <ExternalLink className="h-4 w-4 text-primary" />,
                text: "Rules are in the smart contract, not with the seller",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 flex-1 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5"
              >
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Capz link */}
          <p className="text-center text-xs text-muted-foreground">
            Powered by{" "}
            <a href="/" className="text-primary hover:underline font-medium">
              Capz
            </a>{" "}
            · Built on Ethereum
          </p>
        </div>
      </main>
    </div>
  );
}
