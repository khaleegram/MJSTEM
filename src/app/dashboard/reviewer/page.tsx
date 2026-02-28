'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useMemo, useState } from 'react';
import { Submission } from '@/types';

function toSubmission(raw: any): Submission {
  const submittedAt = raw?.submittedAt ? new Date(raw.submittedAt) : new Date();
  const safeSubmittedAt = Number.isNaN(submittedAt.getTime()) ? new Date() : submittedAt;

  return {
    ...(raw || {}),
    id: raw?.id || '',
    revision: typeof raw?.revision === 'number' ? raw.revision : 0,
    submittedAt: safeSubmittedAt,
  } as Submission;
}

export default function ReviewerPage() {
  const { user } = useAuth();
  const [assignedSubmissions, setAssignedSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAssignedSubmissions([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadAssignments = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const token = await user.getIdToken(true);
        const response = await fetch('/api/reviewer/assignments', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load reviewer assignments.');
        }

        const incoming = Array.isArray(payload?.assignments) ? payload.assignments : [];
        const next = incoming.map(toSubmission).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

        if (cancelled) return;
        setAssignedSubmissions(next);
      } catch (error: any) {
        console.warn('[Reviewer Dashboard] Could not load assignments via API:', error);
        if (cancelled) return;
        setAssignedSubmissions([]);
        setLoadError(error?.message || 'Could not load reviewer assignments.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAssignments();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email]);

  const visibleAssignments = useMemo(() => assignedSubmissions, [assignedSubmissions]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Reviewer Dashboard</h1>
        <p className="text-muted-foreground">Manage manuscripts assigned to you for review.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Review Assignments</CardTitle>
          <CardDescription>Manuscripts awaiting your expert review.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manuscript Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : visibleAssignments.length > 0 ? (
                visibleAssignments.map((submission) => {
                  const myReviewAssignment = submission.reviewers?.find(
                    (r) => r.id === user?.uid || r.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim()
                  );
                  const status = myReviewAssignment?.status || 'Invited';
                  const hasReviewed = status === 'Review Submitted';
                  const isPendingInvite = status === 'Invited';

                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium max-w-xs truncate">{submission.title}</TableCell>
                      <TableCell>
                        <Badge variant={isPendingInvite ? 'default' : hasReviewed ? 'success' : 'outline'}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/submissions/${submission.id}`} passHref>
                          <Button variant={hasReviewed ? 'secondary' : isPendingInvite ? 'default' : 'outline'} size="sm">
                            {isPendingInvite ? 'Accept Invitation' : hasReviewed ? 'View Submission' : 'Submit Review'}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {loadError ?? 'You have no pending review assignments.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
