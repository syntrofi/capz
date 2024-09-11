'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Implement proper authentication logic
    // Task: Integrate with backend API for user authentication
    // TODO: Add error handling for failed login attempts
    // Task: Display error messages to the user and handle various error scenarios
    login('Email');
    router.push('/dashboard');
  };

  const handleProviderLogin = (provider: 'Google' | 'Web3 Wallet' | 'Farcaster') => {
    // TODO: Implement actual OAuth flow for Google
    // Task: Set up Google OAuth credentials and integrate with Google Sign-In API
    // TODO: Implement Web3 wallet connection
    // Task: Integrate with Web3 libraries (e.g., ethers.js) for wallet connection
    // TODO: Implement Farcaster authentication
    // Task: Integrate with Farcaster API for authentication
    login(provider);
    router.push('/dashboard');
  };

  return (
    <div className="flex h-screen bg-dark_purple">
      {/* Left column with image */}
      <div className="w-1/2 relative">
        <Image
          src="/path-to-your-desert-image.jpg"
          alt="Desert landscape"
          layout="fill"
          objectFit="cover"
        />
        {/* TODO: Replace placeholder image with actual branded image */}
        {/* Task: Design and add a branded image for the login page */}
      </div>
      
      {/* Right column with form */}
      <div className="w-1/2 p-12 overflow-y-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Sign in</h1>
        <p className="text-gray-400 mb-8">
          Don't have an account? <Link href="/signup" className="text-ultra_violet">Sign up</Link>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full bg-english_violet text-white placeholder-gray-400 px-4 py-3 rounded-lg"
            value={formData.email}
            onChange={handleChange}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              className="w-full bg-english_violet text-white placeholder-gray-400 px-4 py-3 rounded-lg pr-10"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {/* TODO: Add "Forgot Password" link */}
          {/* Task: Implement forgot password functionality and create a new page for password reset */}
          <div className="h-6"></div>
          <button
            type="submit"
            className="w-full bg-ultra_violet text-white py-3 rounded-lg font-medium"
          >
            Sign in
          </button>
        </form>
        
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark_purple text-gray-400">Or sign in with</span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            <button 
              className="flex justify-center items-center py-2 px-4 border border-gray-600 rounded-lg text-gray-400 hover:border-gray-400"
              onClick={() => handleProviderLogin('Google')}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
              </svg>
              Google
            </button>
            <button 
              className="flex justify-center items-center py-2 px-4 border border-gray-600 rounded-lg text-gray-400 hover:border-gray-400"
              onClick={() => handleProviderLogin('Web3 Wallet')}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              Web3 Wallet
            </button>
            <button 
              className="flex justify-center items-center py-2 px-4 border border-gray-600 rounded-lg text-gray-400 hover:border-gray-400"
              onClick={() => handleProviderLogin('Farcaster')}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Farcaster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}