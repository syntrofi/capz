import { useState, useEffect } from 'react'

interface Account {
  id: number;
  name: string;
  balance: number;
  threshold: number;
  address: string;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    // This is where you'd typically fetch data from an API
    // For now, we'll use placeholder data
    setAccounts([
      { id: 1, name: 'Main Account', balance: 1500, threshold: 2000, address: '0x1234...5678' },
      { id: 2, name: 'Savings', balance: 500, threshold: 1000, address: '0xabcd...efgh' },
    ])
  }, [])

  return accounts
}