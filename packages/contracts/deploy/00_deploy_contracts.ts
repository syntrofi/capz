import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy SmartAccount implementation and SmartAccountFactory.
 *
 * The factory constructor takes (implementation, owner). On testnets/mainnet
 * the deployer is the factory owner; on localhost it defaults to account[0].
 *
 * Run:
 *   pnpm deploy:local          → localhost
 *   pnpm deploy --network base-sepolia
 *   pnpm deploy --network base
 *   pnpm deploy --network optimism-sepolia
 *   pnpm deploy --network optimism
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const isLive = !["hardhat", "localhost"].includes(network.name);
  const confirmations = isLive ? 3 : 1;

  console.log(`\n🚀 Deploying to ${network.name} as ${deployer}`);
  console.log("─".repeat(50));

  // ── Deploy SmartAccount implementation ─────────────────────────────────────
  // This is the logic contract cloned by the factory (EIP-1167).
  // Constructor disables initializers so it can never be called directly.
  const implementation = await deploy("SmartAccount", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: confirmations,
  });

  // ── Deploy SmartAccountFactory ─────────────────────────────────────────────
  // Factory owner == deployer. Can pause account creation in emergencies.
  const factory = await deploy("SmartAccountFactory", {
    from: deployer,
    args: [implementation.address, deployer],
    log: true,
    waitConfirmations: confirmations,
  });

  // ── Verify ─────────────────────────────────────────────────────────────────
  const factoryContract = await hre.ethers.getContractAt(
    "SmartAccountFactory",
    factory.address
  );
  const storedImpl = await factoryContract.implementation();
  const implMatch = storedImpl.toLowerCase() === implementation.address.toLowerCase();

  console.log("\n✅ Deployment summary:");
  console.log("─".repeat(50));
  console.log(`SmartAccount (impl): ${implementation.address}`);
  console.log(`SmartAccountFactory: ${factory.address}`);
  console.log(`Implementation check: ${implMatch ? "✓ matches" : "✗ MISMATCH"}`);

  // ── Auto-verify on live networks ────────────────────────────────────────────
  if (isLive && process.env.VERIFY_CONTRACTS === "true") {
    console.log("\n🔍 Submitting for verification...");
    try {
      await hre.run("verify:verify", {
        address: implementation.address,
        constructorArguments: [],
      });
      await hre.run("verify:verify", {
        address: factory.address,
        constructorArguments: [implementation.address, deployer],
      });
      console.log("✓ Verification submitted");
    } catch (err) {
      console.warn("⚠ Verification failed (may already be verified):", err);
    }
  }

  // ── Print env snippet ───────────────────────────────────────────────────────
  console.log("\n📋 Copy to your .env:");
  console.log("─".repeat(50));
  const networkUpper = network.name.toUpperCase().replace(/-/g, "_");
  console.log(`NEXT_PUBLIC_${networkUpper}_IMPL_ADDRESS="${implementation.address}"`);
  console.log(`NEXT_PUBLIC_${networkUpper}_FACTORY_ADDRESS="${factory.address}"`);
};

func.tags = ["SmartAccount", "SmartAccountFactory"];
export default func;
