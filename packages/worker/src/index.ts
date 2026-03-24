/**
 * Capz Automation Worker
 *
 * Runs on Cloudflare Workers with a cron trigger every 15 minutes.
 * Checks all active SmartAccount contracts to see if their period is ready
 * to be closed, then triggers Gelato Network to execute the on-chain call.
 *
 * Architecture:
 * - Worker polls accounts from D1 (fast, keyless)
 * - Uses viem to call checkUpkeep() (read-only, no signing needed)
 * - Delegates the actual transaction to Gelato (decentralized, no key management)
 *
 * Security design:
 * - Worker holds NO private keys
 * - All on-chain writes go through Gelato's executor network
 * - D1 DB only holds public addresses (no sensitive data)
 */

import { createPublicClient, http, type Address, type PublicClient } from "viem";
import { base, baseSepolia } from "viem/chains";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Env {
  DB: D1Database;
  GELATO_API_KEY: string;
  RPC_URL_BASE: string;
  RPC_URL_BASE_SEP: string;
  FACTORY_ADDRESS_BASE: string;
  FACTORY_ADDRESS_BASE_SEP: string;
  ENVIRONMENT: string;
}

interface AccountRow {
  address: string;
  chain_id: number;
  owner: string;
  gelato_task_id: string | null;
  created_at: string;
  last_checked_at: string | null;
  is_active: number; // SQLite boolean
}

interface CheckUpkeepResult {
  upkeepNeeded: boolean;
}

interface GelatoTaskResponse {
  taskId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ABI (minimal — only what we need)
// ─────────────────────────────────────────────────────────────────────────────

const CHECK_UPKEEP_ABI = [
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
] as const;

const FACTORY_ABI = [
  {
    type: "function",
    name: "getAllAccounts",
    inputs: [],
    outputs: [{ type: "address[]" }],
    stateMutability: "view",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Chain helpers
// ─────────────────────────────────────────────────────────────────────────────

function getChainConfig(chainId: number, env: Env) {
  switch (chainId) {
    case 8453: // Base mainnet
      return {
        chain: base,
        rpcUrl: env.RPC_URL_BASE,
        factoryAddress: env.FACTORY_ADDRESS_BASE as Address,
      };
    case 84532: // Base Sepolia
      return {
        chain: baseSepolia,
        rpcUrl: env.RPC_URL_BASE_SEP,
        factoryAddress: env.FACTORY_ADDRESS_BASE_SEP as Address,
      };
    default:
      return null;
  }
}

function getActiveChains(env: Env): number[] {
  const chains: number[] = [];
  if (env.RPC_URL_BASE && env.FACTORY_ADDRESS_BASE) chains.push(8453);
  if (env.RPC_URL_BASE_SEP && env.FACTORY_ADDRESS_BASE_SEP) chains.push(84532);
  return chains;
}

// ─────────────────────────────────────────────────────────────────────────────
// D1 Database operations
// ─────────────────────────────────────────────────────────────────────────────

async function initDB(db: D1Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      address TEXT NOT NULL,
      chain_id INTEGER NOT NULL,
      owner TEXT NOT NULL,
      gelato_task_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_checked_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (address, chain_id)
    );

    CREATE TABLE IF NOT EXISTS automation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_address TEXT NOT NULL,
      chain_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      result TEXT,
      gelato_task_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function getActiveAccounts(db: D1Database, chainId?: number): Promise<AccountRow[]> {
  const query = chainId
    ? "SELECT * FROM accounts WHERE is_active = 1 AND chain_id = ?"
    : "SELECT * FROM accounts WHERE is_active = 1";
  const params = chainId ? [chainId] : [];
  const result = await db.prepare(query).bind(...params).all<AccountRow>();
  return result.results;
}

async function upsertAccount(
  db: D1Database,
  address: string,
  chainId: number,
  owner: string
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO accounts (address, chain_id, owner) VALUES (?, ?, ?)`
    )
    .bind(address.toLowerCase(), chainId, owner.toLowerCase())
    .run();
}

async function updateLastChecked(
  db: D1Database,
  address: string,
  chainId: number
): Promise<void> {
  await db
    .prepare(
      `UPDATE accounts SET last_checked_at = datetime('now') WHERE address = ? AND chain_id = ?`
    )
    .bind(address.toLowerCase(), chainId)
    .run();
}

async function updateGelatoTaskId(
  db: D1Database,
  address: string,
  chainId: number,
  taskId: string
): Promise<void> {
  await db
    .prepare(`UPDATE accounts SET gelato_task_id = ? WHERE address = ? AND chain_id = ?`)
    .bind(taskId, address.toLowerCase(), chainId)
    .run();
}

async function logAction(
  db: D1Database,
  accountAddress: string,
  chainId: number,
  action: string,
  result: string,
  gelatoTaskId?: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO automation_log (account_address, chain_id, action, result, gelato_task_id)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      accountAddress.toLowerCase(),
      chainId,
      action,
      result,
      gelatoTaskId ?? null
    )
    .run();
}

// ─────────────────────────────────────────────────────────────────────────────
// Gelato Network integration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triggers Gelato to execute closePeriod() on a SmartAccount.
 * Gelato's relay service submits the transaction using its own infrastructure,
 * so we never need to hold a private key.
 */
async function triggerGelatoRelay(
  accountAddress: string,
  chainId: number,
  apiKey: string
): Promise<string> {
  // Encode the closePeriod() calldata (no args)
  // Function selector: keccak256("closePeriod()")[0:4] = 0x507a7328
  const callData = "0x507a7328";

  const response = await fetch("https://relay.gelato.digital/relays/v2/sponsored-call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      chainId: chainId.toString(),
      target: accountAddress,
      data: callData,
      gasLimit: "200000",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gelato relay failed (${response.status}): ${error}`);
  }

  const result = await response.json<GelatoTaskResponse>();
  return result.taskId;
}

/**
 * Check Gelato task status.
 */
async function getGelatoTaskStatus(taskId: string): Promise<string> {
  const response = await fetch(
    `https://relay.gelato.digital/tasks/status/${taskId}`
  );
  if (!response.ok) return "unknown";
  const data = await response.json<{ task: { taskState: string } }>();
  return data.task?.taskState ?? "unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync accounts from factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Syncs all accounts from the factory contract into D1.
 * This runs less frequently (e.g., once an hour in a separate cron).
 * For MVP, it runs on every scheduled trigger but only processes the first N accounts.
 */
async function syncAccountsFromFactory(
  client: PublicClient,
  factoryAddress: Address,
  chainId: number,
  db: D1Database
): Promise<number> {
  let allAccounts: readonly Address[];

  try {
    allAccounts = await client.readContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: "getAllAccounts",
    });
  } catch (err) {
    console.error(`Failed to read getAllAccounts from factory ${factoryAddress}:`, err);
    return 0;
  }

  let newCount = 0;
  for (const address of allAccounts) {
    // For new accounts, owner is read from the contract
    // We use the address itself as a placeholder for owner for now
    // (The account detail page fetches the real owner)
    await upsertAccount(db, address, chainId, "0x0");
    newCount++;
  }

  return newCount;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main automation logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * For each active account, check if it's ready to close its period.
 * If yes, trigger Gelato to execute closePeriod().
 */
async function processAccounts(
  accounts: AccountRow[],
  client: PublicClient,
  chainId: number,
  env: Env
): Promise<{ checked: number; triggered: number; errors: number }> {
  const stats = { checked: 0, triggered: 0, errors: 0 };

  // Process in batches of 10 to avoid overwhelming the RPC
  const BATCH_SIZE = 10;
  for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
    const batch = accounts.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (account) => {
        try {
          // Check upkeep (read-only, free)
          const [upkeepNeeded] = await client.readContract({
            address: account.address as Address,
            abi: CHECK_UPKEEP_ABI,
            functionName: "checkUpkeep",
            args: ["0x"],
          });

          await updateLastChecked(env.DB, account.address, chainId);
          stats.checked++;

          if (!upkeepNeeded) return;

          // Period is ready — trigger Gelato
          console.log(`Triggering closePeriod for ${account.address} on chain ${chainId}`);

          const taskId = await triggerGelatoRelay(
            account.address,
            chainId,
            env.GELATO_API_KEY
          );

          await updateGelatoTaskId(env.DB, account.address, chainId, taskId);
          await logAction(
            env.DB,
            account.address,
            chainId,
            "trigger_close_period",
            "success",
            taskId
          );

          stats.triggered++;
          console.log(`Gelato task created: ${taskId} for ${account.address}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Error processing ${account.address}:`, message);

          await logAction(
            env.DB,
            account.address,
            chainId,
            "trigger_close_period",
            `error: ${message}`
          );

          stats.errors++;
        }
      })
    );
  }

  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP handler (for manual triggers and health checks)
// ─────────────────────────────────────────────────────────────────────────────

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Health check
  if (url.pathname === "/health") {
    return Response.json({ status: "ok", timestamp: new Date().toISOString() });
  }

  // Manual trigger (requires authorization)
  if (url.pathname === "/trigger" && request.method === "POST") {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.GELATO_API_KEY}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    await runAutomation(env);
    return Response.json({ status: "triggered" });
  }

  // Stats endpoint
  if (url.pathname === "/stats") {
    await initDB(env.DB);
    const accounts = await env.DB
      .prepare("SELECT COUNT(*) as count FROM accounts WHERE is_active = 1")
      .first<{ count: number }>();
    const recentLogs = await env.DB
      .prepare(
        "SELECT * FROM automation_log ORDER BY created_at DESC LIMIT 20"
      )
      .all();

    return Response.json({
      activeAccounts: accounts?.count ?? 0,
      recentActivity: recentLogs.results,
    });
  }

  return new Response("Not found", { status: 404 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Core automation run
// ─────────────────────────────────────────────────────────────────────────────

async function runAutomation(env: Env): Promise<void> {
  await initDB(env.DB);

  const activeChains = getActiveChains(env);
  if (activeChains.length === 0) {
    console.warn("No chains configured. Set RPC_URL_BASE and FACTORY_ADDRESS_BASE.");
    return;
  }

  for (const chainId of activeChains) {
    const chainConfig = getChainConfig(chainId, env);
    if (!chainConfig) continue;

    const client = createPublicClient({
      chain: chainConfig.chain,
      transport: http(chainConfig.rpcUrl),
    });

    // Sync new accounts from factory
    await syncAccountsFromFactory(
      client,
      chainConfig.factoryAddress,
      chainId,
      env.DB
    );

    // Process active accounts
    const accounts = await getActiveAccounts(env.DB, chainId);
    if (accounts.length === 0) {
      console.log(`No active accounts on chain ${chainId}`);
      continue;
    }

    console.log(`Processing ${accounts.length} accounts on chain ${chainId}`);
    const stats = await processAccounts(accounts, client, chainId, env);

    console.log(
      `Chain ${chainId}: checked=${stats.checked} triggered=${stats.triggered} errors=${stats.errors}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Worker entry points
// ─────────────────────────────────────────────────────────────────────────────

export default {
  // Cron trigger: runs every 15 minutes
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runAutomation(env).catch((err) => {
        console.error("Automation run failed:", err);
      })
    );
  },

  // HTTP trigger: health check, manual trigger, stats
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env).catch((err) => {
      console.error("Request handler error:", err);
      return new Response("Internal Server Error", { status: 500 });
    });
  },
};
