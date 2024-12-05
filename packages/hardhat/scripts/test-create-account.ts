import hre from "hardhat";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with signer:", signer.address);

  // Get both contracts
  const smartAccount = await hre.ethers.getContractAt(
    "SmartAccount",
    "IMPLEMENTATION_ADDRESS" // Add your implementation address here
  );
  console.log("SmartAccount implementation:", await smartAccount.getAddress());

  const factory = await hre.ethers.getContractAt(
    "SmartAccountFactory",
    "FACTORY_ADDRESS" // Add your factory address here
  );
  console.log("Factory address:", await factory.getAddress());
  
  // Verify implementation address in factory
  const implementationAddr = await factory.implementation();
  console.log("Factory's implementation address:", implementationAddr);

  try {
    console.log("Attempting to create account with params:");
    console.log("- Threshold:", hre.ethers.parseEther("1").toString());
    console.log("- Period:", 86400);
    console.log("- Withdrawal Address:", signer.address);

    const tx = await factory.createAccount(
      hre.ethers.parseEther("1"),
      86400,
      signer.address,
      { gasLimit: 1000000 } // Add explicit gas limit
    );
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction mined!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    if (receipt.status === 0) {
      console.error("Transaction failed!");
    } else {
      console.log("Transaction succeeded!");
      // Try to get the created account address
      const accounts = await factory.getAccounts(signer.address);
      console.log("Created accounts:", accounts);
    }
  } catch (error: any) {
    console.error("Detailed error:", error);
    if (error.transaction) {
      console.log("Failed transaction:", error.transaction);
    }
    if (error.receipt) {
      console.log("Failed receipt:", error.receipt);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 