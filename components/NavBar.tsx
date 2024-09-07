'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false) // This should be replaced with actual auth state

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-semibold text-gray-800">
          Capz Wallet
        </Link>
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className={`text-sm ${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/wallet-setup" 
            className={`text-sm ${pathname === '/wallet-setup' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Add Wallet
          </Link>
          {isLoggedIn ? (
            <button className="text-gray-600 hover:text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          ) : (
            <Link 
              href="/login" 
              className={`text-sm ${pathname === '/login' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
