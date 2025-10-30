
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileEdit, UserCheck, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Submission, SubmissionStatus } from '@/types';
import { format } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionsChart } from '@/components/submissions-chart';

export default function EditorPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
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
                };
            });
            setSubmissions(subs);
        } catch (error) {
            console.error("Error fetching submissions: ", error);
             toast({
                title: "Error",
                description: "Could not fetch submissions.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    fetchSubmissions();
  }, [toast]);
  
  const stats = useMemo(() => {
    return submissions.reduce((acc, s) => {
      if (s.status === 'Submitted') acc.awaitingAssignment++;
      if (s.status === 'Under Review') acc.inProgress++;
      if (s.status === 'Revisions Required') acc.decisionsPending++;
      return acc;
    }, { awaitingAssignment: 0, inProgress: 0, decisionsPending: 0 });
  }, [submissions]);

  // For now, "assigned" is any submission that is not yet accepted or rejected.
  const assignedSubmissions = useMemo(() => {
    return submissions.filter(s => s.status === 'Submitted' || s.status === 'Under Review');
  }, [submissions]);

  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold font-headline">Editor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage submissions and oversee the review process.
          </p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Submission Analytics</CardTitle>
                <CardDescription>Overview of manuscript submissions in the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <SubmissionsChart submissions={submissions} />
            </CardContent>
        </Card>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Assigned Submissions</CardTitle>
          <CardDescription>
            Manuscripts you are responsible for managing.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Author</TableHead>
                <TableHead className="hidden lg:table-cell">Date Submitted</TableHead>
                <TableHead>Status</TableHead>
                 <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : assignedSubmissions.length > 0 ? (
                  assignedSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium max-w-xs truncate">{submission.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{submission.author.name}</TableCell>
                      <TableCell className="hidden lg:table-cell">{format(submission.submittedAt, 'PPP')}</TableCell>
                      <TableCell>
                        <Badge variant={submission.status === 'Under Review' ? 'default' : 'outline'} className={submission.status === 'Under Review' ? 'bg-blue-500' : ''}>
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/submissions/${submission.id}`} passHref>
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    You have no assigned submissions.
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
