
'use client';

import Link from 'next/link';
import { ArrowUpRight, PlusCircle, Search, Trash2 } from 'lucide-react';
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
import { collection, getDocs, orderBy, query, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';


const getStatusVariant = (status: SubmissionStatus) => {
  switch (status) {
    case 'Accepted':
      return 'success';
    case 'Rejected':
      return 'destructive';
    case 'Minor Revision':
    case 'Major Revision':
      return 'secondary';
    case 'Under Peer Review':
    case 'Under Initial Review':
      return 'default';
    default:
      return 'outline';
  }
};

export default function AllSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const { toast } = useToast();

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
                } as Submission;
            });
            setSubmissions(subs);
        } catch (error) {
            console.error("Error fetching submissions: ", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchSubmissions();
    }, []);

    const filteredSubmissions = useMemo(() => {
        if (!searchTerm) return submissions;
        return submissions.filter(submission => 
            submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.author.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [submissions, searchTerm]);
    
    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            const allIds = new Set(filteredSubmissions.map(s => s.id));
            setSelectedRows(allIds);
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleRowSelect = (rowId: string) => {
        const newSelection = new Set(selectedRows);
        if (newSelection.has(rowId)) {
            newSelection.delete(rowId);
        } else {
            newSelection.add(rowId);
        }
        setSelectedRows(newSelection);
    };

    const handleDeleteSelected = async () => {
        const batch = writeBatch(db);
        selectedRows.forEach(id => {
            const docRef = doc(db, 'submissions', id);
            batch.delete(docRef);
        });

        try {
            await batch.commit();
            toast({
                title: 'Submissions Deleted',
                description: `${selectedRows.size} submission(s) have been permanently removed.`,
            });
            setSelectedRows(new Set());
            await fetchSubmissions(); // Refetch data
        } catch (error) {
            console.error("Error deleting submissions:", error);
            toast({
                title: 'Error',
                description: 'Could not delete the selected submissions.',
                variant: 'destructive',
            });
        }
    }

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
                    <CardTitle className="font-headline">Manuscript Archive ({submissions.length})</CardTitle>
                    <CardDescription>A complete list of all submissions.</CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                 <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by title or author..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {selectedRows.size > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="shrink-0">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete ({selectedRows.size})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete {selectedRows.size} submission(s).
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead padding="checkbox" className="w-12">
                  <Checkbox
                    checked={selectedRows.size > 0 && selectedRows.size === filteredSubmissions.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
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
                        <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} data-state={selectedRows.has(submission.id) && "selected"}>
                    <TableCell padding="checkbox">
                        <Checkbox
                            checked={selectedRows.has(submission.id)}
                            onCheckedChange={() => handleRowSelect(submission.id)}
                            aria-label={`Select row for ${submission.title}`}
                        />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] sm:max-w-xs truncate">{submission.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">{submission.author.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        {format(submission.submittedAt, 'PPP')}
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(submission.status)} className={cn(submission.status.startsWith('Under') && 'bg-blue-500')}>
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
                    <TableCell colSpan={6} className="h-24 text-center">
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
