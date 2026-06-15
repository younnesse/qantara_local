import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Tajawal } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/auth-context'
import { LanguageProvider } from '@/contexts/language-context'
import { PWAProvider } from '@/contexts/pwa-context'
import { ClientProviders } from '@/components/client-providers'
import { LayoutShell } from '@/components/marketplace/layout-shell'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-tajawal" });

export const metadata: Metadata = {
  title: 'Qantara - Find Trusted Professionals',
  description: 'Qantara is a service directory connecting you with top-rated professionals. Find electricians, plumbers, web developers and more.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} ${tajawal.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <PWAProvider>
              <AuthProvider>
                <ClientProviders>
                  <LayoutShell>
                    {children}
                  </LayoutShell>
                </ClientProviders>
              </AuthProvider>
            </PWAProvider>
          </LanguageProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

