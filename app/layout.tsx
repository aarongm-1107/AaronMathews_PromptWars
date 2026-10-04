import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BlindSpot — See what you\'re missing',
  description: 'AI-powered cognitive reasoning auditor. BlindSpot doesn\'t tell you what to choose—it audits how you are choosing.',
  keywords: ['blindspot', 'decision making', 'reasoning audit', 'critical thinking', 'cognitive bias', 'mental models'],
  authors: [{ name: 'BlindSpot AI' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
