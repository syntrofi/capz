import { ethers } from "hardhat";

async function main() {
  // Get the deployed contracts
  const factory = await ethers.getContract("SmartAccountFactory");
  console.log("Factory deployed at:", factory.address);

  // Create a new account
  const tx = await factory.createAccount(
    ethers.utils.parseEther("1"), // 1 ETH threshold
    86400, // 1 day period
    (await ethers.getSigners())[0].address // Use deployer as withdrawal address
  );

  console.log("Creating account...");
  const receipt = await tx.wait();
  
  // Get the created account address from events
  const event = receipt.events?.find(e => e.event === "AccountCreated");
  const accountAddress = event?.args?.account;
  
  console.log("New account created at:", accountAddress);
  
  // Get all accounts for the deployer
  const accounts = await factory.getAccounts((await ethers.getSigners())[0].address);
  console.log("All accounts:", accounts);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 