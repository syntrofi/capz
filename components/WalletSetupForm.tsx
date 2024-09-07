'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type TimeFrame = 'monthly' | 'quarterly' | 'yearly';
type RedistributionStrategy = 'all-above-threshold' | 'participatory-growth';

interface WalletSetupFormState {
  targetIncome: string;
  timeFrame: TimeFrame;
  walletAddress: string;
  redistributionStrategy: RedistributionStrategy;
}

const ClickableCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ selected, onClick, children }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
      selected
        ? 'border-indigo-500 bg-indigo-50'
        : 'border-gray-200 hover:border-indigo-300'
    }`}
  >
    {children}
  </div>
);

export default function WalletSetupForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<WalletSetupFormState>({
    targetIncome: '',
    timeFrame: 'monthly',
    walletAddress: '',
    redistributionStrategy: 'all-above-threshold',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCardSelection = (field: keyof WalletSetupFormState) => (value: string) => {
    setFormState(prevState => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating wallet:', formState);
    router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      <div>
        <label htmlFor="targetIncome" className="block text-sm font-medium text-gray-700">
          Target income
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            name="targetIncome"
            id="targetIncome"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="0.00"
            value={formState.targetIncome}
            onChange={handleInputChange}
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <select
              id="currency"
              name="currency"
              className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
            >
              <option>USD</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
        <div className="grid grid-cols-3 gap-4">
          {(['monthly', 'quarterly', 'yearly'] as const).map((option) => (
            <ClickableCard
              key={option}
              selected={formState.timeFrame === option}
              onClick={() => handleCardSelection('timeFrame')(option)}
            >
              <span className="text-sm font-medium capitalize">{option}</span>
            </ClickableCard>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
          Own recipient wallet address
        </label>
        <input
          type="text"
          name="walletAddress"
          id="walletAddress"
          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          value={formState.walletAddress}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Redistribution strategy</label>
        <div className="grid grid-cols-2 gap-4">
          {([
            { value: 'all-above-threshold', label: 'All above threshold' },
            { value: 'participatory-growth', label: 'Participatory Growth' },
          ] as const).map((option) => (
            <ClickableCard
              key={option.value}
              selected={formState.redistributionStrategy === option.value}
              onClick={() => handleCardSelection('redistributionStrategy')(option.value)}
            >
              <span className="text-sm font-medium">{option.label}</span>
            </ClickableCard>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Smart Account
        </button>
      </div>
    </form>
  );
}