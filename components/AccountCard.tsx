import React from 'react'
import Link from 'next/link'

interface AccountCardProps {
  account: {
    id: number;
    name: string;
    balance: number;
    threshold: number;
    address: string;
  }
}

export default function AccountCard({ account }: AccountCardProps) {
  const percentageFilled = (account.balance / account.threshold) * 100

  const copyToClipboard = () => {
    navigator.clipboard.writeText(account.address)
      .then(() => alert('Address copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err))
  }

  return (
    <div className="bg-english_violet p-6 rounded-lg shadow-md border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-platinum">{account.name}</h2>
      <div className="mb-4">
        <div className="flex justify-between mb-1 text-gray-300">
          <span>Balance: ${account.balance}</span>
          <span>Threshold: ${account.threshold}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-ultra_violet h-2.5 rounded-full"
            style={{ width: `${percentageFilled}%` }}
          ></div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">{account.address}</span>
        <button
          onClick={copyToClipboard}
          className="text-ultra_violet hover:text-dogwood_rose"
        >
          Copy
        </button>
      </div>
      <Link
        href={`/accounts/${account.id}`}
        className="text-ultra_violet hover:text-dogwood_rose text-sm"
      >
        Details
      </Link>
    </div>
  )
}