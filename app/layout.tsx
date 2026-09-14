import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { FocusTicker } from '../components/FocusTicker';
import { AppleMusicPlayer } from '../components/AppleMusicPlayer';
import { OpticFlowRest } from '../components/OpticFlowRest';
import { ToastContainer } from '../components/ToastContainer';

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
      <body className="bg-cf-bg text-cf-text antialiased">
        <ThemeProvider>
          <FocusTicker />
          {children}
          <ToastContainer />
          <AppleMusicPlayer />
          <OpticFlowRest />
        </ThemeProvider>
      </body>
    </html>
  );
}
