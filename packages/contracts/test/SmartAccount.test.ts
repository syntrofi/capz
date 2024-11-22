import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { parseEther } from "viem";
import hre from "hardhat";

describe("SmartAccount", function () {
  async function deployFixture() {
    const [deployer, user1, user2] = await hre.ethers.getSigners();

    // Deploy implementation
    const smartAccount = await hre.ethers.deployContract("SmartAccount");
    await smartAccount.waitForDeployment();
    
    // Deploy factory
    const smartAccountFactory = await hre.ethers.deployContract("SmartAccountFactory", [
      await smartAccount.getAddress()
    ]);
    await smartAccountFactory.waitForDeployment();

    return { 
      smartAccount, 
      smartAccountFactory, 
      deployer, 
      user1, 
      user2
    };
  }

  describe("Account Creation", function () {
    it("Should create a new account", async function () {
      const { smartAccountFactory, deployer } = await loadFixture(deployFixture);

      const tx = await smartAccountFactory.createAccount(
        parseEther("1"), // threshold
        86400n,         // period duration (1 day)
        deployer.address  // withdrawal address
      );

      await tx.wait();
      expect(tx).to.emit(smartAccountFactory, "AccountCreated");
    });
  });

  describe("Fund Management", function () {
    it("Should forward funds below threshold", async function () {
      const { smartAccountFactory, deployer, user1 } = await loadFixture(deployFixture);

      const tx = await smartAccountFactory.createAccount(
        parseEther("1"), // 1 ETH threshold
        86400n,         // 1 day period
        deployer.address
      );
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(
        log => smartAccountFactory.interface.parseLog(log)?.name === "AccountCreated"
      );
      const accountAddress = event ? 
        smartAccountFactory.interface.parseLog(event)?.args.account : 
        null;
      
      expect(accountAddress).to.not.be.null;

      const initialBalance = await hre.ethers.provider.getBalance(deployer.address);

      await user1.sendTransaction({
        to: accountAddress,
        value: parseEther("0.5")
      });

      const newBalance = await hre.ethers.provider.getBalance(deployer.address);
      expect(newBalance - initialBalance).to.equal(parseEther("0.5"));
    });
  });
}); 