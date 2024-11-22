import { expect } from "chai";
import { ethers } from "hardhat";
import { SmartAccount, SmartAccountFactory } from "../typechain-types";

describe("SmartAccount", function () {
  let smartAccount: SmartAccount;
  let factory: SmartAccountFactory;

  before(async () => {
    const [deployer] = await ethers.getSigners();
    
    // Deploy implementation
    const SmartAccountFactory = await ethers.getContractFactory("SmartAccount");
    smartAccount = await SmartAccountFactory.deploy() as SmartAccount;
    await smartAccount.waitForDeployment();

    // Deploy factory
    const FactoryFactory = await ethers.getContractFactory("SmartAccountFactory");
    factory = await FactoryFactory.deploy(await smartAccount.getAddress()) as SmartAccountFactory;
    await factory.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    expect(await smartAccount.getAddress()).to.be.properAddress;
    expect(await factory.getAddress()).to.be.properAddress;
  });
}); 