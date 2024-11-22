import hre from "hardhat";
import { getAddress } from "viem";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  console.log("Deploying contracts with account:", deployer.account.address);

  // Deploy implementation
  const smartAccount = await hre.viem.deployContract("SmartAccount");
  console.log("SmartAccount implementation deployed to:", smartAccount.address);

  // Deploy factory
  const smartAccountFactory = await hre.viem.deployContract("SmartAccountFactory", [
    getAddress(smartAccount.address)
  ]);
  console.log("SmartAccountFactory deployed to:", smartAccountFactory.address);

  // Create a test account
  const tx = await smartAccountFactory.write.createAccount([
    BigInt(1e18), // 1 ETH threshold
    86400n,      // 1 day period
    deployer.account.address
  ]);
  
  const receipt = await smartAccountFactory.waitForTransactionReceipt({ hash: tx });
  console.log("Test account created, transaction:", receipt.transactionHash);

  console.log("\nDeployed Contracts:");
  console.log("-------------------");
  console.log("Implementation:", smartAccount.address);
  console.log("Factory:", smartAccountFactory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});