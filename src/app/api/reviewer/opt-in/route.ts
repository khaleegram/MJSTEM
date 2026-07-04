import { NextRequest, NextResponse } from 'next/server';
import admin, { adminDb, firebaseProjectId, logAdminCredentialProbe } from '@/lib/firebase-admin';
import { sanitizeReviewerSubjectAreas } from '@/lib/reviewer-areas';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await logAdminCredentialProbe('reviewer-opt-in-api');

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

    const body = await request.json().catch(() => ({}));
    const subjectAreas = sanitizeReviewerSubjectAreas(body?.subjectAreas);

    if (subjectAreas.length === 0) {
      return NextResponse.json(
        { error: 'At least one subject area is required.' },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const userData = userSnap.data() || {};
    const currentRole = typeof userData.role === 'string' ? userData.role : 'Author';

    const updateData: Record<string, unknown> = {
      reviewerSubjectAreas: subjectAreas,
      isReviewerVolunteer: true,
    };

    if (currentRole === 'Author') {
      updateData.role = 'Reviewer';
    }

    await userRef.update(updateData);

    const newRole = (updateData.role as string | undefined) ?? currentRole;

    return NextResponse.json({
      success: true,
      role: newRole,
      reviewerSubjectAreas: subjectAreas,
      promoted: currentRole === 'Author',
    });
  } catch (error: unknown) {
    const err = error as { code?: number | string; message?: string };

    if (
      err?.code === 7 ||
      err?.code === 'permission-denied' ||
      (typeof err?.message === 'string' && err.message.includes('PERMISSION_DENIED'))
    ) {
      console.error(
        `[Reviewer Opt-In API] Firestore IAM denied: project=${firebaseProjectId || 'unknown'}; serviceAccount=${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'unknown'}`
      );
      return NextResponse.json(
        { error: 'Server lacks Firestore permission to update user profile.' },
        { status: 500 }
      );
    }

    console.error('[Reviewer Opt-In API] Error:', error);
    return NextResponse.json(
      { error: err?.message || 'Failed to register as reviewer.' },
      { status: 500 }
    );
  }
}
