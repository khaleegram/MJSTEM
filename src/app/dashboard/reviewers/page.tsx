
'use client';

import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
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

export default function ReviewersPage() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const isAdmin = userProfile?.role === 'Admin';
  const pageTitle = isAdmin ? 'User Directory' : 'Reviewer Directory';
  const pageDescription = isAdmin
    ? 'Find and manage all users in the system.'
    : 'Find qualified reviewers for manuscripts.';

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const userList: UserProfile[] = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        setAllUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
        toast({
          title: "Error",
          description: "Could not fetch user list.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  const filteredUsers = useMemo(() => {
    let usersToShow = allUsers;

    // For editors, only show users who can be reviewers
    if (!isAdmin) {
        usersToShow = allUsers.filter(user => ['Reviewer', 'Editor', 'Admin'].includes(user.role));
    }

    if (!searchTerm) return usersToShow;

    return usersToShow.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm, isAdmin]);


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
                 <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or email..." 
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
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.role === 'Editor' || user.role === 'Admin' ? 'default' : user.role === 'Reviewer' ? 'secondary' : 'outline'}>{user.role}</Badge>
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
                    <TableCell colSpan={4} className="h-24 text-center">
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
