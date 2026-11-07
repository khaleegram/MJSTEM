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

/**
 * Firestore documents can contain SDK class instances (Timestamp, GeoPoint, DocumentReference).
 * React Server Components refuse to serialize class instances when passing props to a
 * 'use client' component: in development it only warns, but in production it throws
 * "Only plain objects, and a few built-ins, can be passed to Client Components" and the
 * page fails with a 500. Normalise everything at the data boundary so any document shape
 * is safe to hand to the client.
 */
function toPlainValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(toPlainValue);
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const plain: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
        plain[key] = toPlainValue(entry);
      }
      return plain;
    }
    // Unknown class instance: degrade to its JSON form instead of crashing the render.
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return undefined;
    }
  }
  return value;
}

function toPlain<T>(value: T): T {
  return toPlainValue(value) as T;
}

export async function getArchiveVolumes(): Promise<Volume[]> {
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('volumes').orderBy('year', 'desc').get();
    const volumes = snap.docs.map((doc) => {
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
    // Volumes/issues may carry Firestore Timestamps; flatten them before they reach the client.
    return toPlain(volumes);
  } catch (error) {
    console.error('getArchiveVolumes failed:', error);
    return [];
  }
}

export async function getArticlesInPress(): Promise<Submission[]> {
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('submissions').where('status', '==', 'Accepted').get();
    const inPress = snap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: toDate(data.submittedAt),
        } as Submission;
      })
      .filter((sub) => !(sub as Submission & { hiddenFromInPress?: boolean }).hiddenFromInPress);
    // Nested docs (reviewers[].lastReviewedAt, documents[].uploadedAt, revisionPackages[].submittedAt)
    // are Firestore Timestamps too; convert them so the RSC payload stays serializable.
    return toPlain(inPress);
  } catch (error) {
    console.error('getArticlesInPress failed:', error);
    return [];
  }
}

export async function getEditorialBoardMembers(): Promise<EditorialBoardMember[]> {
  if (!adminDb) return [];

  try {
    const snap = await adminDb.collection('editorialBoard').orderBy('order').get();
    return toPlain(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as EditorialBoardMember)));
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
