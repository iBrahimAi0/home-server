import type { Metadata } from 'next';
import './globals.css';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: `${BRANDING.name} — ${BRANDING.subtitle}`,
  description: BRANDING.description,
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className="bg-[#0B0D13] text-slate-100 min-h-screen font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200"
      >
        {children}
      </body>
    </html>
  );
}
