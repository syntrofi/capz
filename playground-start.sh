#!/bin/bash

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

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux is not installed. Please install it first:"
    echo "  brew install tmux  # for macOS"
    echo "  apt-get install tmux  # for Ubuntu/Debian"
    exit 1
fi

# Kill existing tmux session if it exists
tmux kill-session -t playground 2>/dev/null

# Create a new tmux session
tmux new-session -d -s playground

# First window: Start the chain
tmux rename-window -t playground:0 'chain'
tmux send-keys -t playground:0 'cd packages/playground/packages/hardhat && pnpm chain' C-m

# Wait for chain to start
echo "Waiting for hardhat node to start..."
while ! nc -z localhost 8545; do   
  sleep 1
done
echo "Hardhat node is running"

# Deploy contracts
echo "Deploying contracts..."
cd packages/playground/packages/hardhat
pnpm hardhat deploy --network localhost

# Second window: Start the frontend
tmux new-window -t playground:1 -n 'frontend'
tmux send-keys -t playground:1 'cd packages/playground/packages/nextjs && pnpm dev' C-m

# Third window: Start the console
tmux new-window -t playground:2 -n 'console'
tmux send-keys -t playground:2 'cd packages/playground/packages/hardhat && pnpm hardhat console --network localhost' C-m

# Select the chain window
tmux select-window -t playground:0

# Show tmux key bindings help
echo "
Playground Development Environment Started!
----------------------------------------
The environment is running in tmux. Here are some useful commands:

  • Switch windows:     Ctrl-b + window number (0, 1, or 2)
  • Navigate windows:   Ctrl-b + n (next) or p (previous)
  • List windows:       Ctrl-b + w
  • Detach session:    Ctrl-b + d
  • Scroll mode:       Ctrl-b + [ (use arrow keys, q to exit)
  • Kill session:      Ctrl-b + : then type 'kill-session'

Windows:
  0: Chain (Hardhat Node)
  1: Frontend (Next.js)
  2: Console (Hardhat Console)

To reattach to this session later, run: tmux attach -t playground
"

# Attach to the session
tmux attach-session -t playground 