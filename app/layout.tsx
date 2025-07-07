import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "CeLOE Logs",
  description: "A logging system for CeLOE",
  authors: [{ name: "Gagas Surya Laksana", url: "https://gagas.me" }],
  icons: {
    icon: '/icon.ico',
  },
  openGraph: {
    title: "CeLOE Logs",
    description: "A logging system for CeLOE",
    siteName: "CeLOE Logs",
    images: [
      {
        url: "/celoe-logo.png",
        width: 800,
        height: 600,
        alt: "CeLOE Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

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
