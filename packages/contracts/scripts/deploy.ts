import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy implementation
  const SmartAccount = await ethers.getContractFactory("SmartAccount");
  const smartAccount = await SmartAccount.deploy();
  const smartAccountAddress = await smartAccount.getAddress();
  console.log("SmartAccount implementation deployed to:", smartAccountAddress);

  // Deploy factory
  const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
  const factory = await SmartAccountFactory.deploy(smartAccountAddress);
  const factoryAddress = await factory.getAddress();
  console.log("SmartAccountFactory deployed to:", factoryAddress);

  // Export addresses for the playground
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log(`SMART_ACCOUNT_ADDRESS="${smartAccountAddress}"`);
  console.log(`FACTORY_ADDRESS="${factoryAddress}"`);

  // Verify contracts are deployed
  const factoryContract = await ethers.getContractAt("SmartAccountFactory", factoryAddress);
  const implementationAddress = await factoryContract.implementation();
  console.log("\nVerification:");
  console.log("-------------");
  console.log("Implementation address matches:", implementationAddress === smartAccountAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 