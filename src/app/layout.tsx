import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EventMind AI — Autonomous Event Orchestration',
  description: 'Multi-agent event planning, GST ledger auditing, live crisis recovery, and ROEI matchmaking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-[#030712] dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}