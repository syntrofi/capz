import Link from 'next/link' // Import Link component for client-side navigation

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to Capz Wallet</h1>
      <nav>
        {/* Use Link components for client-side navigation */}
        <Link href="/login" className="text-blue-500 hover:underline mr-4">
          Login
        </Link>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          Dashboard
        </Link>
      </nav>
    </main>
  )
}