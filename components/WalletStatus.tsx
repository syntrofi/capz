import React from 'react'

interface WalletProps {
  wallet: {
    id: number;
    name: string;
    balance: number;
    threshold: number;
  }
}

export default function WalletStatus({ wallet }: WalletProps) {
  const percentageFilled = (wallet.balance / wallet.threshold) * 100

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{wallet.name}</h2>
      <div className="mb-4">
        <div className="flex justify-between mb-1 text-gray-600">
          <span>Balance: ${wallet.balance}</span>
          <span>Threshold: ${wallet.threshold}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${percentageFilled}%` }}
          ></div>
        </div>
      </div>
      <button className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors">
        Manage Wallet
      </button>
    </div>
  )
}