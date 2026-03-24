"use client";

import Link from "next/link";
import { useAccount, useDisconnect } from "wagmi";
import { useModal } from "connectkit";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/format";
import { LogOut, Wallet } from "lucide-react";

export function Nav() {
  const { address, isConnected, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpen } = useModal();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-primary">capz</span>
          </span>
          <span className="hidden sm:inline-block h-5 w-px bg-border/60" />
          <span className="hidden sm:inline-block text-xs text-muted-foreground font-medium tracking-wide">
            honor your values
          </span>
        </Link>

        {/* Right side actions */}
        <nav className="flex items-center gap-3">
          {isReconnecting ? (
            <div className="h-8 w-24 rounded-md shimmer" />
          ) : isConnected && address ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-mono text-foreground/80">
                  {formatAddress(address)}
                </span>
              </div>
              <Link href="/app">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnect()}
                className="gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setOpen(true)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Connect Wallet
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
