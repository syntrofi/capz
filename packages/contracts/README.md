# Capz Smart Account Contracts

This package contains the smart contracts for the Capz project:
- SmartAccount: The implementation contract for each user's smart account
- SmartAccountFactory: Factory contract to deploy new smart accounts

## Development

Install dependencies
```
pnpm install
```

Compile contracts
```
pnpm compile
```

Run tests
```
pnpm test
```

Start local node
```
pnpm node
```

Deploy to local network
```
pnpm deploy:local
```

## Contract Architecture

The system uses a factory pattern where:
1. SmartAccount implementation is deployed once
2. Factory creates minimal proxies pointing to the implementation
3. Each user gets their own proxy instance
