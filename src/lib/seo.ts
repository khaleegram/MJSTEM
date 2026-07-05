import type { Metadata } from 'next';

export const BASE_URL = 'https://www.mjstem.org';
export const JOURNAL_TITLE = 'Maiduguri Journal of STEM (MJSTEM)';
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

export function resolveCitationDoi(doi?: string | null, uniqueId?: string | null): string | undefined {
  const trimmedDoi = typeof doi === 'string' ? doi.trim() : '';
  if (trimmedDoi) return trimmedDoi.replace(/^doi:\s*/i, '');

  const trimmedUniqueId = typeof uniqueId === 'string' ? uniqueId.trim() : '';
  return trimmedUniqueId || undefined;
}

export function buildScholarMetaTags(data: {
  title: string;
  authorNames: string[];
  publicationDate: string;
  manuscriptUrl?: string | null;
  doi?: string | null;
  uniqueId?: string | null;
}) {
  const citationPdfUrl = resolveCitationPdfUrl(data.manuscriptUrl);
  const citationDoi = resolveCitationDoi(data.doi, data.uniqueId);

  return {
    citation_title: data.title,
    citation_author: data.authorNames,
    citation_publication_date: data.publicationDate,
    citation_journal_title: JOURNAL_TITLE,
    citation_issn: JOURNAL_EISSN,
    ...(citationPdfUrl ? { citation_pdf_url: citationPdfUrl } : {}),
    ...(citationDoi ? { citation_doi: citationDoi } : {}),
  };
}

export function buildArticleJsonLd(input: {
  id: string;
  title: string;
  abstract: string;
  authorNames: string[];
  publicationDate: string;
  manuscriptUrl?: string | null;
  doi?: string | null;
  uniqueId?: string | null;
  keywords?: string | null;
}) {
  const articleUrl = `${BASE_URL}/article/${input.id}`;
  const citationDoi = resolveCitationDoi(input.doi, input.uniqueId);
  const pdfUrl = resolveCitationPdfUrl(input.manuscriptUrl);
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
