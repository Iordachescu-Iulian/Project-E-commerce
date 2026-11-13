import type { PrismaClient } from '@prisma/client';

import { categories } from './product-catalog.mjs';

const editions = [
  {
    suffix: 'digital',
    label: 'Digital Edition',
    format: 'DIGITAL',
    copy: 'This digital edition delivers a game key to your Hexora account as soon as payment is confirmed.',
  },
  {
    suffix: 'physical',
    label: 'Physical Edition',
    format: 'PHYSICAL',
    copy: 'This physical edition ships as a boxed copy by courier, with delivery calculated at checkout.',
  },
] as const;

export async function seedProducts(prisma: PrismaClient): Promise<void> {
  for (const category of categories) {
    const categoryRow = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
      },
    });

    for (const game of category.games) {
      for (const edition of editions) {
        const slug = `${game.slug}-${edition.suffix}`;
        const commercial = game[edition.suffix];
        const images = [
          {
            url: `/images/products/${slug}-cover.svg`,
            alt: `${game.title} ${edition.label} cover art`,
            position: 0,
          },
          {
            url: `/images/products/${slug}-banner.svg`,
            alt: `${game.title} ${edition.label} banner art`,
            position: 1,
          },
        ];
        const product = {
          name: `${game.title} — ${edition.label}`,
          gameTitle: game.title,
          gameSlug: game.slug,
          edition: edition.label,
          description: `${game.description} ${edition.copy}`,
          price: commercial.price,
          stock: commercial.stock,
          platform: game.platform,
          format: edition.format,
          isActive: true,
          categoryId: categoryRow.id,
        };

        await prisma.product.upsert({
          where: { slug },
          update: {
            ...product,
            images: { deleteMany: {}, create: images },
          },
          create: {
            slug,
            ...product,
            images: { create: images },
          },
        });
      }
    }
  }
}
