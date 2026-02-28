import { NextRequest, NextResponse } from 'next/server';
import admin, { adminDb } from '@/lib/firebase-admin';

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

export async function GET(request: NextRequest) {
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
    const emailNorm = (decoded.email || '').toLowerCase().trim();

    const submissionsRef = adminDb.collection('submissions');
    const [byIdSnap, byEmailSnap] = await Promise.all([
      submissionsRef.where('reviewerIds', 'array-contains', uid).get(),
      emailNorm
        ? submissionsRef.where('invitedReviewerEmails', 'array-contains', emailNorm).get()
        : Promise.resolve(null),
    ]);

    const merged = new Map<string, any>();

    for (const doc of byIdSnap.docs) {
      merged.set(doc.id, { id: doc.id, ...serializeForJson(doc.data()) });
    }

    if (byEmailSnap) {
      for (const doc of byEmailSnap.docs) {
        if (!merged.has(doc.id)) {
          merged.set(doc.id, { id: doc.id, ...serializeForJson(doc.data()) });
        }
      }
    }

    const assignments = Array.from(merged.values()).sort((a, b) => {
      const aTime = Date.parse(a?.submittedAt || '');
      const bTime = Date.parse(b?.submittedAt || '');
      const aMs = Number.isNaN(aTime) ? 0 : aTime;
      const bMs = Number.isNaN(bTime) ? 0 : bTime;
      return bMs - aMs;
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error('[Reviewer Assignments API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load reviewer assignments.' },
      { status: 500 }
    );
  }
}
