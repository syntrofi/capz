"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const getDeploymentAddress = (contractName, network = 'localhost') => {
    const deploymentPath = (0, path_1.join)(__dirname, 'deployments', network, `${contractName}.json`);
    if (!(0, fs_1.existsSync)(deploymentPath)) {
        throw new Error(`No deployment found for ${contractName} on ${network}`);
    }
    return require(deploymentPath).address;
};
exports.default = {
    contracts: require('./artifacts/contracts'),
    deployments: require('./deployments'),
    addresses: {
        SmartAccount: getDeploymentAddress('SmartAccount'),
        SmartAccountFactory: getDeploymentAddress('SmartAccountFactory')
    }
};
//# sourceMappingURL=index.js.map