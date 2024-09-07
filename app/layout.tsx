import './globals.css' // Import global styles
import type { Metadata } from 'next' // Import Metadata type for SEO
import { Inter } from 'next/font/google' // Import Inter font from Google Fonts
import Navbar from '@/components/Navbar' // Import Navbar component

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'] })

// Define metadata for the app (used for SEO)
export const metadata: Metadata = {
  title: 'Capz Wallet',
  description: 'Smart wallet management app',
}

// Define the root layout component
export default function RootLayout({
  children, // This will contain the content of each page
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar /> {/* Include the Navbar on every page */}
        {children} {/* Render the page-specific content */}
      </body>
    </html>
  )
}