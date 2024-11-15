# Goal
We want to create a way to enable businesses and entrepreneurs to incorporate non-extractive and distributive economics into their business models.
For this purpose we will create a web platform that will enable businesses to create accounts that automatically redistribute income to defined stakeholders based on parameters set by the business. 


# Requirements
- Web-based simple platform
- Login with web2 and web3 methods
- Minmal account creation
- No to low cost per account creation for the user 
- Minimal security risks
- Blockchain-based, specifically Ethereum, specifically OP Stak
- Simple, non-exclusive, non web3-elite UI, usable for everyone
- Lowest possible cost to re-distribute money
- Able to accept stable coins and ERC20 tokens



# Features
- Create user account with web2 credentials
- Create user account with web3 credentials
- Sign in to account
- Reset password
- Change password
- Dashboard of all smart accounts
- Create new smart account
  - Automatic creation of smart contract on OP Stack with address to receive funds
- Add stakeholders to smart account
- Set Threshold for redistribition 
- Set redistribution strategy
  - Everthing above threshold is redistributed to stakeholders
  - Logisitcal Growth: Increasing amounts are redistributed the higher the income
- Set income period
  - Daily
  - Monthly
  - Quarterly
  - Yearly
- Set Start date for income period
- View history of smart account
- Automatic forward of incoming from smart account to private account up to threshold
- Automatic redistribution
- Set stakeholders who receive redistribution
  - Customers who bought product
  - Employees
  - Open Source Projects
    - List of open source projects to chose from



# Components
- Web app
 - UI
 - Backend to manage user accounts and off-chain data
- Smart contract factory


# MVP Scope
- Web UI
- login 
- account creation
- Smart account setup form
- Account creation & smart contract deployment
- 1 stakeholder group: Customers
- 1 distro strategy: everything above threshold

# User Flow
1. User signs up / logs in on web app
2. User initiates smart account creation via form
3. User defines stakeholder group to receive redistro
4. User defines smart account parameters
  - Threshold
  - Income period
  - Start date
  - Redistribution strategy 
  - Own wallet to receive funds up to threshold to
5. System creates smart account by deplyoing smart contract to OP stack chain
6. System provides user with EVM address that can be used to receive funds (= smart account address)