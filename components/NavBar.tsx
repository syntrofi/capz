'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const pathname = usePathname()
  const { isLoggedIn, logout } = useAuth()

  return (
    <nav className="bg-english_violet shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-semibold text-white">
          Capz Wallet
        </Link>
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className={`text-sm ${pathname === '/dashboard' ? 'text-dogwood_rose' : 'text-platinum hover:text-white'}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/wallet-setup" 
            className={`text-sm ${pathname === '/wallet-setup' ? 'text-dogwood_rose' : 'text-platinum hover:text-white'}`}
          >
            Add Wallet
          </Link>
          {isLoggedIn ? (
            <button onClick={logout} className="text-platinum hover:text-white">
              Logout
            </button>
          ) : (
            <Link 
              href="/login" 
              className={`text-sm ${pathname === '/login' ? 'text-dogwood_rose' : 'text-platinum hover:text-white'}`}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}