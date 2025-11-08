
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditorialBoardMemberSchema } from '@/lib/data-schemas';
import { EditorialBoardMember, UserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const MemberForm = ({ member, onSave, onCancel, allUsers }: { member?: EditorialBoardMember, onSave: () => void, onCancel: () => void, allUsers: UserProfile[] }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManual, setIsManual] = useState(!member?.userId);

  const form = useForm<EditorialBoardMember>({
    resolver: zodResolver(EditorialBoardMemberSchema),
    defaultValues: member || {
      name: '',
      qualifications: '',
      affiliation: '',
      country: '',
      role: 'Associate Editor',
      imageSeed: Math.random().toString(36).substring(7),
      userId: '',
    },
  });

  useEffect(() => {
    // If we are editing a member that was linked to a user, pre-select that user.
    if (member?.userId) {
      setIsManual(false);
      const linkedUser = allUsers.find(u => u.uid === member.userId);
      if(linkedUser) {
        form.setValue('name', linkedUser.displayName);
        form.setValue('affiliation', linkedUser.specialization || 'N/A');
      }
    } else {
      setIsManual(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, allUsers]);

  const handleUserSelect = (userId: string) => {
    if (userId === 'manual') {
      setIsManual(true);
      form.reset({
        ...form.getValues(),
        name: '',
        qualifications: '',
        affiliation: '',
        country: '',
        userId: '',
      });
    } else {
      setIsManual(false);
      const selectedUser = allUsers.find(u => u.uid === userId);
      if (selectedUser) {
        form.setValue('userId', selectedUser.uid);
        form.setValue('name', selectedUser.displayName);
        form.setValue('affiliation', selectedUser.specialization || 'N/A');
        form.setValue('imageSeed', selectedUser.uid); // Use UID for consistent image
      }
    }
  }


  const onSubmit = async (values: EditorialBoardMember) => {
    setIsSubmitting(true);
    try {
      if (values.id) {
        // Update existing member
        const memberRef = doc(db, 'editorialBoard', values.id);
        await updateDoc(memberRef, values);
        toast({ title: 'Success', description: 'Board member updated.' });
      } else {
        // Add new member
        await addDoc(collection(db, 'editorialBoard'), {
          ...values,
          order: (await getDocs(collection(db, 'editorialBoard'))).size,
        });
        toast({ title: 'Success', description: 'New board member added.' });
      }
      onSave();
    } catch (error) {
      console.error('Error saving member:', error);
      toast({ title: 'Error', description: 'Could not save member details.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel>Board Member Source</FormLabel>
          <Select onValueChange={handleUserSelect} defaultValue={member?.userId || 'manual'}>
            <FormControl>
                <SelectTrigger>
                    <SelectValue placeholder="Select a source..." />
                </SelectTrigger>
            </FormControl>
            <SelectContent>
                <SelectItem value="manual">-- Enter Manually --</SelectItem>
                {allUsers.map(user => (
                    <SelectItem key={user.uid} value={user.uid}>{user.displayName}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FormItem>

        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Dr. Jane Doe" disabled={!isManual} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="qualifications" render={({ field }) => (
            <FormItem><FormLabel>Qualifications</FormLabel><FormControl><Input {...field} placeholder="e.g., PhD" disabled={!isManual} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="affiliation" render={({ field }) => (
            <FormItem><FormLabel>Affiliation</FormLabel><FormControl><Input {...field} placeholder="e.g., University of Science" disabled={!isManual} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} placeholder="e.g., Nigeria" disabled={!isManual} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem><FormLabel>Role</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Editor-in-Chief">Editor-in-Chief</SelectItem>
                <SelectItem value="Founding Editor">Founding Editor</SelectItem>
                <SelectItem value="Senior Associate Editor">Senior Associate Editor</SelectItem>
                <SelectItem value="Associate Editor">Associate Editor</SelectItem>
              </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="imageSeed" render={({ field }) => (
          <FormItem><FormLabel>Image Seed</FormLabel><FormControl><Input {...field} placeholder="A unique string for the photo" disabled={!isManual} /></FormControl><FormMessage /></FormItem>
        )} />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Member'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};


export default function EditorialBoardSettingsPage() {
  const [members, setMembers] = useState<EditorialBoardMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EditorialBoardMember | undefined>(undefined);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch board members
      const membersQuery = query(collection(db, 'editorialBoard'), orderBy('order'));
      const membersSnapshot = await getDocs(membersQuery);
      const membersList = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EditorialBoardMember));
      setMembers(membersList);

      // Fetch all users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
      setAllUsers(usersList);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Could not fetch required data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingMember(undefined);
    fetchData();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingMember(undefined);
  };
  
  const handleEditClick = (member: EditorialBoardMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  }

  const handleDelete = async (memberId: string) => {
    try {
        await deleteDoc(doc(db, 'editorialBoard', memberId));
        toast({ title: 'Success', description: 'Board member removed.' });
        fetchData();
    } catch (error) {
        console.error('Error deleting member:', error);
        toast({ title: 'Error', description: 'Could not remove member.', variant: 'destructive' });
    }
  }


  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Manage Editorial Board</h1>
          <p className="text-muted-foreground">Add, edit, or remove members from the public editorial board page.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => { setEditingMember(undefined); setIsFormOpen(true); }}><PlusCircle className="mr-2" /> Add Member</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingMember ? 'Edit' : 'Add'} Board Member</DialogTitle>
                    <DialogDescription>Select an existing user or manually enter details for the board member.</DialogDescription>
                </DialogHeader>
                <MemberForm member={editingMember} onSave={handleFormSave} onCancel={handleFormCancel} allUsers={allUsers} />
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Board Members</CardTitle>
          <CardDescription>The list of members currently displayed on the public website.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Affiliation</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-12 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : members.length > 0 ? (
                members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Image src={`https://picsum.photos/seed/${member.imageSeed}/48/48`} alt={member.name} width={48} height={48} className="rounded-full" data-ai-hint="person face" />
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.affiliation}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently remove this member from the editorial board.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(member.id!)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No board members found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    