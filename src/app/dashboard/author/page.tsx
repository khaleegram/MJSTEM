
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Submission, SubmissionStatus } from '@/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: SubmissionStatus) => {
  switch (status) {
    case 'Accepted':
      return 'success';
    case 'Rejected':
      return 'destructive';
    case 'Revisions Required':
      return 'secondary';
    case 'Under Review':
      return 'default';
    default:
      return 'outline';
  }
};


export default function AuthorPage() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!user) {
                setLoading(false);
                return;
            };
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'submissions'), 
                    where('author.id', '==', user.uid),
                    orderBy('submittedAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const subs: Submission[] = querySnapshot.docs.map(doc => {
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
                })
                setSubmissions(subs);
            } catch (error) {
                 toast({
                    title: "Error",
                    description: "Could not fetch your submissions.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        }
        fetchSubmissions();
    }, [user, toast]);

  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold font-headline">Author Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your submissions and track their progress.
          </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Submissions</CardTitle>
                <CardDescription>A list of all manuscripts you have submitted.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             Array.from({ length: 2 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : submissions.length > 0 ? (
                            submissions.map((submission) => (
                            <TableRow key={submission.id}>
                                <TableCell className="font-medium max-w-xs truncate">{submission.title}</TableCell>
                                <TableCell className="hidden sm:table-cell"> {format(submission.submittedAt, 'PPP')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(submission.status)} className={cn(submission.status === 'Under Review' && 'bg-blue-500')}>
                                     {submission.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/submissions/${submission.id}`} passHref>
                                     <Button variant="outline" size="sm">View</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                You haven't submitted any manuscripts yet.
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
