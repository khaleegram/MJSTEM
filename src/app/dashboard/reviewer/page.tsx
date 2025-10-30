
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
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Submission } from '@/types';


export default function ReviewerPage() {
    const { user } = useAuth();
    const [assignedSubmissions, setAssignedSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchReviewAssignments = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Query for submissions where the current user's ID is in the `reviewerIds` array.
                const q = query(
                    collection(db, 'submissions'),
                    where('reviewerIds', 'array-contains', user.uid)
                );
                
                const querySnapshot = await getDocs(q);
                
                const myAssignments: Submission[] = querySnapshot.docs.map(doc => {
                     const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title || 'Untitled',
                        author: data.author || { name: 'Unknown Author' },
                        status: data.status || 'Submitted',
                        submittedAt: data.submittedAt ? data.submittedAt.toDate() : new Date(),
                        abstract: data.abstract || '',
                        keywords: data.keywords || '',
                        manuscriptUrl: data.manuscriptUrl || '',
                        reviewers: data.reviewers || [],
                    } as Submission;
                });

                setAssignedSubmissions(myAssignments);

            } catch (error) {
                console.error(error);
                toast({
                    title: "Error",
                    description: "Could not fetch your review assignments.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchReviewAssignments();
    }, [user, toast]);

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
                        <TableHead className="hidden sm:table-cell">Assigned</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             Array.from({ length: 2 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : assignedSubmissions.length > 0 ? (
                            assignedSubmissions.map((submission) => {
                                const myReview = submission.reviewers?.find(r => r.id === user?.uid);
                                const hasReviewed = myReview?.status === 'Review Submitted';
                                return (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium max-w-xs truncate">{submission.title}</TableCell>
                                    {/* Ideally, we'd store an 'assignedAt' timestamp for the reviewer */}
                                    <TableCell className="hidden sm:table-cell">{formatDistanceToNow(submission.submittedAt, { addSuffix: true })}</TableCell>
                                    <TableCell>
                                        <Badge variant={hasReviewed ? 'success' : 'outline'}>{myReview?.status || 'Pending'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/submissions/${submission.id}`} passHref>
                                         <Button variant={hasReviewed ? "secondary" : "outline"} size="sm">
                                            {hasReviewed ? 'View' : 'Review'}
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
