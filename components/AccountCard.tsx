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

  const gaugePercentage = Math.min((balance / targetIncome) * 100, 100);
  const gaugeColor = gaugePercentage < 50 ? 'red' : gaugePercentage < 80 ? 'yellow' : 'green';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    // Optionally, you can add a toast notification here
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">{name}</h2>
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
      {/* ... rest of the component stays the same */}
    </div>
  );
};

export default AccountCard;