import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia } from 'viem/chains';
import { CAPZ_FACTORY_ABI, CAPZ_WALLET_ABI } from '@capz/contracts/artifacts/abis';

// Contract addresses will be environment variables
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as `0x${string}`;

async function redistributeFunds() {
  try {
    // Create public client
    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: http(process.env.RPC_URL)
    });

    // Create wallet client from private key
    const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(process.env.RPC_URL)
    });

    // Get all wallets for this owner
    const wallets = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: CAPZ_FACTORY_ABI,
      functionName: 'ownerWallets',
      args: [account.address]
    });

    // Process each wallet
    for (const walletAddress of wallets) {
      console.log(`Processing wallet: ${walletAddress}`);
      
      // Check if redistribution is needed
      const shouldRedistribute = await publicClient.readContract({
        address: walletAddress,
        abi: CAPZ_WALLET_ABI,
        functionName: 'shouldRedistribute',
        args: []
      });

      if (shouldRedistribute) {
        console.log(`Redistributing funds for wallet: ${walletAddress}`);
        
        // Execute redistribution
        const hash = await walletClient.writeContract({
          address: walletAddress,
          abi: CAPZ_WALLET_ABI,
          functionName: 'redistribute',
          args: []
        });

        console.log(`Redistribution transaction: ${hash}`);
      }
    }
  } catch (error) {
    console.error('Error during redistribution:', error);
    process.exit(1);
  }
}

redistributeFunds(); 