
'use client';

import { notFound, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Star, User as UserIcon, GraduationCap, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, Submission, UserRole } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const RoleManagementCard = ({ user, onRoleUpdate }: { user: UserProfile, onRoleUpdate: () => void }) => {
    const [newRole, setNewRole] = useState<UserRole>(user.role);
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();

    const handleUpdateRole = async () => {
        setIsUpdating(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { role: newRole });
            toast({ title: 'Success', description: `${user.displayName}'s role has been updated to ${newRole}.` });
            onRoleUpdate();
        } catch (error) {
            console.error("Error updating role:", error);
            toast({ title: 'Error', description: 'Failed to update user role.', variant: 'destructive' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Admin: Manage Role
                </CardTitle>
                <CardDescription>Assign a new primary role to this user.</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Author">Author</SelectItem>
                        <SelectItem value="Reviewer">Reviewer</SelectItem>
                        <SelectItem value="Editor">Editor</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
            <CardFooter>
                <Button onClick={handleUpdateRole} disabled={isUpdating || newRole === user.role}>
                    {isUpdating ? 'Saving...' : 'Save Role'}
                </Button>
            </CardFooter>
        </Card>
    );
};


const ReviewerProfileSkeleton = () => (
    <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-4">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="text-center">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-5 w-56 mt-2" />
                        </div>
                         <Skeleton className="h-10 w-28" />
                    </div>
                </CardContent>
                <Separator />
                <CardHeader>
                     <Skeleton className="h-6 w-32" />
                </CardHeader>
                 <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
)


export default function ReviewerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reviewHistory, setReviewHistory] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile: adminProfile } = useAuth();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const fetchReviewerData = React.useCallback(async () => {
    if (!id) return;
    try {
        // Fetch user profile
        const userDocRef = doc(db, 'users', id);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
        } else {
            notFound();
            return;
        }

        // Fetch review history
        const submissionsQuery = query(
            collection(db, 'submissions'),
            where('reviewerIds', 'array-contains', id)
        );

        const submissionsSnapshot = await getDocs(submissionsQuery);
        const history = submissionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt.toDate(),
            } as Submission
        }).filter(sub => 
            sub.reviewers?.some(r => r.id === id && r.status === 'Review Submitted')
        );
        
        setReviewHistory(history);

    } catch (error) {
        console.error("Error fetching reviewer data: ", error);
    } finally {
        setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    setLoading(true);
    fetchReviewerData();
  }, [id, refetchTrigger, fetchReviewerData]);


  if (loading) {
    return <ReviewerProfileSkeleton />;
  }

  if (!userProfile) {
    notFound();
  }
  
  const isAdmin = adminProfile?.role === 'Admin';
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) return names[0][0] + names[names.length - 1][0];
    return name.substring(0, 2);
  }


  return (
    <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-4">
                        <Avatar className="h-32 w-32">
                          <AvatarImage src={userProfile.photoURL || ''} alt={userProfile.displayName || 'User'} />
                          <AvatarFallback className="text-4xl">{getInitials(userProfile.displayName || 'U')}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <CardTitle className="font-headline text-2xl">{userProfile.displayName}</CardTitle>
                            <p className="text-muted-foreground">{userProfile.email}</p>
                        </div>
                         <Button>
                            <Mail className="mr-2 h-4 w-4" />
                            Contact
                        </Button>
                    </div>
                </CardContent>
                <Separator />
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Details</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                        <Badge variant={userProfile.role === 'Editor' ? 'default' : userProfile.role === 'Reviewer' ? 'secondary' : 'outline'}>{userProfile.role}</Badge>
                    </div>
                    {userProfile.specialization && (
                        <div className="flex items-center gap-3">
                             <GraduationCap className="w-5 h-5 text-muted-foreground" />
                            <span className="text-muted-foreground">{userProfile.specialization}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isAdmin && <RoleManagementCard user={userProfile} onRoleUpdate={() => setRefetchTrigger(t => t + 1)} />}
        </div>
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Review History</CardTitle>
                    <CardDescription>A list of manuscripts previously reviewed by this user.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reviewHistory.length > 0 ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Manuscript Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviewHistory.map((submission) => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium max-w-xs truncate">{submission.title}</TableCell>
                                        <TableCell><Badge variant='success'>Completed</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/submissions/${submission.id}`} passHref>
                                                <Button variant="outline" size="sm">
                                                    View
                                                    <ArrowUpRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    ) : (
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-64">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <UserIcon className="h-16 w-16 text-muted-foreground" />
                                <h3 className="text-xl font-bold tracking-tight font-headline">
                                No Review History
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md">
                                When this user completes reviews, they will appear here.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
