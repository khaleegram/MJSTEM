
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
import { Textarea } from '@/components/ui/textarea';

const journalInfoFormSchema = z.object({
  coverLetter: z.string().optional(),
  submissionTemplateUrl: z.string().url().optional(),
});

export default function JournalInfoSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof journalInfoFormSchema>>({
    resolver: zodResolver(journalInfoFormSchema),
    defaultValues: {
      coverLetter: '',
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
      toast({
        title: 'Settings Saved',
        description: 'Your journal information has been updated.',
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
      <p className="text-muted-foreground mb-8">Set the cover letter and submission template for authors.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Cover Letter Template</CardTitle>
              <CardDescription>This text will be displayed in the hero section of the homepage.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <FormField
                  control={form.control}
                  name="coverLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Letter Text</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Enter a brief, welcoming cover letter or mission statement..."
                                className="min-h-[120px]"
                                {...field}
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

    