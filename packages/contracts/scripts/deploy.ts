import hre from "hardhat";
import { getAddress } from "viem";

async function main() {
  // Get test accounts
  const [deployer] = await hre.viem.getWalletClients();
  console.log("Deploying contracts with account:", deployer.account.address);

  // Deploy implementation
  const capzWallet = await hre.viem.deployContract("CapzWallet");
  console.log("CapzWallet implementation deployed to:", capzWallet.address);

  // Deploy factory
  const capzFactory = await hre.viem.deployContract("CapzFactory", [
    getAddress(capzWallet.address)
  ]);
  console.log("CapzFactory deployed to:", capzFactory.address);

  // Create a test wallet
  const tx = await capzFactory.write.createWallet([
    BigInt(1e18), // 1 ETH threshold
    86400n,      // 1 day period
    deployer.account.address
  ]);
  
  const receipt = await capzFactory.waitForTransactionReceipt({ hash: tx });
  console.log("Test wallet created, transaction:", receipt.transactionHash);

  // Log all addresses for testing
  console.log("\nDeployed Contracts:");
  console.log("-------------------");
  console.log("Implementation:", capzWallet.address);
  console.log("Factory:", capzFactory.address);
  console.log("\nSave these addresses for testing!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 