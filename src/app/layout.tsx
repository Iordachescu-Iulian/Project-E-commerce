import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { getSessionUser } from '@/lib/auth';

import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Hexora — Video games for PC and console',
    template: '%s | Hexora',
  },
  description:
    'Hexora is an online video game store selling digital and physical editions for PC and console.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-base font-sans text-ink antialiased">
        <div className="flex min-h-screen flex-col">
          <Header user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
