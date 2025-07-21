import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { Toaster } from '@/components/ui/toaster'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "MONEV",
  description: "CeLOE Monitoring System",
  authors: [{ name: "Gagas Surya Laksana", url: "https://gagas.me" }],
  icons: {
    icon: '/icon.ico',
  },
  openGraph: {
    title: "MONEV",
    description: "CeLOE Monitoring System",
    siteName: "MONEV",
    images: [
      {
        url: "/monev-logo.png",
        width: 800,
        height: 600,
        alt: "MONEV Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
