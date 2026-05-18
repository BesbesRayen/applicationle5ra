import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import ConditionalLayout from '@/components/ConditionalLayout';

export const metadata: Metadata = {
  title: 'CreditTN – Paiement Échelonné en Tunisie',
  description:
    'CreditTN est la première plateforme tunisienne de paiement échelonné. Achetez maintenant, payez plus tard dans vos boutiques préférées en toute sécurité.',
  keywords: [
    'CreditTN',
    'paiement échelonné',
    'Tunisie',
    'fintech',
    'achetez maintenant payez plus tard',
    'BNPL',
    'crédit',
  ],
  openGraph: {
    title: 'CreditTN – Paiement Échelonné en Tunisie',
    description:
      'Achetez maintenant, payez plus tard avec CreditTN. Découvrez nos boutiques partenaires.',
    type: 'website',
    locale: 'fr_TN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
