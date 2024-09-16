import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserFriends, FaCode, FaCheckCircle } from 'react-icons/fa';

type TimeFrame = 'monthly' | 'quarterly' | 'yearly';
type RedistributionStrategy = 'all-above-threshold' | 'participatory-growth';
type Stakeholder = 'Customers' | 'Collaborators & Employees' | 'Open Source Technologies';

interface WalletSetupFormState {
  stakeholder: Stakeholder | null;
  name: string;
  targetIncome: string;
  timeFrame: TimeFrame;
  address: string;
  redistributionStrategy: RedistributionStrategy;
}

interface WalletSetupFormProps {
  onClose: () => void;
  onSave: (wallet: Omit<WalletSetupFormState, 'targetIncome'> & { targetIncome: number }) => void;
}

const WalletSetupForm: React.FC<WalletSetupFormProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<WalletSetupFormState>({
    stakeholder: null,
    name: '',
    targetIncome: '',
    timeFrame: 'monthly',
    address: '',
    redistributionStrategy: 'all-above-threshold',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('Current step:', step);
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleStakeholderSelect = (stakeholder: Stakeholder) => {
    setFormState(prev => ({ ...prev, stakeholder }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted, current step:', step);
    if (step < 2) {
      console.log('Moving to next step');
      setStep(step + 1);
    } else if (step === 2) {
      console.log('Submitting form with state:', formState);
      setIsSubmitting(true);
      try {
        await onSave({
          ...formState,
          targetIncome: parseFloat(formState.targetIncome),
        });
        console.log('Wallet saved successfully');
        setStep(3); // Move to success screen
      } catch (error) {
        console.error('Error saving wallet:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Add this function if not already present
  function generateRandomEthAddress(): string {
    return `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  const renderStepOne = () => (
    <>
      <h2 className="text-2xl font-bold mb-2">Choose stakeholders</h2>
      <p className="text-gray-400 mb-6">Pick the stakeholders that should participate in the redistribution</p>
      <div className="space-y-4">
        {['Customers', 'Collaborators & Employees', 'Open Source Technologies'].map((stakeholder) => (
          <div
            key={stakeholder}
            className={`card bg-base-200 shadow-xl cursor-pointer ${formState.stakeholder === stakeholder ? 'border-2 border-primary' : ''}`}
            onClick={() => handleStakeholderSelect(stakeholder as Stakeholder)}
          >
            <div className="card-body flex flex-row items-center">
              {stakeholder === 'Customers' && <FaUsers className="text-2xl mr-4" />}
              {stakeholder === 'Collaborators & Employees' && <FaUserFriends className="text-2xl mr-4" />}
              {stakeholder === 'Open Source Technologies' && <FaCode className="text-2xl mr-4" />}
              <span>{stakeholder}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderStepTwo = () => (
    <>
      <h2 className="text-2xl font-bold mb-6">Set up account</h2>
      <div className="space-y-4">
        <div className="form-control">
          <label className="label" htmlFor="name">
            <span className="label-text">Account Name</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formState.name}
            onChange={handleChange}
            className="input input-bordered"
            required
            autoComplete="off"
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="targetIncome">
            <span className="label-text">Target Income</span>
          </label>
          <input
            type="number"
            id="targetIncome"
            name="targetIncome"
            value={formState.targetIncome}
            onChange={handleChange}
            className="input input-bordered"
            required
            autoComplete="off"
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="timeFrame">
            <span className="label-text">Time Frame</span>
          </label>
          <select
            id="timeFrame"
            name="timeFrame"
            value={formState.timeFrame}
            onChange={handleChange}
            className="select select-bordered"
            required
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="address">
            <span className="label-text">Ethereum Address</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formState.address}
            onChange={handleChange}
            className="input input-bordered"
            required
            autoComplete="off"
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="redistributionStrategy">
            <span className="label-text">Redistribution Strategy</span>
          </label>
          <select
            id="redistributionStrategy"
            name="redistributionStrategy"
            value={formState.redistributionStrategy}
            onChange={handleChange}
            className="select select-bordered"
            required
          >
            <option value="all-above-threshold">All Above Threshold</option>
            <option value="participatory-growth">Participatory Growth</option>
          </select>
        </div>
      </div>
    </>
  );

  const renderStepThree = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Account Created Successfully!</h2>
      <p className="mb-4">Your new wallet has been set up.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}
      
      <div className="flex justify-between mt-6">
        {step < 3 && (
          <>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {step === 2 ? (isSubmitting ? 'Creating...' : 'Create Account') : 'Next'}
            </button>
          </>
        )}
        {step === 3 && (
          <button type="button" onClick={onClose} className="btn btn-primary w-full">
            Close
          </button>
        )}
      </div>
    </form>
  );
};

export default WalletSetupForm;