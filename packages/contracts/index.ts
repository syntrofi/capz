import { existsSync } from 'fs';
import { join } from 'path';

const getDeploymentAddress = (contractName: string, network = 'localhost'): string => {
  const deploymentPath = join(__dirname, 'deployments', network, `${contractName}.json`);
  
  if (!existsSync(deploymentPath)) {
    throw new Error(`No deployment found for ${contractName} on ${network}`);
  }

  return require(deploymentPath).address;
};

export default {
  contracts: require('./artifacts/contracts'),
  deployments: require('./deployments'),
  addresses: {
    SmartAccount: getDeploymentAddress('SmartAccount'),
    SmartAccountFactory: getDeploymentAddress('SmartAccountFactory')
  }
}; 