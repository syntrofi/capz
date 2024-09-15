'use client';

import React from 'react';
import WalletSetupForm from './WalletSetupForm';

interface WalletSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wallet: any) => void;
}

const WalletSetupModal: React.FC<WalletSetupModalProps> = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box relative w-11/12 max-w-lg bg-gray-800 text-gray-100 p-6">
        <label htmlFor="wallet-setup-modal" className="btn btn-sm btn-circle absolute right-2 top-2 bg-gray-700 text-gray-300" onClick={onClose}>✕</label>
        <h3 className="font-bold text-2xl mb-6">Set up a new account</h3>
        <WalletSetupForm onClose={onClose} onSave={onSave} />
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default WalletSetupModal;