import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const deployerKey = process.env.DEPLOYER_KEY;
const accounts = deployerKey ? [deployerKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
    // ─── Base ──────────────────────────────────────────────────────────────
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts,
      chainId: 8453,
      verify: {
        etherscan: {
          apiKey: process.env.BASESCAN_API_KEY,
        },
      },
    },
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts,
      chainId: 84532,
      verify: {
        etherscan: {
          apiKey: process.env.BASESCAN_API_KEY,
        },
      },
    },
    // ─── Optimism ──────────────────────────────────────────────────────────
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
      accounts,
      chainId: 10,
      verify: {
        etherscan: {
          apiKey: process.env.OPTIMISM_ETHERSCAN_API_KEY,
        },
      },
    },
    "optimism-sepolia": {
      url: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
      accounts,
      chainId: 11155420,
      verify: {
        etherscan: {
          apiKey: process.env.OPTIMISM_ETHERSCAN_API_KEY,
        },
      },
    },
    // ─── Legacy ────────────────────────────────────────────────────────────
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts,
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",
      optimismSepolia: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "optimismSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
