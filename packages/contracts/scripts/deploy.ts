import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy implementation
  const SmartAccount = await ethers.getContractFactory("SmartAccount");
  const smartAccount = await SmartAccount.deploy();
  await smartAccount.waitForDeployment();
  console.log("SmartAccount implementation deployed to:", await smartAccount.getAddress());

  // Deploy factory
  const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
  const factory = await SmartAccountFactory.deploy(await smartAccount.getAddress());
  await factory.waitForDeployment();
  console.log("SmartAccountFactory deployed to:", await factory.getAddress());

  // Export addresses for the playground
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log(`SMART_ACCOUNT_ADDRESS="${await smartAccount.getAddress()}"`);
  console.log(`FACTORY_ADDRESS="${await factory.getAddress()}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 