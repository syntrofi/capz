import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying contracts with account:", deployer);

  // Deploy implementation
  const smartAccount = await deploy("SmartAccount", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1
  });

  // Deploy factory
  const factory = await deploy("SmartAccountFactory", {
    from: deployer,
    args: [smartAccount.address],
    log: true,
    waitConfirmations: 1
  });

  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log(`SMART_ACCOUNT_ADDRESS="${smartAccount.address}"`);
  console.log(`FACTORY_ADDRESS="${factory.address}"`);

  // Verify contracts are deployed
  const factoryContract = await hre.ethers.getContractAt(
    "SmartAccountFactory",
    factory.address
  );
  const implementationAddress = await factoryContract.implementation();
  console.log("\nVerification:");
  console.log("-------------");
  console.log("Implementation address matches:", implementationAddress === smartAccount.address);
};

func.tags = ["SmartAccount", "SmartAccountFactory"];
export default func; 