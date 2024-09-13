import React from 'react';
import Link from 'next/link';

interface AccountCardProps {
  wallet: {
    id: string;
    name: string;
    targetIncome: string | number | null | undefined;
    timeFrame: string;
    address: string;
    redistributionStrategy: string;
    balance: number;
  }
}

const AccountCard: React.FC<AccountCardProps> = ({ wallet }) => {
  const targetIncome = typeof wallet.targetIncome === 'string' 
    ? parseFloat(wallet.targetIncome) 
    : typeof wallet.targetIncome === 'number'
      ? wallet.targetIncome
      : 0;

  const percentageFilled = targetIncome > 0 ? (wallet.balance / targetIncome) * 100 : 0;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wallet.address)
      .then(() => alert('Address copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{wallet.name}</h2>
        <div className="my-4">
          <div className="flex justify-between mb-1 text-sm">
            <span>Balance: ${wallet.balance.toFixed(2)}</span>
            <span>Target: ${targetIncome.toFixed(2)}</span>
          </div>
          <progress 
            className="progress progress-primary w-full" 
            value={percentageFilled} 
            max="100"
          ></progress>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs truncate w-3/4">{wallet.address}</span>
          <button
            onClick={copyToClipboard}
            className="btn btn-ghost btn-xs"
          >
            Copy
          </button>
        </div>
        <div className="card-actions justify-end">
          <Link href={`/accounts/${wallet.id}`} className="btn btn-primary btn-sm">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;