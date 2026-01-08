import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/layout/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { fontVariables } from '@/lib/font';
import { cn } from '@/lib/utils';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ClimbZone - Descubre zonas de escalada',
    template: '%s | ClimbZone',
  },
  description: 'Encuentra las mejores zonas de escalada con pronósticos meteorológicos en tiempo real.',
  keywords: ['escalada', 'climbing', 'boulder', 'zonas', 'meteorología', 'theCrag'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9f7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1612' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontVariables
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}




