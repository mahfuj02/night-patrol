import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { simpleCopy } from '@/content/ui';
import { palette } from '@/lib/palette';
import { getSiteUrl } from '@/lib/site';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: simpleCopy.site.title,
  description: simpleCopy.site.description,
  openGraph: {
    title: simpleCopy.site.title,
    description: simpleCopy.site.description,
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: palette.night, colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
