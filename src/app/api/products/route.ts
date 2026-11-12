import { NextResponse, type NextRequest } from 'next/server';

import { getCatalog } from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const catalog = await getCatalog({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      platform: searchParams.get('platform') ?? undefined,
      format: searchParams.get('format') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    });

    return NextResponse.json(catalog);
  } catch (error) {
    console.error('Failed to load the product catalog', error);
    return NextResponse.json(
      { error: 'Failed to load the product catalog' },
      { status: 500 },
    );
  }
}
