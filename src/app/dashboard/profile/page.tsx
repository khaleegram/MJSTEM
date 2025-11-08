
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import { UserProfileSchema } from '@/lib/data-schemas';
import { useRouter } from 'next/navigation';
import { FileUploader } from '@/components/file-uploader';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const profileFormSchema = UserProfileSchema.pick({
  displayName: true,
  specialization: true,
  photoURL: true,
});

export default function ProfilePage() {
  const { user, userProfile, loading, refetchUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      specialization: '',
      photoURL: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || '',
        specialization: userProfile.specialization || '',
        photoURL: userProfile.photoURL || '',
      });
    }
  }, [userProfile, form]);

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!userProfile || !user) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);

      // 1. Update the user's own profile document
      const userDocRef = doc(db, 'users', userProfile.uid);
      batch.update(userDocRef, {
        displayName: values.displayName,
        specialization: values.specialization,
        photoURL: values.photoURL,
      });

      // 2. Check if this user is on the editorial board and update their entry
      const boardQuery = query(collection(db, 'editorialBoard'), where('userId', '==', userProfile.uid));
      const boardSnapshot = await getDocs(boardQuery);
      
      if (!boardSnapshot.empty) {
        boardSnapshot.forEach(boardDoc => {
          const boardDocRef = doc(db, 'editorialBoard', boardDoc.id);
          batch.update(boardDocRef, {
            name: values.displayName,
            affiliation: values.specialization,
            photoURL: values.photoURL,
          });
        });
      }
      
      // 3. Update the Firebase Auth user profile
      await updateProfile(user, {
        displayName: values.displayName,
        photoURL: values.photoURL,
      });

      // 4. Commit all Firestore updates atomically
      await batch.commit();
      
      await refetchUserProfile(); // Refetch profile data without reloading
      
      toast({ title: "Profile Updated", description: "Your information has been successfully saved." });

    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({ title: "Update Failed", description: "Could not save your changes.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) return names[0][0] + names[names.length - 1][0];
    return name.substring(0, 2);
  }

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24 ml-auto" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="font-headline">My Profile</CardTitle>
            <CardDescription>Manage your personal information and journal role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Photo</FormLabel>
                     <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={field.value || ''} />
                            <AvatarFallback>
                                {getInitials(form.getValues('displayName') || 'U')}
                            </AvatarFallback>
                        </Avatar>
                        <FormControl>
                            <FileUploader
                                endpoint="imageUploader"
                                onUploadComplete={(url) => field.onChange(url)}
                                onUploadError={(error) => toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' })}
                            />
                        </FormControl>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormDescription>This is the name that will be displayed to other users.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization / Field of Study</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Computational Linguistics, Particle Physics" {...field} />
                  </FormControl>
                  <FormDescription>This helps us assign relevant manuscripts for review and serves as your affiliation if you are on the editorial board.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
                <FormLabel>Primary Role</FormLabel>
                <Select value={userProfile?.role} disabled>
                    <SelectTrigger>
                        <SelectValue placeholder="Your role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Author">Author</SelectItem>
                        <SelectItem value="Reviewer">Reviewer</SelectItem>
                        <SelectItem value="Editor">Editor</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                <FormDescription>
                    Your role is managed by the journal administrator. Please contact support if this is incorrect.
                </FormDescription>
            </FormItem>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
