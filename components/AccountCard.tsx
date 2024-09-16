import React from 'react';
import Link from 'next/link';
import CircularGauge from './CircularGauge';

interface AccountCardProps {
  wallet: {
    id: string;
    name: string;
    targetIncome: number;
    timeFrame: string;
    address: string;
    redistributionStrategy: string;
    balance: number;
  };
}

const AccountCard: React.FC<AccountCardProps> = ({ wallet }) => {
  const { id, name, targetIncome, timeFrame, address, balance } = wallet;

  const gaugePercentage = (balance / targetIncome) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    // Optionally, you can add a toast notification here
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">{name}</h2>
      <div className="flex mb-6">
        <div className="w-1/2 flex items-center justify-center">
          <CircularGauge percentage={gaugePercentage} size={120} strokeWidth={12} color="yellow" />
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
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-400 truncate max-w-[150px]">
            {shortenAddress(address)}
          </p>
          <button 
            onClick={copyToClipboard} 
            className="btn btn-circle btn-xs btn-outline"
            disabled={!address}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        {id && (
          <Link href={`/accounts/${id}`} className="btn btn-sm btn-primary px-6">
            <span className="flex items-center justify-center h-full">Details</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default AccountCard;