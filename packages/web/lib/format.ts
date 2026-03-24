import { formatEther, formatUnits } from "viem";

/**
 * Formats a bigint token amount to a human-readable string.
 * Defaults to 18 decimals (ETH).
 */
export function formatAmount(amount: bigint, decimals = 18): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  if (num < 1) return num.toFixed(4).replace(/\.?0+$/, "");
  if (num < 1000) return num.toFixed(4).replace(/\.?0+$/, "");
  if (num < 1_000_000) return (num / 1000).toFixed(2) + "k";
  return (num / 1_000_000).toFixed(2) + "M";
}

/**
 * Formats a bigint token amount with a $ prefix for USD display.
 */
export function formatAmountUSD(amount: bigint, decimals = 18): string {
  return `$${formatAmount(amount, decimals)}`;
}

/**
 * Formats a full ETH amount without abbreviation — useful for balances.
 */
export function formatEthFull(amount: bigint): string {
  const str = formatEther(amount);
  const num = parseFloat(str);
  if (num === 0) return "0 ETH";
  if (num < 0.0001) return "< 0.0001 ETH";
  return `${num.toFixed(6).replace(/\.?0+$/, "")} ETH`;
}

/**
 * Truncates an Ethereum address to "0x1234...5678" format.
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Converts basis points (0–10000) to a percentage string.
 * e.g. 5000 → "50.00%"
 */
export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Converts a period in seconds to a human-readable string.
 * e.g. 2592000 → "30 days"
 */
export function formatPeriod(seconds: number): string {
  const days = Math.round(seconds / 86400);
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  const weeks = Math.round(days / 7);
  if (days < 28) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.round(days / 30);
  if (days < 365) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.round(days / 365);
  return `${years} year${years !== 1 ? "s" : ""}`;
}

/**
 * Formats remaining seconds into a "2d 5h 30m" countdown string.
 */
export function formatTimeRemaining(seconds: bigint): string {
  const total = Number(seconds);
  if (total <= 0) return "Period ended";

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(" ");
}

/**
 * Returns a percentage (0–100) for a progress bar from income vs threshold.
 */
export function calcProgress(income: bigint, threshold: bigint): number {
  if (threshold === 0n) return 0;
  const pct = Number((income * 10000n) / threshold) / 100;
  return Math.min(pct, 100);
}
