import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Qantara Admin Portal',
  description: 'Control center and database administration for Qantara Algerian Professional Services platform.',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {children}
    </div>
  )
}
