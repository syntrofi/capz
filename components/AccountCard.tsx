import React from 'react';
import Link from 'next/link';
import CircularGauge from './CircularGauge';

interface AccountCardProps {
  wallet?: {
    id?: string;
    name?: string;
    targetIncome?: number | null;
    timeFrame?: string;
    address?: string;
    redistributionStrategy?: string;
    balance?: number | null;
  }
}

const AccountCard: React.FC<AccountCardProps> = ({ wallet }) => {
  if (!wallet) {
    console.error('AccountCard received undefined wallet');
    return null;
  }

  const balance = wallet.balance ?? 0;
  const targetIncome = wallet.targetIncome ?? 0;
  const percentageFilled = targetIncome > 0 ? (balance / targetIncome) * 100 : 0;
  const gaugePercentage = Math.min(percentageFilled, 100);
  const gaugeColor = percentageFilled >= 100 ? '#ff0000' : '#00ff00';

  const copyToClipboard = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address)
        .then(() => alert('Address copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  return (
    <div className="card lg:card-side bg-base-100 shadow-xl">
      <figure className="p-6">
        <CircularGauge percentage={gaugePercentage} size={100} strokeWidth={10} color={gaugeColor} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{wallet.name || 'Unnamed Wallet'}</h2>
        <p>Balance: ${balance.toFixed(2)}</p>
        <p>Target: ${targetIncome.toFixed(2)}</p>
        <p className="text-xs truncate">{wallet.address || 'No address provided'}</p>
        <div className="card-actions justify-end">
          <button 
            onClick={copyToClipboard} 
            className="btn btn-ghost btn-xs"
            disabled={!wallet.address}
          >
            Copy Address
          </button>
          {wallet.id && (
            <Link href={`/accounts/${wallet.id}`} className="btn btn-primary btn-xs">
              Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountCard;