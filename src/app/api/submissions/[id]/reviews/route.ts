import { NextRequest, NextResponse } from 'next/server';
import admin, { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const EDITORIAL_ROLES = new Set(['Editor', 'Admin', 'Managing Editor']);

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase().trim() : '';
}

function serializeForJson(value: any): any {
  if (value == null) return value;

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => serializeForJson(item));
    }

    const output: Record<string, any> = {};
    for (const [key, nested] of Object.entries(value)) {
      output[key] = serializeForJson(nested);
    }
    return output;
  }

  return value;
}

function toMillis(value: unknown): number {
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toRound(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(num) || num < 0) return 0;
  return num;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server Firestore is not configured. Set Firebase Admin credentials.' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return NextResponse.json({ error: 'Invalid authorization token.' }, { status: 401 });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const emailNorm = normalizeEmail(decoded.email);
    const resolvedParams = await Promise.resolve(context?.params as { id: string } | undefined);
    const submissionId = resolvedParams?.id;

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required.' }, { status: 400 });
    }

    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const userRef = adminDb.collection('users').doc(uid);
    const [submissionSnap, userSnap] = await Promise.all([submissionRef.get(), userRef.get()]);

    if (!submissionSnap.exists) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    const submissionData = submissionSnap.data() || {};
    const role = userSnap.exists ? userSnap.data()?.role : undefined;
    const isEditorialMember = typeof role === 'string' && EDITORIAL_ROLES.has(role);

    const author = submissionData.author || {};
    const isAuthor =
      (typeof author.id === 'string' && author.id === uid) ||
      (emailNorm !== '' && normalizeEmail(author.email) === emailNorm);

    const reviewerIds = Array.isArray(submissionData.reviewerIds) ? submissionData.reviewerIds : [];
    const invitedReviewerEmails = Array.isArray(submissionData.invitedReviewerEmails)
      ? submissionData.invitedReviewerEmails.map((entry: unknown) => normalizeEmail(entry))
      : [];
    const reviewers = Array.isArray(submissionData.reviewers) ? submissionData.reviewers : [];

    const isAssignedReviewer =
      reviewerIds.includes(uid) ||
      (emailNorm !== '' && invitedReviewerEmails.includes(emailNorm)) ||
      reviewers.some((reviewer: any) => {
        const reviewerId = typeof reviewer?.id === 'string' ? reviewer.id : '';
        const reviewerEmail = normalizeEmail(reviewer?.email);
        return reviewerId === uid || (emailNorm !== '' && reviewerEmail === emailNorm);
      });

    if (!isEditorialMember && !isAuthor && !isAssignedReviewer) {
      return NextResponse.json({ error: 'Not authorized to read reviews for this submission.' }, { status: 403 });
    }

    const scope = request.nextUrl.searchParams.get('scope');
    const roundParam = request.nextUrl.searchParams.get('round');
    const hasRoundFilter = roundParam !== null;
    const requestedRound = hasRoundFilter ? toRound(roundParam) : 0;
    const canReadAll = isEditorialMember || isAuthor;
    const readAll = scope === 'all' && canReadAll;

    const reviewsRef = submissionRef.collection('reviews');
    const reviewsSnap = readAll
      ? await reviewsRef.get()
      : await reviewsRef.where('reviewerId', '==', uid).get();

    let reviews = reviewsSnap.docs
      .map((reviewDoc) => {
        const serialized = { id: reviewDoc.id, ...serializeForJson(reviewDoc.data()) } as Record<string, any>;
        serialized.round = toRound(serialized.round);

        if (isAuthor && !isEditorialMember) {
          // Do not expose editor-only/private review content to authors via API payload.
          delete serialized.commentsForEditor;
          delete serialized.reviewerName;
          serialized.reviewerId = `reviewer-${reviewDoc.id}`;
        }

        return serialized;
      })
      .sort((a, b) => {
        const roundDiff = toRound(b?.round) - toRound(a?.round);
        if (roundDiff !== 0) return roundDiff;
        return toMillis(b?.submittedAt) - toMillis(a?.submittedAt);
      });

    if (hasRoundFilter) {
      reviews = reviews.filter((review) => toRound(review?.round) === requestedRound);
    }

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('[Submission Reviews API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load submission reviews.' },
      { status: 500 }
    );
  }
}
