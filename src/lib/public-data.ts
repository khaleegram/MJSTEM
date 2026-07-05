import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Volume, Article, Submission, EditorialBoardMember } from '@/types';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export async function getArchiveVolumes(): Promise<Volume[]> {
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('volumes').orderBy('year', 'desc').get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...(data as Omit<Volume, 'id'>),
        issues:
          data.issues?.map((issue: { id: string; title: string; articles?: Article[] }) => ({
            ...issue,
            articles:
              issue.articles?.map((article: Article) => ({
                id: article.id,
                title: article.title,
                contributors: article.contributors || [{ name: article.authorName, email: '', institution: '', role: 'Author', isPrimaryContact: false }],
                manuscriptUrl: article.manuscriptUrl || '',
                authorName: article.authorName,
                pageCount: article.pageCount || null,
                uniqueId: article.uniqueId,
                doi: article.doi,
              })) || [],
          })) || [],
      } as Volume;
    });
  } catch (error) {
    console.error('getArchiveVolumes failed:', error);
    return [];
  }
}

export async function getArticlesInPress(): Promise<Submission[]> {
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('submissions').where('status', '==', 'Accepted').get();
    return snap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: toDate(data.submittedAt),
        } as Submission;
      })
      .filter((sub) => !(sub as Submission & { hiddenFromInPress?: boolean }).hiddenFromInPress);
  } catch (error) {
    console.error('getArticlesInPress failed:', error);
    return [];
  }
}

export async function getEditorialBoardMembers(): Promise<EditorialBoardMember[]> {
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('editorialBoard').orderBy('order').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as EditorialBoardMember));
  } catch (error) {
    console.error('getEditorialBoardMembers failed:', error);
    return [];
  }
}

export async function getSubmissionTemplateUrl(): Promise<string | null> {
  if (!adminDb) return null;

  try {
    const snap = await adminDb.collection('settings').doc('journalInfo').get();
    if (!snap.exists) return null;
    const url = snap.data()?.submissionTemplateUrl;
    return typeof url === 'string' && url ? url : null;
  } catch (error) {
    console.error('getSubmissionTemplateUrl failed:', error);
    return null;
  }
}

export function filterUnassignedInPress(volumes: Volume[], inPressArticles: Submission[]): Submission[] {
  const assignedArticleIds = new Set(
    volumes.flatMap((v) => v.issues?.flatMap((i) => i.articles?.map((a) => a.id) || []) || [])
  );
  return inPressArticles.filter((article) => !assignedArticleIds.has(article.id));
}
