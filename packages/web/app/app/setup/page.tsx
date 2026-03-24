"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { isAddress, parseEther, decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCreateAccount } from "@/hooks/use-capz-write";
import { formatAddress, formatAmount } from "@/lib/format";
import { FACTORY_ABI, ETH_ADDRESS, BeneficiaryMode } from "@/lib/contracts";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  CheckCheck,
  Loader2,
  ExternalLink,
  Check,
  Users,
  ShoppingCart,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StakeholderRow {
  id: string;
  name: string;
  address: string;
  percent: string;
}

interface SetupState {
  accountName: string;
  payoutAddress: string;
  thresholdEth: string;
  sellerOverflowPercent: string;  // 0–100, converted to bps on submit
  token: "ETH";
  periodSeconds: string;
  beneficiaryMode: "FIXED_LIST" | "BUYERS";
  stakeholders: StakeholderRow[];
}

const PERIOD_OPTIONS = [
  { label: "30 days", value: String(30 * 86400) },
  { label: "90 days", value: String(90 * 86400) },
  { label: "180 days", value: String(180 * 86400) },
  { label: "365 days", value: String(365 * 86400) },
];

const KNOWN_CAUSES: StakeholderRow[] = [
  {
    id: "gitcoin",
    name: "Gitcoin",
    address: "0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6",
    percent: "10",
  },
  {
    id: "ethfoundation",
    name: "Ethereum Foundation",
    address: "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe",
    percent: "10",
  },
];

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                ? "border-2 border-primary text-primary"
                : "border border-border text-muted-foreground"
            }`}
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-6 ${i < current ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Set your cap ────────────────────────────────────────────────────

function Step1({
  state,
  onChange,
  onNext,
}: {
  state: SetupState;
  onChange: (partial: Partial<SetupState>) => void;
  onNext: () => void;
}) {
  const { address: walletAddr } = useAccount();

  const canProceed =
    state.accountName.trim().length > 0 &&
    isAddress(state.payoutAddress) &&
    parseFloat(state.thresholdEth) > 0 &&
    !!state.periodSeconds;

  const sellerPct = parseFloat(state.sellerOverflowPercent) || 0;
  const stakeholderPct = 100 - sellerPct;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configure your account</h2>
        <p className="text-muted-foreground mt-1">
          Set where income gets forwarded, your cap, and how overflow is split.
        </p>
      </div>

      <div className="space-y-4">
        {/* Account name */}
        <div className="space-y-2">
          <Label htmlFor="accountName">Account name</Label>
          <Input
            id="accountName"
            placeholder="e.g. Consulting income, Product sales"
            value={state.accountName}
            onChange={(e) => onChange({ accountName: e.target.value })}
          />
        </div>

        {/* Payout address */}
        <div className="space-y-2">
          <Label htmlFor="payoutAddress">Payout address</Label>
          <div className="flex gap-2">
            <Input
              id="payoutAddress"
              placeholder="0x... (your wallet or multisig)"
              value={state.payoutAddress}
              onChange={(e) => onChange({ payoutAddress: e.target.value })}
              className={`flex-1 font-mono text-sm ${
                state.payoutAddress && !isAddress(state.payoutAddress)
                  ? "border-destructive"
                  : ""
              }`}
            />
            {walletAddr && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange({ payoutAddress: walletAddr })}
                className="shrink-0 text-xs"
              >
                Use mine
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Payments below your cap are instantly forwarded here. Must be a wallet you control.
          </p>
        </div>

        {/* Threshold */}
        <div className="space-y-2">
          <Label htmlFor="threshold">Income cap (threshold)</Label>
          <div className="flex gap-2">
            <Input
              id="threshold"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={state.thresholdEth}
              onChange={(e) => onChange({ thresholdEth: e.target.value })}
              className="flex-1"
            />
            <div className="h-9 px-3 flex items-center rounded-md border border-input bg-secondary/50 text-sm font-medium text-muted-foreground">
              ETH
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            100% of income below this cap goes straight to your payout address per period.
          </p>
        </div>

        {/* Seller overflow share */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="overflow">Your share of overflow</Label>
            <span className="text-sm font-semibold text-primary">
              {sellerPct.toFixed(0)}% you · {stakeholderPct.toFixed(0)}% redistribution
            </span>
          </div>
          <Input
            id="overflow"
            type="range"
            min="0"
            max="100"
            step="5"
            value={state.sellerOverflowPercent}
            onChange={(e) => onChange({ sellerOverflowPercent: e.target.value })}
            className="h-2 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0% — fully non-extractive</span>
            <span>100% — keep everything</span>
          </div>
          <p className="text-xs text-muted-foreground">
            For income <span className="text-foreground">above</span> your cap: you keep{" "}
            {sellerPct.toFixed(0)}%, the rest goes to redistribution.
          </p>
        </div>

        {/* Period */}
        <div className="space-y-2">
          <Label>Period duration</Label>
          <Select
            value={state.periodSeconds}
            onValueChange={(v) => onChange({ periodSeconds: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Redistribution is settled at period end. Your cap resets each period.
          </p>
        </div>
      </div>

      {/* Example */}
      {parseFloat(state.thresholdEth) > 0 && state.periodSeconds && (
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-sm text-muted-foreground space-y-1">
          <p>
            If you receive{" "}
            <span className="text-foreground font-medium">
              {(parseFloat(state.thresholdEth) * 1.5).toFixed(3)} ETH
            </span>{" "}
            this {PERIOD_OPTIONS.find((p) => p.value === state.periodSeconds)?.label} period:
          </p>
          <p>
            → <span className="text-foreground font-medium">{state.thresholdEth} ETH</span> forwarded instantly (below cap)
          </p>
          <p>
            → <span className="text-foreground font-medium">
              {(parseFloat(state.thresholdEth) * 0.5 * sellerPct / 100).toFixed(4)} ETH
            </span>{" "}
            forwarded from overflow ({sellerPct.toFixed(0)}% of {(parseFloat(state.thresholdEth) * 0.5).toFixed(3)} ETH overflow)
          </p>
          <p>
            → <span className="text-foreground font-medium">
              {(parseFloat(state.thresholdEth) * 0.5 * stakeholderPct / 100).toFixed(4)} ETH
            </span>{" "}
            held for redistribution
          </p>
        </div>
      )}

      <Button onClick={onNext} disabled={!canProceed} className="w-full gap-2">
        Next: Who benefits?
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 2: Beneficiary mode + stakeholders ──────────────────────────────────

function Step2({
  state,
  onChange,
  onNext,
  onBack,
}: {
  state: SetupState;
  onChange: (partial: Partial<SetupState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { address: walletAddr } = useAccount();
  const ownerAddress = walletAddr ?? "";

  const totalPercent = state.stakeholders.reduce(
    (sum, s) => sum + (parseFloat(s.percent) || 0),
    0
  );

  const canProceed =
    state.beneficiaryMode === "BUYERS" ||
    (state.stakeholders.length > 0 &&
      Math.abs(totalPercent - 100) < 0.01 &&
      state.stakeholders.every(
        (s) => isAddress(s.address) && parseFloat(s.percent) > 0
      ));

  const addRow = () => {
    onChange({
      stakeholders: [
        ...state.stakeholders,
        { id: Math.random().toString(36).slice(2), name: "", address: "", percent: "" },
      ],
    });
  };

  const removeRow = (id: string) => {
    onChange({ stakeholders: state.stakeholders.filter((s) => s.id !== id) });
  };

  const updateRow = (id: string, field: keyof StakeholderRow, value: string) => {
    onChange({
      stakeholders: state.stakeholders.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const addMyself = () => {
    if (!ownerAddress) return;
    if (state.stakeholders.some((s) => s.address.toLowerCase() === ownerAddress.toLowerCase())) return;
    onChange({
      stakeholders: [
        ...state.stakeholders,
        { id: Math.random().toString(36).slice(2), name: "Me", address: ownerAddress, percent: "" },
      ],
    });
  };

  const addCause = (cause: StakeholderRow) => {
    if (state.stakeholders.some((s) => s.address.toLowerCase() === cause.address.toLowerCase())) return;
    onChange({
      stakeholders: [...state.stakeholders, { ...cause, id: Math.random().toString(36).slice(2) }],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Who gets the redistribution?</h2>
        <p className="text-muted-foreground mt-1">
          Choose who receives the income held above your cap at period end.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChange({ beneficiaryMode: "FIXED_LIST" })}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${
            state.beneficiaryMode === "FIXED_LIST"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Users className={`h-5 w-5 mb-2 ${state.beneficiaryMode === "FIXED_LIST" ? "text-primary" : "text-muted-foreground"}`} />
          <p className="font-semibold text-sm">Fixed list</p>
          <p className="text-xs text-muted-foreground mt-1">
            Define specific wallets with fixed percentage allocations.
          </p>
        </button>
        <button
          onClick={() => onChange({ beneficiaryMode: "BUYERS" })}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${
            state.beneficiaryMode === "BUYERS"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <ShoppingCart className={`h-5 w-5 mb-2 ${state.beneficiaryMode === "BUYERS" ? "text-primary" : "text-muted-foreground"}`} />
          <p className="font-semibold text-sm">Buyers</p>
          <p className="text-xs text-muted-foreground mt-1">
            Anyone who paid this period can claim proportionally at period end.
          </p>
        </button>
      </div>

      {/* FIXED_LIST: stakeholder editor */}
      {state.beneficiaryMode === "FIXED_LIST" && (
        <div className="space-y-4">
          {/* Quick-add */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={addMyself} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add myself
            </Button>
            {KNOWN_CAUSES.map((c) => (
              <Button key={c.id} variant="outline" size="sm" onClick={() => addCause(c)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {c.name}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {state.stakeholders.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No stakeholders added yet. Use the buttons above or add one manually.
              </div>
            )}

            {state.stakeholders.map((row, idx) => (
              <div key={row.id} className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Stakeholder {idx + 1}
                  </span>
                  <button
                    onClick={() => removeRow(row.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove stakeholder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-[1fr_2fr_5rem] gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Label (optional)</Label>
                    <Input
                      placeholder="e.g. Alice"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, "name", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Wallet address</Label>
                    <Input
                      placeholder="0x..."
                      value={row.address}
                      onChange={(e) => updateRow(row.id, "address", e.target.value)}
                      className={`h-8 text-sm font-mono ${
                        row.address && !isAddress(row.address) ? "border-destructive" : ""
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">%</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0"
                      value={row.percent}
                      onChange={(e) => updateRow(row.id, "percent", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {state.stakeholders.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Total allocation</span>
              <span
                className={`font-semibold ${
                  Math.abs(totalPercent - 100) < 0.01
                    ? "text-emerald-400"
                    : totalPercent > 100
                    ? "text-destructive"
                    : "text-amber-400"
                }`}
              >
                {totalPercent.toFixed(2)}%{" "}
                {Math.abs(totalPercent - 100) < 0.01
                  ? "✓"
                  : totalPercent > 100
                  ? "(over 100%)"
                  : `(${(100 - totalPercent).toFixed(2)}% remaining)`}
              </span>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add stakeholder
          </Button>
        </div>
      )}

      {/* BUYERS: info */}
      {state.beneficiaryMode === "BUYERS" && (
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">How buyers mode works</p>
          <p>At the end of each period, the redistribution pot is split proportionally among all wallets that paid during that period.</p>
          <p>Buyers can claim their share any time after the period closes by visiting the claim page.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1 gap-2">
          Review & deploy
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Review & Deploy ──────────────────────────────────────────────────

function Step3({
  state,
  onBack,
  onDeploy,
  isPending,
  isConfirming,
  error,
}: {
  state: SetupState;
  onBack: () => void;
  onDeploy: () => void;
  isPending: boolean;
  isConfirming: boolean;
  error: Error | null;
}) {
  const periodLabel =
    PERIOD_OPTIONS.find((p) => p.value === state.periodSeconds)?.label ?? "—";
  const sellerPct = parseFloat(state.sellerOverflowPercent) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Deploy</h2>
        <p className="text-muted-foreground mt-1">
          Check everything looks right, then deploy your Capz account on-chain.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{state.accountName}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payout address</span>
            <span className="font-mono font-medium">{formatAddress(state.payoutAddress)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Income cap</span>
            <span className="font-medium">{state.thresholdEth} ETH / {periodLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overflow split</span>
            <span className="font-medium">{sellerPct.toFixed(0)}% you · {(100 - sellerPct).toFixed(0)}% redistribution</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Beneficiaries</span>
            <Badge variant="secondary">
              {state.beneficiaryMode === "FIXED_LIST" ? "Fixed list" : "Buyers"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token</span>
            <span className="font-medium">ETH (native)</span>
          </div>
        </CardContent>
      </Card>

      {state.beneficiaryMode === "FIXED_LIST" && state.stakeholders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stakeholders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {state.stakeholders.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatAddress(s.address)}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {s.percent}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Deploying requires a single on-chain transaction. Gas cost varies by
        network — typically under $0.05 on Base.
      </p>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error.message.includes("user rejected")
            ? "Transaction rejected by wallet."
            : "Deployment failed. Please try again."}
        </div>
      )}

      {(isPending || isConfirming) && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span className="text-muted-foreground">
            {isPending
              ? "Waiting for wallet confirmation…"
              : "Transaction submitted, waiting for block confirmation…"}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isPending || isConfirming}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onDeploy}
          disabled={isPending || isConfirming}
          className="flex-1 gap-2"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPending ? "Confirming…" : "Deploying…"}
            </>
          ) : (
            <>
              Deploy account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────

function Step4({ accountAddress }: { accountAddress: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(accountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [accountAddress]);

  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
        <CheckCheck className="h-8 w-8 text-emerald-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Your Capz address is ready</h2>
        <p className="text-muted-foreground">
          Share this address with buyers. Payments are instantly forwarded to your payout
          address — everything above your cap is held for redistribution at period end.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          Your Capz account address
        </p>
        <p className="text-sm sm:text-base font-mono font-semibold break-all">
          {accountAddress}
        </p>

        <div className="mx-auto h-36 w-36 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground bg-secondary/30">
          QR code
        </div>

        <Button onClick={copy} variant="outline" className="w-full gap-2">
          {copied ? (
            <>
              <CheckCheck className="h-4 w-4 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy address
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground text-left space-y-2">
        <p className="font-medium text-foreground">Share your payment page</p>
        <p>Buyers can see your cap and redistribution rules before they pay at:</p>
        <a
          href={`/pay/${accountAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono text-xs"
        >
          /pay/{accountAddress.slice(0, 10)}…
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a href={`/app/accounts/${accountAddress}`} className="flex-1">
          <Button className="w-full gap-2">
            Go to account dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}

// ─── Setup wizard ─────────────────────────────────────────────────────────────

const STEPS = 4;

export default function SetupPage() {
  const publicClient = usePublicClient();

  const [step, setStep] = useState(0);
  const [newAccountAddress, setNewAccountAddress] = useState<string>("");

  const [formState, setFormState] = useState<SetupState>({
    accountName: "",
    payoutAddress: "",
    thresholdEth: "",
    sellerOverflowPercent: "0",
    token: "ETH",
    periodSeconds: String(30 * 86400),
    beneficiaryMode: "FIXED_LIST",
    stakeholders: [],
  });

  const { write, isPending, isConfirming, isSuccess, error, txHash } =
    useCreateAccount();

  // Navigate to step 4 after success
  useEffect(() => {
    if (!isSuccess || !txHash || !publicClient) return;
    (async () => {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        for (const log of receipt.logs) {
          try {
            const event = decodeEventLog({
              abi: FACTORY_ABI,
              data: log.data,
              topics: log.topics,
              eventName: "AccountCreated",
            });
            if (event.args.account) {
              setNewAccountAddress(event.args.account as string);
              setStep(3);
              return;
            }
          } catch {
            // not this log
          }
        }
      } catch {
        setStep(3);
      }
    })();
  }, [isSuccess, txHash, publicClient]);

  const patchState = useCallback((partial: Partial<SetupState>) => {
    setFormState((prev) => ({ ...prev, ...partial }));
  }, []);

  const deploy = useCallback(() => {
    const threshold = parseEther(formState.thresholdEth as `${number}`);
    const sellerOverflowBps = BigInt(
      Math.round(parseFloat(formState.sellerOverflowPercent) * 100)
    );
    const beneficiaryModeValue =
      formState.beneficiaryMode === "FIXED_LIST"
        ? BeneficiaryMode.FIXED_LIST
        : BeneficiaryMode.BUYERS;
    const stakeholders =
      formState.beneficiaryMode === "FIXED_LIST"
        ? formState.stakeholders.map((s) => ({
            recipient: s.address as `0x${string}`,
            shareBps: Math.round(parseFloat(s.percent) * 100),
          }))
        : [];

    write({
      payoutAddress: formState.payoutAddress as `0x${string}`,
      threshold,
      sellerOverflowBps,
      periodDuration: BigInt(formState.periodSeconds),
      token: ETH_ADDRESS as `0x${string}`,
      beneficiaryMode: beneficiaryModeValue,
      stakeholders,
      accountName: formState.accountName,
    });
  }, [formState, write]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Capz Account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set up automatic income redistribution.
          </p>
        </div>
        {step < 3 && <StepIndicator current={step} total={STEPS - 1} />}
      </div>

      <Card>
        <CardContent className="pt-6">
          {step === 0 && (
            <Step1 state={formState} onChange={patchState} onNext={() => setStep(1)} />
          )}
          {step === 1 && (
            <Step2
              state={formState}
              onChange={patchState}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <Step3
              state={formState}
              onBack={() => setStep(1)}
              onDeploy={deploy}
              isPending={isPending}
              isConfirming={isConfirming}
              error={error}
            />
          )}
          {step === 3 && newAccountAddress && (
            <Step4 accountAddress={newAccountAddress} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
