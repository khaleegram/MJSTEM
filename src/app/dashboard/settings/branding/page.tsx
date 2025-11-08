
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
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

const brandingFormSchema = z.object({
  logoUrl: z.string().url().optional(),
});

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof brandingFormSchema>>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      logoUrl: '',
    },
  });

  useEffect(() => {
    const fetchBrandingSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', 'branding');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          form.reset(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching branding settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrandingSettings();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof brandingFormSchema>) => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'settings', 'branding');
      await setDoc(docRef, values, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Your branding settings have been updated.',
      });
    } catch (error) {
      console.error("Error saving branding settings:", error);
      toast({
        title: 'Error',
        description: 'Could not save branding settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-headline mb-2">Branding & Appearance</h1>
      <p className="text-muted-foreground mb-8">Customize the journal's logo and theme.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Journal Logo</CardTitle>
              <CardDescription>Upload a logo to be displayed in the site header.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16" />
                  <div className="space-y-2">
                     <Skeleton className="h-10 w-[400px]" />
                  </div>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Image</FormLabel>
                      <div className="flex items-center gap-6">
                        {field.value && (
                           <Image src={field.value} alt="Current logo" width={64} height={64} className="rounded-md object-contain" />
                        )}
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
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
