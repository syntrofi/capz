'use client';

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AccountCard from '@/components/AccountCard'
import { useWallets } from '@/hooks/useWallets'

export default function AccountsPage() {
  const router = useRouter()
  const wallets = useWallets()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-platinum">Your Accounts</h1>
        <button
          onClick={() => router.push('/wallet-setup')}
          className="bg-ultra_violet text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors"
        >
          Add New Account
        </button>
      </div>
      {wallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map(wallet => (
            <AccountCard key={wallet.id} wallet={wallet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="mb-4 text-gray-400">You haven't set up any accounts yet.</p>
          <Link
            href="/wallet-setup"
            className="bg-ultra_violet text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Set Up an Account
          </Link>
        </div>
      )}
    </div>
  )
}