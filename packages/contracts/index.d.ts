export interface ContractAddresses {
  SmartAccount: string;
  SmartAccountFactory: string;
}

export interface ContractExports {
  contracts: any; // Contract artifacts
  deployments: any; // Deployment info
  addresses: ContractAddresses;
}

declare const contracts: ContractExports;
export default contracts; 