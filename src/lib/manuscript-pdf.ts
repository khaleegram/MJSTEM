import { isPdfUrl } from '@/lib/seo';

/**
 * Storage URLs (UploadThing, S3, etc.) usually carry no file extension, so an
 * extension check alone under-reports real PDFs: `/f/<key>` is a PDF while
 * `/f/<key>.docx`-style names are Word files. Google Scholar can only index
 * PDF (or HTML) full text, so verify the actual content type before we publish
 * a `citation_pdf_url`.
 */

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { value: boolean; expiresAt: number }>();

async function probeContentType(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    return contentType.includes('application/pdf');
  } catch {
    // Network hiccup, timeout, or blocked HEAD: treat as "not a PDF" so we
    // never advertise a full-text link we cannot verify.
    return false;
  }
}

export async function isManuscriptPdf(url?: string | null): Promise<boolean> {
  if (!url) return false;

  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const explicitPdf = isPdfUrl(url);
  const value = explicitPdf ? true : await probeContentType(url);

  if (cache.size > 500) cache.clear();
  cache.set(url, { value, expiresAt: Date.now() + CACHE_TTL_MS });

  return value;
}
