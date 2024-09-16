import React from 'react';
import Link from 'next/link';
import { FaCopy } from 'react-icons/fa';
import CircularGauge from './CircularGauge';
import { Wallet } from '@/types/types';

interface AccountCardProps {
  wallet: Wallet;
}

const AccountCard: React.FC<AccountCardProps> = ({ wallet }) => {
  const { id, name, targetIncome, timeFrame, accountAddress, balance } = wallet;

  // Use balance as currentIncome since income is not available in the Wallet type
  const currentIncome = balance || 0;

  const gaugePercentage = (currentIncome / targetIncome) * 100;
  
  // Calculate distributed as Income - Target
  const distributed = Math.max(0, currentIncome - targetIncome);

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('Invalid amount for formatCurrency:', amount);
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to add a toast or notification here to inform the user
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">{name}</h2>
      <div className="flex mb-6">
        <div className="w-1/2 flex items-center justify-center">
          <CircularGauge percentage={gaugePercentage} size={120} strokeWidth={12} color="yellow" />
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-6">
          <div className="mb-2">
            <p className="text-base text-gray-400">Income:</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(currentIncome)}</p>
          </div>
          <div className="mb-2">
            <p className="text-base text-gray-400">Target:</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(targetIncome)}</p>
          </div>
          <div>
            <p className="text-base text-gray-400">Distributed:</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(distributed)}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <p className="text-sm text-gray-400 mr-2">Address:</p>
          <p className="text-base text-white mr-2">{formatAddress(accountAddress)}</p>
          <button
            onClick={() => copyToClipboard(accountAddress)}
            className="bg-gray-700 text-white p-2 rounded hover:bg-gray-600 transition duration-300"
            aria-label="Copy address"
          >
            <FaCopy size={14} />
          </button>
        </div>
        <Link href={`/wallet/${id}`}>
          <span className="bg-yellow-500 text-gray-900 px-3 py-1 text-sm rounded hover:bg-yellow-400 transition duration-300">
            Details
          </span>
        </Link>
      </div>
    </div>
  );
};

export default AccountCard;