import React, { useState } from 'react';
import { FaUsers, FaUserFriends, FaCode, FaCheckCircle } from 'react-icons/fa';
import { ethers } from 'ethers';
import { Wallet } from '@/types/types';

type TimeFrame = 'monthly' | 'quarterly' | 'yearly';
type RedistributionStrategy = 'all-above-threshold' | 'participatory-growth';
type Stakeholder = 'Customers' | 'Collaborators & Employees' | 'Open Source Technologies';

interface WalletSetupFormState {
  stakeholder: Stakeholder | null;
  name: string;
  targetIncome: string;
  timeFrame: TimeFrame;
  withdrawalAddress: string;
  redistributionStrategy: RedistributionStrategy;
}

interface WalletSetupFormProps {
  onClose: () => void;
  onSave: (wallet: Omit<Wallet, 'id' | 'balance'>) => void;
}

const WalletSetupForm: React.FC<WalletSetupFormProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<WalletSetupFormState>({
    stakeholder: null,
    name: '',
    targetIncome: '',
    timeFrame: 'monthly',
    withdrawalAddress: '',
    redistributionStrategy: 'all-above-threshold',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleStakeholderSelect = (stakeholder: Stakeholder) => {
    setFormState(prev => ({ ...prev, stakeholder }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      const targetIncomeNumber = parseFloat(formState.targetIncome);
      if (isNaN(targetIncomeNumber)) {
        alert('Please enter a valid target income.');
        return;
      }

      // Generate random account address here
      const wallet = ethers.Wallet.createRandom();
      const accountAddress = wallet.address;

      onSave({
        ...formState,
        targetIncome: targetIncomeNumber,
        accountAddress,
        stakeholder: formState.stakeholder || '', // Ensure stakeholder is never null
      });

      // Close the form after saving
      onClose();
    }
  };

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
          <label className="label">
            <span className="label-text">Withdrawal Address</span>
          </label>
          <input
            type="text"
            name="withdrawalAddress"
            value={formState.withdrawalAddress}
            onChange={handleChange}
            className="input input-bordered"
            placeholder="Enter your withdrawal address"
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
    <>
      <h2 className="text-2xl font-bold mb-4">Review and Confirm</h2>
      <div className="mb-4">
        <p><strong>Stakeholder:</strong> {formState.stakeholder}</p>
        <p><strong>Name:</strong> {formState.name}</p>
        <p><strong>Target Income:</strong> ${formState.targetIncome}</p>
        <p><strong>Time Frame:</strong> {formState.timeFrame}</p>
        <p><strong>Withdrawal Address:</strong> {formState.withdrawalAddress}</p>
        <p><strong>Redistribution Strategy:</strong> {formState.redistributionStrategy}</p>
      </div>
      <p className="mb-4 text-sm text-gray-400">
        By clicking "Create Wallet", a new Ethereum address will be generated for your account.
      </p>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}
      <div className="flex justify-between">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="btn btn-outline"
          >
            Back
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {step < 3 ? 'Next' : 'Create Wallet'}
        </button>
      </div>
    </form>
  );
};

export default WalletSetupForm;