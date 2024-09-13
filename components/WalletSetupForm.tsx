import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletStorage } from '@/services/localStorage';

// ... (previous type definitions remain the same)

export default function WalletSetupForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<WalletSetupFormState>({
    name: '',
    targetIncome: '',
    timeFrame: 'monthly',
    address: '',
    redistributionStrategy: 'all-above-threshold',
  });
  const [errors, setErrors] = useState<Partial<WalletSetupFormState>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ... (handleInputChange, handleCardSelection, and validateField functions remain the same)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all fields
    Object.entries(formState).forEach(([key, value]) => validateField(key, value as string));
    
    // Check if there are any errors
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
        router.push('/accounts');
      } catch (error) {
        setSubmitError('Failed to create wallet. Please try again.');
        console.error('Error creating wallet:', error);
      }
    } else {
      setSubmitError('Please correct the errors in the form.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-base-content mb-8 text-center">Set up a new account</h1>
        {submitError && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{submitError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Account Name</span>
            </label>
            <input
              type="text"
              name="name"
              className="input input-bordered w-full"
              value={formState.name}
              onChange={handleInputChange}
              required
            />
            {errors.name && <span className="text-error text-sm mt-1">{errors.name}</span>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Target Income</span>
            </label>
            <label className="input-group">
              <input
                type="text"
                name="targetIncome"
                className="input input-bordered w-full"
                placeholder="0.00"
                value={formState.targetIncome}
                onChange={handleInputChange}
                required
              />
              <span>USD</span>
            </label>
            {errors.targetIncome && <span className="text-error text-sm mt-1">{errors.targetIncome}</span>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Timeframe</span>
            </label>
            <div className="btn-group">
              {(['monthly', 'quarterly', 'yearly'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`btn ${formState.timeFrame === option ? 'btn-active' : ''}`}
                  onClick={() => handleCardSelection('timeFrame')(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Wallet Address</span>
            </label>
            <input
              type="text"
              name="address"
              className="input input-bordered w-full"
              value={formState.address}
              onChange={handleInputChange}
              required
            />
            {errors.address && <span className="text-error text-sm mt-1">{errors.address}</span>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Redistribution Strategy</span>
            </label>
            <div className="btn-group">
              {([
                { value: 'all-above-threshold', label: 'All above threshold' },
                { value: 'participatory-growth', label: 'Participatory Growth' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`btn ${formState.redistributionStrategy === option.value ? 'btn-active' : ''}`}
                  onClick={() => handleCardSelection('redistributionStrategy')(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => router.push('/accounts')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}