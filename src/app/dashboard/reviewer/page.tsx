
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
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Submission } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export default function ReviewerPage() {
    const { user } = useAuth();
    const [assignedById, setAssignedById] = useState<Submission[]>([]);
    const [invitedByEmail, setInvitedByEmail] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        
        const q = query(
            collection(db, 'submissions'),
            where('reviewerIds', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const subs: Submission[] = querySnapshot.docs.map(doc => {
                 const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    submittedAt: data.submittedAt.toDate(),
                } as Submission;
            });
            setAssignedById(subs);
            setLoading(false);
        }, (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'submissions',
                operation: 'list',
                requestResourceData: { where: `reviewerIds contains ${user.uid}` }
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, toast]);

    useEffect(() => {
         if (!user?.email) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const q = query(
            collection(db, 'submissions'),
            where('invitedReviewerEmails', 'array-contains', user.email)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const subs: Submission[] = querySnapshot.docs.map(doc => {
                 const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    submittedAt: data.submittedAt.toDate(),
                } as Submission;
            });
            setInvitedByEmail(subs);
            setLoading(false);
        }, (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'submissions',
                operation: 'list',
                requestResourceData: { where: `invitedReviewerEmails contains ${user.email}` }
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);
    
    const assignedSubmissions = useMemo(() => {
        const combined = new Map<string, Submission>();
        [...assignedById, ...invitedByEmail].forEach(sub => {
            combined.set(sub.id, sub);
        });
        return Array.from(combined.values()).sort((a,b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    }, [assignedById, invitedByEmail]);


  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold font-headline">Reviewer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage manuscripts assigned to you for review.
          </p>
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
                        ) : assignedSubmissions.length > 0 ? (
                            assignedSubmissions.map((submission) => {
                                const myReviewAssignment = submission.reviewers?.find(r => r.id === user?.uid || r.email === user?.email);
                                const status = myReviewAssignment?.status || 'Invited';
                                const hasReviewed = status === 'Review Submitted';
                                const isPendingInvite = status === 'Invited';

                                return (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium max-w-xs truncate">{submission.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={isPendingInvite ? 'default' : hasReviewed ? 'success' : 'outline'}>{status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/submissions/${submission.id}`} passHref>
                                         <Button variant={hasReviewed ? "secondary" : isPendingInvite ? 'default' : "outline"} size="sm">
                                            {isPendingInvite ? 'Accept Invitation' : hasReviewed ? 'View Submission' : 'Submit Review'}
                                         </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                You have no pending review assignments.
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
