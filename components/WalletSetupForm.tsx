'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WalletSetupForm() {
  const [walletName, setWalletName] = useState('')
  const [threshold, setThreshold] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual wallet creation logic
    console.log('Creating wallet:', walletName, threshold)
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="walletName" className="block mb-1">Wallet Name</label>
        <input
          type="text"
          id="walletName"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label htmlFor="threshold" className="block mb-1">Distribution Threshold ($)</label>
        <input
          type="number"
          id="threshold"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
      >
        Create Wallet
      </button>
    </form>
  )
}