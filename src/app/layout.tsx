import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EventMind AI | Autonomous Event Orchestration',
  description: 'Multi-Agent Enterprise Event Planning & Real-Time Crisis Orchestration Engine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}