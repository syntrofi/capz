import React from 'react'
import Link from 'next/link'

interface AccountCardProps {
  wallet: {
    id: string;
    name: string;
    targetIncome: number;
    timeFrame: string;
    address: string;
    redistributionStrategy: string;
    balance: number;
  }
}

export default function AccountCard({ wallet }: AccountCardProps) {
  const percentageFilled = (wallet.balance / wallet.targetIncome) * 100

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wallet.address)
      .then(() => alert('Address copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err))
  }

  return (
    <div className="bg-english_violet p-6 rounded-lg shadow-md border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-platinum">{wallet.name}</h2>
      <div className="mb-4">
        <div className="flex justify-between mb-1 text-gray-300">
          <span>Balance: ${wallet.balance.toFixed(2)}</span>
          <span>Target: ${wallet.targetIncome.toFixed(2)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-ultra_violet h-2.5 rounded-full"
            style={{ width: `${percentageFilled}%` }}
          ></div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">{wallet.address}</span>
        <button
          onClick={copyToClipboard}
          className="text-ultra_violet hover:text-dogwood_rose"
        >
          Copy
        </button>
      </div>
      <Link
        href={`/accounts/${wallet.id}`}
        className="text-ultra_violet hover:text-dogwood_rose text-sm"
      >
        Details
      </Link>
    </div>
  )
}