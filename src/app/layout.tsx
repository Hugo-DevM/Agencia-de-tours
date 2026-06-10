import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'AgenciaTours — Tu próxima aventura está a un clic',
    template: '%s | AgenciaTours',
  },
  description:
    'Viajes en grupo por México. Elegí tu destino, seleccioná tu asiento y pagá en segundos. Tours en autobús a los mejores destinos de México.',
  keywords: ['viajes en autobús', 'tours México', 'viajes grupales', 'turismo', 'reserva de viajes'],
  authors: [{ name: 'AgenciaTours' }],
  creator: 'AgenciaTours',
  openGraph: {
    type:        'website',
    locale:      'es_MX',
    siteName:    'AgenciaTours',
    title:       'AgenciaTours — Tu próxima aventura está a un clic',
    description: 'Viajes en grupo por México. Elegí tu destino, seleccioná tu asiento y pagá en segundos.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'AgenciaTours',
    description: 'Tours en autobús a los mejores destinos de México.',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
