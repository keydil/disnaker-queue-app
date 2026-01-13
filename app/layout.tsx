import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Disnaker Mesin Antrian',
  description: 'Sistem Antrian & Buku Tamu Digital Disnaker Kota Bandung',
  icons: {
    icon: [
      { url: '/disnaker-ijo.png', media: '(prefers-color-scheme: light)' },
      { url: '/disnaker-ijo.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/disnaker-ijo.png', // Ganti pake logo disnaker juga biar aman
  },
  // 👇 TAMBAHIN INI BRO
  openGraph: {
    title: 'Disnaker Mesin Antrian',
    description: 'Sistem Antrian & Buku Tamu Digital',
    images: [
      {
        url: '/disnaker logo png.svg', // Pastikan gambar ini resolusinya agak gedean dikit
        width: 800,
        height: 600,
        alt: 'Logo Disnaker',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
