import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex space-x-4">
        {/* Use Link components for client-side navigation */}
        <li><Link href="/" className="hover:underline">Home</Link></li>
        <li><Link href="/dashboard" className="hover:underline">Dashboard</Link></li>
        <li><Link href="/wallet" className="hover:underline">Wallet</Link></li>
        <li><Link href="/login" className="hover:underline">Login</Link></li>
      </ul>
    </nav>
  )
}