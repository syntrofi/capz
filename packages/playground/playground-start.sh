#!/bin/bash

echo "🚀 Starting Playground Development Environment..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Kill any existing processes on ports we'll use
if check_port 8545; then
    echo "Port 8545 is in use. Killing existing process..."
    lsof -ti:8545 | xargs kill -9
fi

if check_port 3000; then
    echo "Port 3000 is in use. Killing existing process..."
    lsof -ti:3000 | xargs kill -9
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start the chain in a new terminal window
echo "📦 Starting local chain..."
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/packages/hardhat && pnpm install && pnpm hardhat node --network hardhat"'

# Wait for chain to start with timeout
echo "⏳ Waiting for hardhat node to start..."
timeout=30
count=0
while ! nc -z localhost 8545 && [ $count -lt $timeout ]; do   
    sleep 1
    count=$((count + 1))
    echo -n "."
done

if [ $count -eq $timeout ]; then
    echo "❌ Timeout waiting for hardhat node to start. Please check the chain terminal window for errors."
    exit 1
fi

echo "✅ Hardhat node is running"

# Deploy contracts
echo "🚀 Deploying contracts..."
cd packages/hardhat
pnpm hardhat deploy --network localhost
cd ../..

# Start the frontend in a new terminal window
echo "🌐 Starting frontend..."
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/packages/nextjs && pnpm install && pnpm dev"'

# Start the console in a new terminal window
echo "🖥️  Starting hardhat console..."
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/packages/hardhat && pnpm hardhat console --network localhost"'

echo "
✨ Playground Development Environment Started!
-------------------------------------------
Three terminal windows have been opened:
1. Hardhat Node (local blockchain)
2. Frontend (Next.js)
3. Hardhat Console (for contract interaction)

The frontend will be available at: http://localhost:3000

To interact with your contracts, use the hardhat console window.
Example commands:
- Get deployed contracts: await deployments.all()
- Get factory: await ethers.getContractAt('SmartAccountFactory', '${FACTORY_ADDRESS}')
"