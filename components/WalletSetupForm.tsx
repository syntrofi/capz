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
    className={`cursor-pointer p-4 rounded-lg border transition-all ${
      selected
        ? 'border-dogwood_rose'
        : 'border-gray-600 hover:border-gray-400'
    }`}
  >
    <span className={`text-sm font-medium ${selected ? 'text-dogwood_rose font-bold' : 'text-white'}`}>
      {children}
    </span>
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
    <div className="flex items-center justify-center min-h-screen bg-dark_purple p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-white mb-12 text-center">Set up a Capz account</h1>
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-2">
            <label htmlFor="targetIncome" className="block text-sm font-medium text-platinum">
              Target income
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                name="targetIncome"
                id="targetIncome"
                className="bg-english_violet text-white placeholder-gray-400 w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-ultra_violet focus:border-transparent"
                placeholder="0.00"
                value={formState.targetIncome}
                onChange={handleInputChange}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <select
                  id="currency"
                  name="currency"
                  className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-400 sm:text-sm rounded-md"
                >
                  <option>USD</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-platinum">Timeframe</label>
            <div className="grid grid-cols-3 gap-4">
              {(['monthly', 'quarterly', 'yearly'] as const).map((option) => (
                <ClickableCard
                  key={option}
                  selected={formState.timeFrame === option}
                  onClick={() => handleCardSelection('timeFrame')(option)}
                >
                  {option}
                </ClickableCard>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="walletAddress" className="block text-sm font-medium text-platinum">
              Own recipient wallet address
            </label>
            <input
              type="text"
              name="walletAddress"
              id="walletAddress"
              className="bg-english_violet text-white placeholder-gray-400 w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-ultra_violet focus:border-transparent"
              value={formState.walletAddress}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-platinum">Redistribution strategy</label>
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
                  {option.label}
                </ClickableCard>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-3 border border-ultra_violet text-platinum rounded-lg font-medium hover:bg-ultra_violet hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ultra_violet"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-3 bg-ultra_violet text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ultra_violet"
            >
              Create Smart Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}