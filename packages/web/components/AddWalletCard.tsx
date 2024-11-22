import Link from 'next/link'

export default function AddWalletCard() {
  return (
    <Link href="/wallet-setup" className="block">
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-full border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
        <div className="text-6xl text-gray-400 hover:text-blue-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    </Link>
  )
}