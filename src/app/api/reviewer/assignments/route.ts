import { NextRequest, NextResponse } from 'next/server';
import admin, { adminDb, firebaseProjectId, logAdminCredentialProbe } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase().trim() : '';
}

function toRound(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    await logAdminCredentialProbe('reviewer-assignments-api');

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
    const emailNorm = (decoded.email || '').toLowerCase().trim();

    const submissionsRef = adminDb.collection('submissions');
    const [byIdSnap, byEmailSnap] = await Promise.all([
      submissionsRef.where('reviewerIds', 'array-contains', uid).get(),
      emailNorm
        ? submissionsRef.where('invitedReviewerEmails', 'array-contains', emailNorm).get()
        : Promise.resolve(null),
    ]);

    const merged = new Map<string, any>();

    for (const submissionDoc of byIdSnap.docs) {
      merged.set(submissionDoc.id, submissionDoc);
    }

    if (byEmailSnap) {
      for (const submissionDoc of byEmailSnap.docs) {
        if (!merged.has(submissionDoc.id)) {
          merged.set(submissionDoc.id, submissionDoc);
        }
      }
    }

    const assignments = await Promise.all(
      Array.from(merged.values()).map(async (submissionDoc) => {
        const data = submissionDoc.data() || {};
        const serialized = { id: submissionDoc.id, ...serializeForJson(data) } as Record<string, any>;

        const currentRound = toRound(serialized.revision);
        const reviewers = Array.isArray(data.reviewers) ? data.reviewers : [];
        const reviewerIds = Array.isArray(data.reviewerIds) ? data.reviewerIds : [];

        const myReviewerEntry = reviewers.find((reviewer: any) => {
          const reviewerId = typeof reviewer?.id === 'string' ? reviewer.id : '';
          const reviewerEmail = normalizeEmail(reviewer?.email);
          return reviewerId === uid || (emailNorm !== '' && reviewerEmail === emailNorm);
        });

        const invitedOnly = !reviewerIds.includes(uid) && myReviewerEntry?.status === 'Invited';
        const ownReviewsSnap = await submissionDoc.ref.collection('reviews').where('reviewerId', '==', uid).get();
        const submittedForCurrentRound = ownReviewsSnap.docs.some((reviewDoc) => {
          const reviewRound = toRound(reviewDoc.data()?.round);
          return reviewRound === currentRound;
        });

        serialized.myReviewRound = currentRound;
        serialized.myReviewStatus = invitedOnly
          ? 'Invited'
          : submittedForCurrentRound
          ? 'Review Submitted'
          : 'Pending';

        return serialized;
      })
    );

    assignments.sort((a, b) => {
      const aTime = Date.parse(a?.submittedAt || '');
      const bTime = Date.parse(b?.submittedAt || '');
      const aMs = Number.isNaN(aTime) ? 0 : aTime;
      const bMs = Number.isNaN(bTime) ? 0 : bTime;
      return bMs - aMs;
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    if (
      error?.code === 7 ||
      error?.code === 'permission-denied' ||
      (typeof error?.message === 'string' && error.message.includes('PERMISSION_DENIED'))
    ) {
      console.error(
        `[Reviewer Assignments API] Firestore IAM denied: project=${firebaseProjectId || 'unknown'}; serviceAccount=${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'unknown'}; action=Grant roles/datastore.user`
      );
      console.error('[Reviewer Assignments API] Underlying permission error:', error);
      return NextResponse.json(
        {
          error:
            'Server service account is authenticated but lacks Firestore IAM permission. Grant roles/datastore.user to the service account in this Firebase project.',
        },
        { status: 500 }
      );
    }

    console.error('[Reviewer Assignments API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load reviewer assignments.' },
      { status: 500 }
    );
  }
}
