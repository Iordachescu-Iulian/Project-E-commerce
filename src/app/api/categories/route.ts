import { NextResponse } from 'next/server';

import { getCategories } from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to load categories', error);
    return NextResponse.json(
      { error: 'Failed to load categories' },
      { status: 500 },
    );
  }
}
