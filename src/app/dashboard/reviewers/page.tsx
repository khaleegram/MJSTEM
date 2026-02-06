'use client';

import Link from 'next/link';
import { ArrowUpRight, Search, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
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
} from "@/components/ui/alert-dialog";
import { deleteUser } from '@/ai/flows/delete-user';

export default function ReviewersPage() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const isAdmin = userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor';
  const pageTitle = isAdmin ? 'User Directory' : 'Reviewer Directory';
  const pageDescription = isAdmin
    ? 'Find and manage all users in the system.'
    : 'Find qualified reviewers for manuscripts.';

  const fetchUsers = async () => {
    setLoading(true);
    const usersCollection = collection(db, 'users');
    try {
      const q = query(usersCollection);
      const querySnapshot = await getDocs(q);
      const userList: UserProfile[] = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      setAllUsers(userList);
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
        path: usersCollection.path,
        operation: 'list',
        requestResourceData: { info: "Could not fetch user list for reviewer directory." }
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let usersToShow = allUsers;

    // For editors, only show users who can be reviewers
    if (!isAdmin) {
        usersToShow = allUsers.filter(user => ['Reviewer', 'Editor', 'Admin', 'Managing Editor'].includes(user.role));
    }

    if (!searchTerm) return usersToShow;

    return usersToShow.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm, isAdmin]);
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
        const allIds = new Set(filteredUsers.map(u => u.uid));
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
    setIsDeleting(true);
    let successCount = 0;
    const failedDeletions: { name: string, message: string }[] = [];

    for (const userId of selectedRows) {
        const userToDelete = allUsers.find(u => u.uid === userId);
        if (!userToDelete) continue;

        try {
            const result = await deleteUser({ userId });
            if (result.success) {
                successCount++;
            } else {
                failedDeletions.push({ name: userToDelete.displayName, message: result.message });
            }
        } catch (error: any) {
            failedDeletions.push({ name: userToDelete.displayName, message: error.message });
        }
    }

    if (successCount > 0) {
        toast({
            title: 'Users Deleted',
            description: `${successCount} user(s) have been successfully deleted.`,
        });
    }

    if (failedDeletions.length > 0) {
        toast({
            title: 'Some Deletions Failed',
            description: (
                <div>
                    <p>Could not delete {failedDeletions.length} user(s):</p>
                    <ul className="mt-2 list-disc pl-5">
                        {failedDeletions.map(f => <li key={f.name}><strong>{f.name}:</strong> {f.message}</li>)}
                    </ul>
                </div>
            ),
            variant: 'destructive',
            duration: 10000,
        });
    }

    setSelectedRows(new Set());
    setIsDeleting(false);
    await fetchUsers(); // Refetch data
  };


  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                <div>
                    <CardTitle className="font-headline">User List</CardTitle>
                    <CardDescription>
                        {isAdmin ? "A list of all registered users. Admins can manage roles from the user profile page." : "A list of users who can be assigned as reviewers."}
                    </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or email..." 
                            className="pl-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {selectedRows.size > 0 && isAdmin && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="shrink-0" disabled={isDeleting}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {isDeleting ? 'Deleting...' : `Delete (${selectedRows.size})`}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete {selectedRows.size} user(s) and their associated data. This will fail if a user is an author of any submissions.
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
                {isAdmin && (
                    <TableHead padding="checkbox" className="w-12">
                        <Checkbox
                            checked={selectedRows.size > 0 && selectedRows.size === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all rows"
                        />
                    </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        {isAdmin && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <TableRow key={user.uid} data-state={selectedRows.has(user.uid) && "selected"}>
                    {isAdmin && (
                        <TableCell padding="checkbox">
                            <Checkbox
                                checked={selectedRows.has(user.uid)}
                                onCheckedChange={() => handleRowSelect(user.uid)}
                                aria-label={`Select row for ${user.displayName}`}
                            />
                        </TableCell>
                    )}
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.role === 'Editor' || user.role === 'Admin' || user.role === 'Managing Editor' ? 'default' : user.role === 'Reviewer' ? 'secondary' : 'outline'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Link href={`/dashboard/reviewers/${user.uid}`} passHref>
                        <Button variant="outline" size="sm">
                            View
                            <ArrowUpRight className="ml-2 h-4 w-4 md:hidden" />
                            <span className="hidden md:inline-block ml-2">Profile</span>
                        </Button>
                        </Link>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">
                        No users found.
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