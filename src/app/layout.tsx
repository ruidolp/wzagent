import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WIRC - WhatsApp Integration & Response Center',
  description: 'Multi-tenant WhatsApp Business management system',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
