"use client";

import { useAccount, useDisconnect, useChainId } from "wagmi";
import { useModal } from "connectkit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatAddress } from "@/lib/format";
import { getChainById } from "@/lib/chains";
import { LogOut, Wallet, Network } from "lucide-react";

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpen } = useModal();
  const chainId = useChainId();

  let chainName = "Unknown";
  try {
    chainName = getChainById(chainId).name;
  } catch {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your wallet connection.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Connected wallet
          </CardTitle>
          <CardDescription>
            Your active wallet for signing transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && address ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-medium">{address}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatAddress(address)}
                </p>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">No wallet connected.</p>
              <Button size="sm" onClick={() => setOpen(true)}>
                Connect
              </Button>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Network</span>
            </div>
            <Badge variant="outline">{chainName}</Badge>
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <div>
          <Button
            variant="outline"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => disconnect()}
          >
            <LogOut className="h-4 w-4" />
            Disconnect wallet
          </Button>
        </div>
      )}
    </div>
  );
}
