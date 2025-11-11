
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');

  if (path) {
    try {
        revalidatePath(path, 'layout');
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch(e) {
        return NextResponse.json({ revalidated: false, error: (e as Error).message }, { status: 500 });
    }
  }

  return NextResponse.json({
    revalidated: false,
    now: Date.now(),
    message: 'Missing path to revalidate',
  });
}
