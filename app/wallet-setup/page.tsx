import WalletSetupForm from '@/components/WalletSetupForm'

export default function WalletSetupPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Set Up Your Smart Wallet</h1>
      <WalletSetupForm />
    </div>
  )
}