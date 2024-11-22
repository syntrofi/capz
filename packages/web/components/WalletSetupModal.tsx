'use client';

import React from 'react';
import WalletSetupForm from './WalletSetupForm';
import { Wallet } from '@/types/types';

interface WalletSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wallet: Omit<Wallet, 'id' | 'balance'>) => void;
}

const WalletSetupModal: React.FC<WalletSetupModalProps> = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  const handleSave = async (walletData: Omit<Wallet, 'id' | 'balance'>) => {
    console.log('WalletSetupModal: Saving wallet', walletData);
    await onSave(walletData);
    onClose(); // Close the modal after saving
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box relative w-11/12 max-w-lg bg-gray-800 text-gray-100 p-6 max-h-[90vh] overflow-y-auto">
        <label htmlFor="wallet-setup-modal" className="btn btn-sm btn-circle absolute right-2 top-2 bg-gray-700 text-gray-300" onClick={onClose}>✕</label>
        <WalletSetupForm onClose={onClose} onSave={handleSave} />
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default WalletSetupModal;