import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { isManuscriptPdf } from '@/lib/manuscript-pdf';

export const dynamic = 'force-dynamic';

/**
 * Stable, first-party full-text URL advertised to Google Scholar via
 * `citation_pdf_url`. Storage keys change and third-party domains are a weak
 * signal for crawlers, so this endpoint is the permanent address:
 * it resolves the current manuscript and only hands back an actual PDF.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!adminDb) {
    return new NextResponse('Not found', { status: 404 });
  }

  const docSnap = await adminDb.collection('submissions').doc(id).get();
  const data = docSnap.exists ? docSnap.data() : undefined;

  if (!data || data.status !== 'Accepted' || !data.manuscriptUrl) {
    return new NextResponse('Not found', { status: 404 });
  }

  const isPdf = await isManuscriptPdf(data.manuscriptUrl);
  if (!isPdf) {
    return new NextResponse(
      'Full text is not available as a PDF for this article yet.',
      { status: 404 }
    );
  }

  return NextResponse.redirect(data.manuscriptUrl, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
