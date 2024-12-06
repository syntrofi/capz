import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.getContractAt(
    "SmartAccountFactory",
    "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
  );

  const [signer] = await ethers.getSigners();
  console.log("Checking accounts for address:", signer.address);

  const accounts = await factory.getAccounts(signer.address);
  console.log("\nYour Smart Accounts:");
  console.log("-------------------");
  for (const account of accounts) {
    const smartAccount = await ethers.getContractAt("SmartAccount", account);
    const threshold = await smartAccount.threshold();
    const period = await smartAccount.redistributionPeriod();
    console.log(`Address: ${account}`);
    console.log(`Threshold: ${ethers.formatEther(threshold)} ETH`);
    console.log(`Period: ${period.toString()} seconds`);
    console.log("-------------------");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 