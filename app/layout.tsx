import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChronoFlow OS',
  description: 'Target Cognitive Architecture & Focus Hub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0D0F12] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
