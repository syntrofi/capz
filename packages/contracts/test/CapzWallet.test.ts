import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { parseEther } from "viem";
import hre from "hardhat";

describe("Capz", function () {
  async function deployFixture() {
    // Get signers
    const [deployer, user1, user2] = await hre.ethers.getSigners();

    // Deploy implementation
    const capzWallet = await hre.ethers.deployContract("CapzWallet");
    await capzWallet.waitForDeployment();
    
    // Deploy factory
    const capzFactory = await hre.ethers.deployContract("CapzFactory", [
      await capzWallet.getAddress()
    ]);
    await capzFactory.waitForDeployment();

    return { 
      capzWallet, 
      capzFactory, 
      deployer, 
      user1, 
      user2
    };
  }

  describe("Wallet Creation", function () {
    it("Should create a new wallet", async function () {
      const { capzFactory, deployer } = await loadFixture(deployFixture);

      const tx = await capzFactory.createWallet(
        parseEther("1"), // threshold
        86400n,         // period duration (1 day)
        deployer.address  // withdrawal address
      );

      await tx.wait();
      expect(tx).to.emit(capzFactory, "WalletCreated");
    });
  });

  describe("Fund Management", function () {
    it("Should forward funds below threshold", async function () {
      const { capzFactory, deployer, user1 } = await loadFixture(deployFixture);

      // Create wallet
      const tx = await capzFactory.createWallet(
        parseEther("1"), // 1 ETH threshold
        86400n,         // 1 day period
        deployer.address
      );
      const receipt = await tx.wait();
      
      // Get wallet address from event
      const event = receipt?.logs.find(
        log => capzFactory.interface.parseLog(log)?.name === "WalletCreated"
      );
      const walletAddress = event ? 
        capzFactory.interface.parseLog(event)?.args.wallet : 
        null;
      
      expect(walletAddress).to.not.be.null;

      // Send 0.5 ETH (below threshold)
      const initialBalance = await hre.ethers.provider.getBalance(deployer.address);

      await user1.sendTransaction({
        to: walletAddress,
        value: parseEther("0.5")
      });

      const newBalance = await hre.ethers.provider.getBalance(deployer.address);
      expect(newBalance - initialBalance).to.equal(parseEther("0.5"));
    });
  });
});
