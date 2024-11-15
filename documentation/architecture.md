# System Architecture

## Overview
Capz enables businesses to automatically redistribute income to stakeholders (customers, employees, or open source projects) when receiving payments. The system creates smart contracts that handle the redistribution logic based on predefined thresholds and rules.

## User Types
1. **Business Owner**
   - Creates and manages smart accounts
   - Sets redistribution parameters
   - Receives funds up to threshold

2. **Customers**
   - Send payments to smart account addresses
   - Become stakeholders eligible for redistribution

3. **Stakeholders**
   - Customers who made purchases
   - Employees of the business
   - Open source projects
   - Receive redistributed funds automatically

## System Components

```mermaid
graph TD
    A[Frontend] --> B[Backend]
    B --> C[Database]
    D[Blockchain] --> B

    subgraph Frontend Stack
        A1[Next.js]
        A2[Wagmi/Viem]
        A3[Web3Modal]
        A4[TailwindCSS]
    end

    subgraph Backend Stack
        B1[Fastify]
        B2[TypeScript]
        B3[Supabase Client]
    end

    subgraph Database
        C1[Supabase]
        C2[PostgreSQL]
        C3[Real-time]
        C4[Auth]
    end

    subgraph Blockchain Stack
        D1[Hardhat]
        D2[OpenZeppelin]
        D3[The Graph]
    end
```

## Technology Stack

### Frontend Stack
- **Next.js**: Server-rendered React application
- **Wagmi/Viem**: Web3 interactions
- **Web3Modal**: Wallet connections with email login support
- **TailwindCSS**: Styling
- **The Graph**: Data indexing client

### Backend Stack
- **Fastify**: API server with TypeScript support
- **Supabase**: Database, auth, and real-time updates
- **TypeScript**: Type safety across the stack

### Smart Contract Stack
- **Hardhat**: Development & testing
- **OpenZeppelin**: Contract primitives
- **The Graph**: Indexing and events

## Smart Contract System

```solidity
// Factory creates individual smart accounts
contract CapzFactory {
    function createSmartAccount(
        address owner,
        uint256 threshold,
        uint256 periodDuration,
        uint256 startTime
    ) external returns (address);
}

// Individual smart account for each business
contract CapzAccount {
    struct Config {
        address owner;           // Business owner
        uint256 threshold;       // Amount before redistribution
        uint256 periodDuration; // Daily/Monthly/Quarterly/Yearly
        uint256 startTime;      // Period start
        address[] stakeholders; // Redistribution recipients
        uint256[] shares;       // Stakeholder shares
    }
    
    receive() external payable;
    function redistribute() internal;
    function addStakeholder(address stakeholder, uint256 share) external;
}
```

## Payment & Redistribution Flow

```mermaid
sequenceDiagram
    actor Customer
    participant UI
    participant Backend
    participant SmartContract
    participant BusinessWallet
    participant Stakeholders
    participant Graph
    
    Note over Customer,Graph: Payment Flow
    Customer->>SmartContract: Send Payment (ETH/ERC20)
    SmartContract->>SmartContract: Validate Payment
    SmartContract->>BusinessWallet: Forward up to threshold
    SmartContract->>SmartContract: Calculate excess
    
    Note over Customer,Graph: Redistribution Flow
    SmartContract->>SmartContract: Check if threshold exceeded
    alt Threshold Exceeded
        SmartContract->>SmartContract: Calculate shares
        SmartContract->>Stakeholders: Distribute excess
        SmartContract->>Graph: Emit RedistributionEvent
        Graph->>Backend: Index event
        Backend->>UI: Update dashboard
    else Below Threshold
        SmartContract->>Graph: Emit PaymentEvent
        Graph->>Backend: Index event
        Backend->>UI: Update dashboard
    end
```

## Development Phases

### Phase 1: Core Payment Flow
- Smart account creation
- Basic payment receiving
- Simple redistribution above threshold

### Phase 2: Stakeholder Management
- Stakeholder registration
- Share calculation
- Automated redistribution

### Phase 3: Enhanced Features
- Multiple token support
- Advanced redistribution strategies
- Historical data and analytics

## Security Considerations
- Rate limiting for large transactions
- Threshold change timelock
- Stakeholder addition controls
- Regular security audits

## Future Extensions
- Multiple redistribution strategies
- Cross-chain compatibility
- DAO governance options
