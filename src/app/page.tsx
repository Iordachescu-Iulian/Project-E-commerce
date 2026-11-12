import Link from 'next/link';

import { Container } from '@/components/ui/Container';

const features = [
  {
    title: 'Digital editions',
    description: 'Instant delivery of game keys for PC and console.',
  },
  {
    title: 'Physical editions',
    description: 'Boxed copies shipped to your door by courier.',
  },
  {
    title: 'One library',
    description: 'Every edition of a game grouped on a single product page.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-white/10 bg-surface/40">
        <Container className="grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
              P2 prototype
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-tight text-ink sm:text-5xl">
              Your next game, digital or on the shelf.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              Hexora brings digital keys and physical editions together in one
              store, with clear stock, fast delivery and a checkout built for
              gamers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-accent/90"
              >
                Browse the catalog
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-white/30 hover:bg-white/5"
              >
                Create an account
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-base p-6 shadow-2xl shadow-black/30">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Store snapshot
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <dt className="text-sm text-muted">Categories</dt>
                <dd className="mt-1 text-3xl font-black text-accent">4</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Games</dt>
                <dd className="mt-1 text-3xl font-black text-accent">16</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Editions</dt>
                <dd className="mt-1 text-3xl font-black text-accent">32</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Delivery</dt>
                <dd className="mt-1 text-3xl font-black text-accent">2</dd>
              </div>
            </dl>
            <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-muted">
              Catalog and search arrive with the catalog branch. Accounts and
              addresses follow on the accounts branch.
            </p>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-14 sm:py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Built around how games are sold</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-white/10 bg-surface p-6"
              >
                <h3 className="text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
