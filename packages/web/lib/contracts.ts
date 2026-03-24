// SmartAccount ABI — full interface for rebuilt contract
// Two-parameter model: threshold + sellerOverflowBps, instant-forward payments

export const SMART_ACCOUNT_ABI = [
  // ── State reads ────────────────────────────────────────────────────────────
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "token", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "payoutAddress", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "threshold", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "sellerOverflowBps", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "beneficiaryMode", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "accountName", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "currentPeriodId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "periodStart", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "periodDuration", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "periodIncome", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "redistributionHeld", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "sellerClaimable", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "pendingPeriodDuration", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "economicParamsChangeReadyAt", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "payoutAddressChangeReadyAt", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "stakeholdersChangeReadyAt", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },

  // ── View functions ─────────────────────────────────────────────────────────
  {
    type: "function",
    name: "getStakeholders",
    inputs: [],
    outputs: [{
      name: "",
      type: "tuple[]",
      components: [
        { name: "recipient", type: "address" },
        { name: "shareBps", type: "uint16" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPendingStakeholders",
    inputs: [],
    outputs: [{
      type: "tuple[]",
      components: [
        { name: "recipient", type: "address" },
        { name: "shareBps", type: "uint16" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getClaimable",
    inputs: [{ name: "stakeholder", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBuyerContribution",
    inputs: [
      { name: "pid", type: "uint256" },
      { name: "buyer", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPeriodRedistributionInfo",
    inputs: [{ name: "pid", type: "uint256" }],
    outputs: [
      { name: "pot", type: "uint256" },
      { name: "totalContribs", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPeriodStatus",
    inputs: [],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "start", type: "uint256" },
      { name: "end", type: "uint256" },
      { name: "income", type: "uint256" },
      { name: "held", type: "uint256" },
      { name: "timeRemaining", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBalance",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkUpkeep",
    inputs: [{ name: "", type: "bytes" }],
    outputs: [
      { name: "upkeepNeeded", type: "bool" },
      { name: "performData", type: "bytes" },
    ],
    stateMutability: "view",
  },

  // ── Write functions ────────────────────────────────────────────────────────
  { type: "function", name: "sellerClaim", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "stakeholderClaim", inputs: [], outputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "claimBuyerRedistribution",
    inputs: [{ name: "pid", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "closePeriod", inputs: [], outputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "performUpkeep",
    inputs: [{ name: "", type: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "queueEconomicParamsChange",
    inputs: [
      { name: "newThreshold", type: "uint256" },
      { name: "newSellerOverflowBps", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "executeEconomicParamsChange", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelEconomicParamsChange", inputs: [], outputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "queuePayoutAddressChange",
    inputs: [{ name: "newAddress", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "executePayoutAddressChange", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelPayoutAddressChange", inputs: [], outputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "queueStakeholdersChange",
    inputs: [{
      name: "newStakeholders",
      type: "tuple[]",
      components: [
        { name: "recipient", type: "address" },
        { name: "shareBps", type: "uint16" },
      ],
    }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "executeStakeholdersChange", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelStakeholdersChange", inputs: [], outputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "updatePeriodDuration",
    inputs: [{ name: "newDuration", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateAccountName",
    inputs: [{ name: "newName", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "pause", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unpause", inputs: [], outputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ── Receive ETH ────────────────────────────────────────────────────────────
  { type: "receive", stateMutability: "payable" },

  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "PaymentReceived",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "periodTotal", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ForwardedToSeller",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ForwardFailed",
    inputs: [{ name: "amount", type: "uint256", indexed: false }],
  },
  {
    type: "event",
    name: "SellerClaimed",
    inputs: [{ name: "amount", type: "uint256", indexed: false }],
  },
  {
    type: "event",
    name: "PeriodClosed",
    inputs: [
      { name: "periodId", type: "uint256", indexed: true },
      { name: "closedAt", type: "uint256", indexed: false },
      { name: "totalIncome", type: "uint256", indexed: false },
      { name: "redistributionPot", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "StakeholderClaimed",
    inputs: [
      { name: "stakeholder", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BuyerRedistributionClaimed",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "periodId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

// SmartAccountFactory ABI
export const FACTORY_ABI = [
  {
    type: "function",
    name: "createAccount",
    inputs: [
      { name: "payoutAddress", type: "address" },
      { name: "threshold", type: "uint256" },
      { name: "sellerOverflowBps", type: "uint256" },
      { name: "periodDuration", type: "uint256" },
      { name: "token", type: "address" },
      { name: "beneficiaryMode", type: "uint8" },
      {
        name: "stakeholders",
        type: "tuple[]",
        components: [
          { name: "recipient", type: "address" },
          { name: "shareBps", type: "uint16" },
        ],
      },
      { name: "accountName", type: "string" },
    ],
    outputs: [{ name: "account", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAccountsByOwner",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllAccounts",
    inputs: [],
    outputs: [{ type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalAccounts",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "implementation",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AccountCreated",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "account", type: "address", indexed: true },
      { name: "threshold", type: "uint256", indexed: false },
      { name: "periodDuration", type: "uint256", indexed: false },
      { name: "token", type: "address", indexed: false },
      { name: "accountName", type: "string", indexed: false },
    ],
  },
] as const;

// BeneficiaryMode enum values (mirrors Solidity enum order)
export const BeneficiaryMode = {
  FIXED_LIST: 0,
  BUYERS: 1,
} as const;
export type BeneficiaryModeValue = (typeof BeneficiaryMode)[keyof typeof BeneficiaryMode];

// Factory contract addresses by chain ID
export const FACTORY_ADDRESSES: Record<number, `0x${string}`> = {
  // Base Mainnet (chainId 8453)
  8453: (process.env.NEXT_PUBLIC_BASE_FACTORY_ADDRESS || "") as `0x${string}`,
  // Base Sepolia (chainId 84532)
  84532: (process.env.NEXT_PUBLIC_BASE_SEPOLIA_FACTORY_ADDRESS || "") as `0x${string}`,
  // Optimism Mainnet (chainId 10)
  10: (process.env.NEXT_PUBLIC_OPTIMISM_FACTORY_ADDRESS || "") as `0x${string}`,
  // Optimism Sepolia (chainId 11155420)
  11155420: (process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_FACTORY_ADDRESS || "") as `0x${string}`,
  // Localhost / Hardhat (chainId 31337) — fill after pnpm deploy:local
  31337: (process.env.NEXT_PUBLIC_LOCALHOST_FACTORY_ADDRESS || "") as `0x${string}`,
};

export function getFactoryAddress(chainId: number): `0x${string}` {
  const addr = FACTORY_ADDRESSES[chainId];
  if (addr === undefined) {
    throw new Error(`No factory address configured for chain ${chainId}`);
  }
  if (!addr) {
    throw new Error(
      `Factory not yet deployed on chain ${chainId}. Deploy contracts first.`
    );
  }
  return addr;
}

// Zero address constant (ETH token sentinel)
export const ETH_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
