import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import AuthTokenBridge from '../components/AuthTokenBridge'
import { FamilyProvider } from '../lib/family/FamilyContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'AayuMarg — We care', template: '%s · AayuMarg' },
  description:
    'AayuMarg is a calm digital space for families to book OPD consultations (elderly care, second opinion, mental health, sexual health) and manage care profiles, health vitals and medical records in one place.',
  openGraph: {
    title: 'AayuMarg — We care',
    description: 'Care, connected. Simple enough for everyone.',
    siteName: 'AayuMarg',
    type: 'website',
  },
}

// Responsive viewport: device-width + notch-safe (viewport-fit=cover).
// NOTE: zoom is intentionally NOT disabled (accessibility).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClerkProvider afterSignOutUrl="/">
          <AuthTokenBridge />
          <FamilyProvider>{children}</FamilyProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
