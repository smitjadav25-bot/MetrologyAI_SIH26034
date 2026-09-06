import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/components/AuthProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'METROLOGYAI — Packaged Commodity Compliance Inspection',
  description: 'AI-powered packaged commodity label inspection against Legal Metrology (Packaged Commodities) Rules, 2011',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
          <p>
            MetrologyAI — Automated Legal Metrology Inspection System. Final legal/enforcement decisions remain with the competent authority.
          </p>
        </footer>
      </body>
    </html>
  );
}
