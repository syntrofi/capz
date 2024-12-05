module.exports = {
  contracts: require('./artifacts/contracts'),
  deployments: require('./deployments'),
  addresses: {
    SmartAccount: require('./deployments/localhost/SmartAccount.json').address,
    SmartAccountFactory: require('./deployments/localhost/SmartAccountFactory.json').address
  }
}; 