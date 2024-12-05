#!/bin/bash

# Compile and deploy contracts
pnpm contracts compile
pnpm contracts deploy:local

# Start playground
pnpm playground dev 