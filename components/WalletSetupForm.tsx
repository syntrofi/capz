'use client';

import React, { useState } from 'react';
import { walletStorage } from '@/services/localStorage';

type TimeFrame = 'monthly' | 'quarterly' | 'yearly';
type RedistributionStrategy = 'all-above-threshold' | 'participatory-growth';

interface WalletSetupFormState {
  name: string;
  targetIncome: string;
  timeFrame: TimeFrame;
  address: string;
  redistributionStrategy: RedistributionStrategy;
}

interface WalletSetupFormProps {
  onClose: () => void;
  onSave: (wallet: any) => void;
}

const WalletSetupForm: React.FC<WalletSetupFormProps> = ({ onClose, onSave }) => {
  const [formState, setFormState] = useState<WalletSetupFormState>({
    name: '',
    targetIncome: '',
    timeFrame: 'monthly',
    address: '',
    redistributionStrategy: 'all-above-threshold',
  });
  const [errors, setErrors] = useState<Partial<WalletSetupFormState>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
    validateField(name, value);
  };

  const handleCardSelection = (field: keyof WalletSetupFormState) => (value: string) => {
    setFormState(prevState => ({ ...prevState, [field]: value as any }));
  };

  const validateField = (name: string, value: string) => {
    // ... (validation logic)
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    
    Object.entries(formState).forEach(([key, value]) => validateField(key, value));
    
    if (Object.values(errors).every(error => error === '')) {
      try {
        const newWallet = walletStorage.saveWallet({
          name: formState.name,
          targetIncome: parseFloat(formState.targetIncome),
          timeFrame: formState.timeFrame,
          address: formState.address,
          redistributionStrategy: formState.redistributionStrategy,
        });
        console.log('Wallet created:', newWallet);
        onSave(newWallet);
        onClose();
      } catch (error) {
        setSubmitError('Failed to create wallet. Please try again.');
        console.error('Error creating wallet:', error);
      }
    } else {
      setSubmitError('Please correct the errors in the form.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-gray-100">
      {submitError && (
        <div className="alert alert-error bg-red-600 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{submitError}</span>
        </div>
      )}
      
      <div className="form-control">
        <label className="label">
          <span className="label-text text-gray-300 text-lg">Account Name</span>
        </label>
        <input
          type="text"
          name="name"
          className={`input input-bordered w-full bg-gray-700 text-white ${errors.name ? 'input-error' : ''}`}
          value={formState.name}
          onChange={handleInputChange}
          required
        />
        {errors.name && <span className="text-red-400 text-sm mt-1">{errors.name}</span>}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-gray-300 text-lg">Target Income</span>
        </label>
        <label className="input-group">
          <input
            type="text"
            name="targetIncome"
            className={`input input-bordered w-full bg-gray-700 text-white ${errors.targetIncome ? 'input-error' : ''}`}
            placeholder="0.00"
            value={formState.targetIncome}
            onChange={handleInputChange}
            required
          />
          <span className="bg-gray-600 text-gray-300">USD</span>
        </label>
        {errors.targetIncome && <span className="text-red-400 text-sm mt-1">{errors.targetIncome}</span>}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-gray-300 text-lg">Timeframe</span>
        </label>
        <div className="flex justify-between w-full">
          {(['monthly', 'quarterly', 'yearly'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`btn flex-1 ${formState.timeFrame === option ? 'btn-active bg-gray-600' : 'bg-gray-700'}`}
              onClick={() => handleCardSelection('timeFrame')(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-gray-300 text-lg">Wallet Address</span>
        </label>
        <input
          type="text"
          name="address"
          className={`input input-bordered w-full bg-gray-700 text-white ${errors.address ? 'input-error' : ''}`}
          value={formState.address}
          onChange={handleInputChange}
          required
        />
        {errors.address && <span className="text-red-400 text-sm mt-1">{errors.address}</span>}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-gray-300 text-lg">Redistribution Strategy</span>
        </label>
        <div className="flex justify-between w-full">
          {([
            { value: 'all-above-threshold', label: 'All above threshold' },
            { value: 'participatory-growth', label: 'Participatory Growth' },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              className={`btn flex-1 ${formState.redistributionStrategy === option.value ? 'btn-active bg-gray-600' : 'bg-gray-700'}`}
              onClick={() => handleCardSelection('redistributionStrategy')(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="modal-action mt-8">
        <button type="button" className="btn btn-outline text-gray-300 hover:bg-gray-700" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">Create Account</button>
      </div>
    </form>
  );
};

export default WalletSetupForm;