import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusPanel - Home Server Controller',
  description: 'A dark, professional server hosting management panel to monitor system metrics, control Discord bots, stream live console logs, and manage automated background services on Ubuntu home servers.',
  openGraph: {
    title: 'NexusPanel - Home Server Controller',
    description: 'A dark, professional server hosting management panel to monitor system metrics, control Discord bots, stream live console logs, and manage automated background services on Ubuntu home servers.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexusPanel - Home Server Controller',
    description: 'A dark, professional server hosting management panel to monitor system metrics, control Discord bots, stream live console logs, and manage automated background services on Ubuntu home servers.',
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
        className="bg-[#0A0E17] text-slate-100 min-h-screen font-sans antialiased selection:bg-purple-500/30 selection:text-purple-200"
      >
        {children}
      </body>
    </html>
  );
}

