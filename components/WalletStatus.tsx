import React from 'react'

// Define the shape of the wallet prop
interface WalletProps {
  wallet: {
    id: number;
    name: string;
    balance: number;
    threshold: number;
  }
}

export default function WalletStatus({ wallet }: WalletProps) {
  // Calculate the percentage of the balance compared to the threshold
  const percentageFilled = (wallet.balance / wallet.threshold) * 100

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{wallet.name}</h2>
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span>Balance: ${wallet.balance}</span>
          <span>Threshold: ${wallet.threshold}</span>
        </div>
        {/* Progress bar to visualize balance vs threshold */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${percentageFilled}%` }}
          ></div>
        </div>
      </div>
      <button className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600">
        Manage Wallet
      </button>
    </div>
  )
}