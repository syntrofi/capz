import React, { useState } from 'react';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleStakeholderSelect = (stakeholder: Stakeholder) => {
    setFormState(prev => ({ ...prev, stakeholder }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSave({
        ...formState,
        targetIncome: parseFloat(formState.targetIncome),
      });
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
      <h2 className="text-2xl font-bold mb-4">Account successfully created</h2>
      <FaCheckCircle className="text-6xl text-success mx-auto mb-4" />
      <p className="mb-2">Your smart account has been created under this address</p>
      <p className="font-mono bg-base-300 p-2 rounded">{formState.address || '0x1234...5678'}</p>
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
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {step === 2 ? 'Create Account' : 'Next'}
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