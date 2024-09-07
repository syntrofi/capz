import WalletStatus from '@/components/WalletStatus'
import Link from 'next/link'

export default function DashboardPage() {
  // TODO: Fetch actual wallet data from an API or database
  const wallets = [
    { id: 1, name: 'Main Wallet', balance: 1500, threshold: 2000 },
    { id: 2, name: 'Savings', balance: 500, threshold: 1000 },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Wallets</h1>
      {wallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map(wallet => (
            <WalletStatus key={wallet.id} wallet={wallet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="mb-4">You haven't set up any wallets yet.</p>
          <Link href="/wallet-setup" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Set Up a Wallet
          </Link>
        </div>
      )}
    </div>
  )
}