import type { Metadata } from 'next';
import { Inter, Cinzel, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'WWM Calculator — Where Winds Meet Damage Calculator',
  description: 'Calculateur de dégâts et DPS professionnel pour Where Winds Meet. Optimisez vos builds, comparez votre équipement, simulez vos rotations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${inter.variable} ${cinzel.variable} ${jetbrainsMono.variable} font-sans scrollbar-wuxia`}
      >
        {children}
      </body>
    </html>
  );
}
