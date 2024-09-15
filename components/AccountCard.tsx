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

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="card bg-gray-800 shadow-xl rounded-xl border border-gray-700">
      <div className="card-body p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-xl font-bold text-white">{wallet.name || 'Account Name'}</h2>
          <span className="text-xs font-medium text-gray-300 bg-gray-700 px-3 py-1 rounded-full">
            {wallet.timeFrame || 'monthly'}
          </span>
        </div>
        
        <div className="flex">
          <div className="w-1/2 flex items-center justify-center">
            <CircularGauge percentage={gaugePercentage} size={120} strokeWidth={8} color={gaugeColor} />
          </div>
          
          <div className="w-1/2 flex flex-col justify-center pl-6">
            <p className="text-base text-gray-200 mb-2">
              Balance: <span className="font-semibold text-white">{formatCurrency(balance)}</span>
            </p>
            <p className="text-base text-gray-200">
              Target: <span className="font-semibold text-white">{formatCurrency(targetIncome)}</span>
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-400 truncate max-w-[150px]">
              {wallet.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-4)}` : 'No address'}
            </p>
            <button 
              onClick={copyToClipboard} 
              className="btn btn-circle btn-xs btn-outline"
              disabled={!wallet.address}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          {wallet.id && (
            <Link href={`/accounts/${wallet.id}`} className="btn btn-sm btn-primary px-6">
              <span className="flex items-center justify-center h-full">Details</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountCard;