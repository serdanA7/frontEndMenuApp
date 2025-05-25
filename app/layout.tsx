import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { CartProvider } from './context/CartContext'
import { UserProvider } from "./context/UserContext"

export const metadata: Metadata = {
  title: 'Checkout App',
  description: 'A simple checkout application with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </CartProvider>
      </body>
    </html>
  )
}