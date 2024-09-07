import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import BurgerMenu from '@/components/BurgerMenu'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Capz Wallet',
  description: 'Smart wallet management app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Capz Wallet</h1>
            <BurgerMenu />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}