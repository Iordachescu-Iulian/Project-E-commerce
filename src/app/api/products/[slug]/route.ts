import { NextResponse, type NextRequest } from 'next/server';

import { getProductBySlug } from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const product = await getProductBySlug(params.slug);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(`Failed to load product ${params.slug}`, error);
    return NextResponse.json(
      { error: 'Failed to load the product' },
      { status: 500 },
    );
  }
}
