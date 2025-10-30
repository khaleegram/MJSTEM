
'use client';

import Link from 'next/link';
import { ArrowUpRight, PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { SubmissionStatus, Submission } from '@/types';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

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

export default function AllSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                        coverLetterUrl: data.coverLetterUrl || '',
                    } as Submission;
                });
                setSubmissions(subs);
            } catch (error) {
                console.error("Error fetching submissions: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, []);

    const filteredSubmissions = useMemo(() => {
        if (!searchTerm) return submissions;
        return submissions.filter(submission => 
            submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.author.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [submissions, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">All Submissions</h1>
          <p className="text-muted-foreground">
            Browse and manage all manuscripts in the system.
          </p>
        </div>
        <Link href="/dashboard/submissions/new" passHref>
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Submission
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                <div>
                    <CardTitle className="font-headline">Manuscript Archive</CardTitle>
                    <CardDescription>A complete list of all submissions.</CardDescription>
                </div>
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by title or author..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Author</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                    <TableCell className="font-medium max-w-[200px] sm:max-w-xs truncate">{submission.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">{submission.author.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        {format(submission.submittedAt, 'PPP')}
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(submission.status)} className={cn(submission.status === 'Under Review' && 'bg-blue-500')}>
                        {submission.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Link href={`/dashboard/submissions/${submission.id}`} passHref>
                        <Button variant="outline" size="sm">
                            View
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                        </Link>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No submissions found.
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
