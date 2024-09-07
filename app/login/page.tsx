'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = (provider: 'Farcaster' | 'Google' | 'X') => {
    login(provider)
    console.log(`Logged in with ${provider}`)
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login to Capz</h1>
        <div className="space-y-4">
          <button
            onClick={() => handleLogin('Farcaster')}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
          >
            <Image src="/farcaster-logo.png" alt="Farcaster" width={20} height={20} className="mr-2" />
            Login with Farcaster
          </button>
          <button
            onClick={() => handleLogin('Google')}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
          >
            <Image src="/google-logo.png" alt="Google" width={20} height={20} className="mr-2" />
            Login with Google
          </button>
          <button
            onClick={() => handleLogin('X')}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
          >
            <Image src="/x-logo.png" alt="X" width={20} height={20} className="mr-2" />
            Login with X
          </button>
        </div>
      </div>
    </div>
  )
}