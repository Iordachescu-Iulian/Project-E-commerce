import { describe, expect, it } from 'vitest';

import { buildCatalogQuery } from './catalog';

describe('buildCatalogQuery', () => {
  it('normalizes page 0 to page 1 and clamps the page size to 24', () => {
    const plan = buildCatalogQuery({ page: 0, pageSize: 99 });

    expect(plan).toMatchObject({
      page: 1,
      pageSize: 24,
      skip: 0,
      take: 24,
    });
    expect(plan.where).toEqual({ isActive: true });
  });

  it('ignores an empty or whitespace-only search term', () => {
    expect(buildCatalogQuery({ q: '' }).where).toEqual({ isActive: true });
    expect(buildCatalogQuery({ q: '   ' }).where).toEqual({ isActive: true });
  });

  it('trims a search term and filters by product name', () => {
    expect(buildCatalogQuery({ q: '  Ashen  ' }).where).toEqual({
      isActive: true,
      name: { contains: 'Ashen' },
    });
  });

  it('adds a category filter from the category slug', () => {
    expect(buildCatalogQuery({ category: 'rpg' }).where).toEqual({
      isActive: true,
      category: { slug: 'rpg' },
    });
  });

  it('adds platform and uppercase format filters', () => {
    expect(
      buildCatalogQuery({ platform: 'PC', format: 'digital' }).where,
    ).toEqual({
      isActive: true,
      platform: 'PC',
      format: 'DIGITAL',
    });
  });

  it('ignores an unknown format and empty filter values', () => {
    expect(
      buildCatalogQuery({ format: 'cartridge', category: '  ' }).where,
    ).toEqual({ isActive: true });
  });

  it('calculates skip and take for later pages', () => {
    const plan = buildCatalogQuery({ page: 3, pageSize: 10 });

    expect(plan).toMatchObject({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it('sorts newest first by default', () => {
    expect(buildCatalogQuery({}).orderBy).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('sorts by price ascending when requested', () => {
    expect(buildCatalogQuery({ sort: 'price-asc' }).orderBy).toEqual([
      { price: 'asc' },
      { name: 'asc' },
    ]);
  });

  it('sorts by price descending when requested', () => {
    expect(buildCatalogQuery({ sort: 'price-desc' }).orderBy).toEqual([
      { price: 'desc' },
      { name: 'asc' },
    ]);
  });

  it('ignores an unknown sort value and keeps the default order', () => {
    expect(buildCatalogQuery({ sort: 'bestsellers' }).orderBy).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });
});
