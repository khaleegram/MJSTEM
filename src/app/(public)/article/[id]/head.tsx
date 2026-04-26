import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

type ArticleHeadProps = {
  params: Promise<{ id: string }>;
};

const BASE_URL = 'https://mjstem.org';
const JOURNAL_TITLE = 'Maiduguri Journal of STEM (MJSTEM)';

function toDateString(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString().slice(0, 10).replace(/-/g, '/');
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10).replace(/-/g, '/');
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10).replace(/-/g, '/');
    }
  }
  return new Date().toISOString().slice(0, 10).replace(/-/g, '/');
}

export default async function Head({ params }: ArticleHeadProps) {
  const { id } = await params;
  const articleUrl = `${BASE_URL}/article/${id}`;

  if (!adminDb) {
    return (
      <>
        <title>Article | MJSTEM</title>
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={articleUrl} />
      </>
    );
  }

  const docSnap = await adminDb.collection('submissions').doc(id).get();
  if (!docSnap.exists) {
    return (
      <>
        <title>Article | MJSTEM</title>
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={articleUrl} />
      </>
    );
  }

  const data = docSnap.data();
  if (!data || data.status !== 'Accepted') {
    return (
      <>
        <title>Article | MJSTEM</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={articleUrl} />
      </>
    );
  }

  const authors =
    Array.isArray(data.contributors) && data.contributors.length > 0
      ? data.contributors
          .map((contributor: { name?: string }) => contributor?.name?.trim())
          .filter(Boolean)
      : data.author?.name
        ? [String(data.author.name)]
        : [];

  const publicationDate = toDateString(data.submittedAt);
  const title = String(data.title || 'Article');
  const pdfUrl = String(data.manuscriptUrl || '');

  return (
    <>
      <title>{`${title} | MJSTEM`}</title>
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={articleUrl} />

      <meta name="citation_title" content={title} />
      {authors.map((author) => (
        <meta key={author} name="citation_author" content={author} />
      ))}
      <meta name="citation_publication_date" content={publicationDate} />
      <meta name="citation_pdf_url" content={pdfUrl} />
      <meta name="citation_journal_title" content={JOURNAL_TITLE} />
    </>
  );
}
