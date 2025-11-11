'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/file-uploader';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const journalInfoFormSchema = z.object({
  coverLetterUrl: z.string().url().optional().or(z.literal('')),
  submissionTemplateUrl: z.string().url().optional().or(z.literal('')),
});

export default function JournalInfoSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof journalInfoFormSchema>>({
    resolver: zodResolver(journalInfoFormSchema),
    defaultValues: {
      coverLetterUrl: '',
      submissionTemplateUrl: '',
    },
  });

  useEffect(() => {
    const fetchJournalInfo = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', 'journalInfo');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          form.reset(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching journal info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJournalInfo();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof journalInfoFormSchema>) => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'settings', 'journalInfo');
      await setDoc(docRef, values, { merge: true });
      
      // Call the API route to revalidate the homepage path
      await fetch('/api/revalidate?path=/');
      
      toast({
        title: 'Settings Saved',
        description: 'Your journal information has been updated. The homepage may take a moment to reflect changes.',
      });

    } catch (error) {
      console.error("Error saving journal info:", error);
      toast({
        title: 'Error',
        description: 'Could not save journal info.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-headline mb-2">Journal Information</h1>
      <p className="text-muted-foreground mb-8">Set the cover letter image and submission template for authors.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Cover Letter Image</CardTitle>
              <CardDescription>This image will be displayed on the homepage. A portrait aspect ratio is recommended.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                 <div className="flex items-center space-x-4">
                  <Skeleton className="h-24 w-24" />
                  <div className="space-y-2">
                     <Skeleton className="h-10 w-[400px]" />
                  </div>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="coverLetterUrl"
                  render={({ field }) => (
                     <FormItem>
                      <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                          <FileUploader
                            endpoint="imageUploader"
                            value={field.value}
                            onUploadComplete={(url) => field.onChange(url)}
                            onUploadError={(error) => toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' })}
                          />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Submission Template</CardTitle>
              <CardDescription>Upload a .docx template for authors to download.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <FormField
                  control={form.control}
                  name="submissionTemplateUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template File</FormLabel>
                      <FormControl>
                        <FileUploader
                          endpoint="documentUploader"
                          value={field.value}
                          onUploadComplete={(url) => field.onChange(url)}
                          onUploadError={(error) => toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
           <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardFooter>
        </form>
      </Form>
    </div>
  );
}
