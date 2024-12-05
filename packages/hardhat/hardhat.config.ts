networks: {
  hardhat: {
    chainId: 31337,
    mining: {
      auto: true,
    },
    loggingEnabled: true,
  },
},
gasReporter: {
  enabled: true,
  currency: 'USD',
  outputFile: 'gas-report.txt',
  noColors: true,
}, 