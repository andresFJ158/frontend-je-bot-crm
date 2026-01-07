import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { RuntimeConfig } from '@/components/RuntimeConfig'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WhatsApp AI CRM',
  description: 'Professional WhatsApp CRM with AI chatbot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <RuntimeConfig />
        {children}
      </body>
    </html>
  )
}

