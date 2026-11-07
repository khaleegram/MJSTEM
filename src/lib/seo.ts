import type { Metadata } from 'next';

export const BASE_URL = 'https://www.mjstem.org';
export const JOURNAL_TITLE = 'Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM)';
export const JOURNAL_TITLE_SHORT = 'MJSTEM';
export const JOURNAL_EISSN = '3121-9292';
export const JOURNAL_PRINT_ISSN = '3121-6552';

export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const normalized = url.toLowerCase().split('?')[0];
  return normalized.endsWith('.pdf');
}

export function resolveCitationPdfUrl(manuscriptUrl: string | null | undefined): string | undefined {
  if (!manuscriptUrl || !isPdfUrl(manuscriptUrl)) return undefined;
  return manuscriptUrl;
}

/**
 * First-party, stable full-text URL. Google Scholar should never be pointed at
 * third-party storage (UploadThing, S3) whose keys or access rules can change.
 */
export function resolveCanonicalPdfUrl(articleId: string): string {
  return `${BASE_URL}/article/${articleId}/pdf`;
}

/** Strip common DOI wrappers and return a bare DOI, or undefined when it is not one. */
export function normalizeDoi(doi?: string | null): string | undefined {
  const trimmed = typeof doi === 'string' ? doi.trim() : '';
  if (!trimmed) return undefined;

  const bare = trimmed
    .replace(/^doi:\s*/i, '')
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .trim();

  return /^10\.\d{4,9}\/\S+$/.test(bare) ? bare : undefined;
}

export function resolveCitationDoi(doi?: string | null): string | undefined {
  // Scholar validates DOI shape. An internal manuscript ID is not a DOI, so
  // omit the tag entirely rather than publishing invalid citation metadata.
  return normalizeDoi(doi);
}

export function buildScholarMetaTags(data: {
  title: string;
  authorNames: string[];
  publicationDate: string;
  pdfUrl?: string | null;
  doi?: string | null;
}) {
  const citationDoi = resolveCitationDoi(data.doi);
  const title = data.title.trim();
  const authorNames = data.authorNames.map((name) => name.trim()).filter(Boolean);

  return {
    citation_title: title,
    citation_author: authorNames,
    citation_publication_date: data.publicationDate,
    citation_journal_title: JOURNAL_TITLE,
    citation_issn: JOURNAL_EISSN,
    ...(data.pdfUrl ? { citation_pdf_url: data.pdfUrl } : {}),
    ...(citationDoi ? { citation_doi: citationDoi } : {}),
  };
}

export function buildArticleJsonLd(input: {
  id: string;
  title: string;
  abstract: string;
  authorNames: string[];
  publicationDate: string;
  pdfUrl?: string | null;
  doi?: string | null;
  keywords?: string | null;
}) {
  const articleUrl = `${BASE_URL}/article/${input.id}`;
  const citationDoi = resolveCitationDoi(input.doi);
  const pdfUrl = input.pdfUrl || undefined;
  const keywords = (input.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: input.title,
    name: input.title,
    abstract: input.abstract,
    url: articleUrl,
    mainEntityOfPage: articleUrl,
    datePublished: input.publicationDate.replace(/\//g, '-'),
    author: input.authorNames.map((name) => ({
      '@type': 'Person',
      name,
    })),
    isPartOf: {
      '@type': 'PublicationIssue',
      isPartOf: {
        '@type': 'Periodical',
        name: JOURNAL_TITLE,
        issn: JOURNAL_EISSN,
      },
    },
    ...(keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
    ...(pdfUrl ? { associatedMedia: { '@type': 'MediaObject', contentUrl: pdfUrl } } : {}),
    ...(citationDoi
      ? {
          identifier: {
            '@type': 'PropertyValue',
            propertyID: 'DOI',
            value: citationDoi,
          },
        }
      : {}),
  };
}

export function buildGoogleSiteVerificationMetadata(): Metadata['verification'] | undefined {
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  if (!token) return undefined;
  return { google: token };
}
