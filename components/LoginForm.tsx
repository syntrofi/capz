'use client' // This directive is necessary for client-side interactivity

import { useState } from 'react' // Import useState hook for managing component state
import { useRouter } from 'next/navigation' // Import useRouter for programmatic navigation

export default function LoginForm() {
  // Define state variables for email and password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Initialize the router for navigation
  const router = useRouter()

  // Define the form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent the default form submission behavior
    // TODO: Implement actual login logic with Supabase
    console.log('Login attempt with:', email, password)
    router.push('/dashboard') // Navigate to the dashboard after login
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block mb-1">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label htmlFor="password" className="block mb-1">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
      >
        Login
      </button>
    </form>
  )
}