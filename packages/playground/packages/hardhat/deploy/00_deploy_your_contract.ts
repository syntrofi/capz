import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-deploy";

const deployContracts = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy implementation
  const smartAccount = await deploy("SmartAccount", {
    from: deployer,
    args: [],
    log: true,
  });

  // Deploy factory
  const factory = await deploy("SmartAccountFactory", {
    from: deployer,
    args: [smartAccount.address],
    log: true,
  });

  console.log("\nDeployed Contracts:");
  console.log("-------------------");
  console.log("SmartAccount:", smartAccount.address);
  console.log("Factory:", factory.address);
} as DeployFunction;

export default deployContracts;
deployContracts.tags = ["SmartAccount", "SmartAccountFactory"];
