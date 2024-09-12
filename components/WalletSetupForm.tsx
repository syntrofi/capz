'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletStorage } from '@/services/localStorage';

// Define types for our form fields
type TimeFrame = 'monthly' | 'quarterly' | 'yearly';
type RedistributionStrategy = 'all-above-threshold' | 'participatory-growth';

// Interface for our form state
interface WalletSetupFormState {
  name: string;
  targetIncome: string;
  timeFrame: TimeFrame;
  address: string;
  redistributionStrategy: RedistributionStrategy;
}

// Reusable component for clickable cards (used for timeFrame and redistributionStrategy)
const ClickableCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ selected, onClick, children }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-4 rounded-lg border transition-all ${
      selected
        ? 'border-dogwood_rose text-dogwood_rose font-bold'
        : 'border-gray-600 text-white hover:border-gray-400'
    }`}
  >
    {children}
  </div>
);

export default function WalletSetupForm() {
  // Use Next.js router for navigation
  const router = useRouter();

  // State for form fields
  const [formState, setFormState] = useState<WalletSetupFormState>({
    name: '',
    targetIncome: '',
    timeFrame: 'monthly',
    address: '',
    redistributionStrategy: 'all-above-threshold',
  });

  // State for validation errors
  const [errors, setErrors] = useState<Partial<WalletSetupFormState>>({});

  // Handle changes in input fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Update form state
    setFormState(prevState => ({ ...prevState, [name]: value }));
    // Validate the changed field
    validateField(name, value);
  };

  // Handle selection of cards (for timeFrame and redistributionStrategy)
  const handleCardSelection = (field: keyof WalletSetupFormState) => (value: string) => {
    setFormState(prevState => ({ ...prevState, [field]: value as any }));
  };

  // Validate individual form fields
  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'name':
        // Ensure name is 1-40 characters and only contains letters, numbers, and spaces
        if (!/^[a-zA-Z0-9 ]{1,40}$/.test(value)) {
          error = 'Name must be 1-40 characters long and contain only letters, numbers, and spaces.';
        }
        break;
      case 'targetIncome':
        // Ensure target income is a valid number (including decimals)
        if (!/^\d*\.?\d*$/.test(value)) {
          error = 'Target income must be a number.';
        }
        break;
      case 'address':
        // Ensure address is a valid Ethereum address
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          error = 'Invalid Ethereum address format.';
        }
        break;
    }
    // Update errors state
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields before submission
    Object.entries(formState).forEach(([key, value]) => validateField(key, value as string));
    
    // Check if there are any errors
    if (Object.values(errors).every(error => error === '')) {
      // If no errors, save the wallet
      const newWallet = walletStorage.saveWallet({
        name: formState.name,
        targetIncome: parseFloat(formState.targetIncome),
        timeFrame: formState.timeFrame,
        address: formState.address,
        redistributionStrategy: formState.redistributionStrategy,
      });
      console.log('Wallet created:', newWallet);
      // Navigate to accounts page after successful creation
      router.push('/accounts');
    } else {
      console.log('Form has errors. Please correct them.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark_purple p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Set up a new account</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-platinum">
              Account Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="bg-english_violet text-white placeholder-gray-400 w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-ultra_violet focus:border-transparent"
              value={formState.name}
              onChange={handleInputChange}
              required
              maxLength={40}
              pattern="[a-zA-Z0-9 ]{1,40}"
            />
            {errors.name && <p className="text-dogwood_rose text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Target Income Field */}
          <div className="space-y-2">
            <label htmlFor="targetIncome" className="block text-sm font-medium text-platinum">
              Target income
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                name="targetIncome"
                id="targetIncome"
                className="bg-english_violet text-white placeholder-gray-400 w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-ultra_violet focus:border-transparent"
                placeholder="0.00"
                value={formState.targetIncome}
                onChange={handleInputChange}
                required
                pattern="^\d*\.?\d*$"
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
            {errors.targetIncome && <p className="text-dogwood_rose text-sm mt-1">{errors.targetIncome}</p>}
          </div>

          {/* Timeframe Selection */}
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

          {/* Wallet Address Field */}
          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium text-platinum">
              Wallet Address
            </label>
            <input
              type="text"
              name="address"
              id="address"
              className="bg-english_violet text-white placeholder-gray-400 w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-ultra_violet focus:border-transparent"
              value={formState.address}
              onChange={handleInputChange}
              required
              pattern="^0x[a-fA-F0-9]{40}$"
            />
            {errors.address && <p className="text-dogwood_rose text-sm mt-1">{errors.address}</p>}
          </div>

          {/* Redistribution Strategy Selection */}
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

          {/* Form Buttons */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => router.push('/accounts')}
              className="px-4 py-3 border border-ultra_violet text-platinum rounded-lg font-medium hover:bg-ultra_violet hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ultra_violet"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-3 bg-ultra_violet text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ultra_violet"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}