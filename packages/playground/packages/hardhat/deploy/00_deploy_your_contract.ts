import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy SmartAccount implementation
  const smartAccount = await deploy("SmartAccount", {
    from: deployer,
    args: [],
    log: true,
  });

  // Deploy Factory with implementation address
  await deploy("SmartAccountFactory", {
    from: deployer,
    args: [smartAccount.address],
    log: true,
  });
};

export default deployContracts;
deployContracts.tags = ["SmartAccount", "SmartAccountFactory"];
