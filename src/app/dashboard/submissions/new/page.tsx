
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, PlusCircle, Download } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { ContributorSchema } from '@/lib/data-schemas';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUploader } from '@/components/file-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { logSubmissionEvent } from '@/ai/flows/log-submission-event';
import Link from 'next/link';
import { useUploadThing } from '@/lib/uploadthing';


const formSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long.'),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters long.'),
  keywords: z.string().min(3, 'Please provide at least one keyword.'),
  contributors: z.array(ContributorSchema).min(1, 'At least one contributor is required.'),
});

export default function NewSubmissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateUrl, setTemplateUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { startUpload, isUploading } = useUploadThing("documentUploader");


  useEffect(() => {
    const getTemplateUrl = async () => {
        try {
            const docRef = doc(db, 'settings', 'journalInfo');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().submissionTemplateUrl) {
                setTemplateUrl(docSnap.data().submissionTemplateUrl);
            }
        } catch (error) {
            console.error("Could not fetch submission template URL:", error);
        }
    };
    getTemplateUrl();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      abstract: '',
      keywords: '',
      contributors: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "contributors",
  });

  useEffect(() => {
    if (user && fields.length === 0) {
      append({
        name: user.displayName || '',
        email: user.email || '',
        institution: '',
        orcid: '',
        role: 'Author',
        isPrimaryContact: true,
      });
    }
  }, [user, fields.length, append]);


  const handlePrimaryContactChange = (indexToSet: number) => {
    fields.forEach((_, index) => {
        update(index, { 
            ...fields[index], 
            isPrimaryContact: index === indexToSet
        });
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.displayName || !user.email) {
        toast({
            title: 'Authentication Error',
            description: 'You must be logged in to submit a manuscript.',
            variant: 'destructive',
        });
        return;
    }
    
    if (!file) {
      toast({
        title: "Manuscript file is required",
        description: "Please select your manuscript file before submitting.",
        variant: "destructive",
      });
      return;
    }

    const primaryContact = values.contributors.find(c => c.isPrimaryContact);
    if (!primaryContact) {
        toast({ title: "Primary contact missing", description: "One author must be designated as the primary contact.", variant: 'destructive'});
        return;
    }

    setIsSubmitting(true);

    try {
      const uploadRes = await startUpload([file]);
      if (!uploadRes || !uploadRes[0]) {
        throw new Error("File upload failed to return a result.");
      }
      const manuscriptUrl = uploadRes[0].url;

      const submissionData = {
          author: { id: user.uid, name: primaryContact.name, email: primaryContact.email },
          status: 'Submitted' as const,
          submittedAt: serverTimestamp(),
          title: values.title,
          abstract: values.abstract,
          keywords: values.keywords,
          manuscriptUrl: manuscriptUrl,
          contributors: values.contributors,
          reviewers: [],
          reviewerIds: [],
      };
      
      const submissionsCollectionRef = collection(db, 'submissions');

      const docRef = await addDoc(submissionsCollectionRef, submissionData);
      
      await logSubmissionEvent({
          submissionId: docRef.id,
          eventType: 'SUBMISSION_CREATED',
          context: { authorName: primaryContact.name },
      });

      toast({
          title: 'Submission Successful!',
          description: 'Your manuscript has been received.',
          variant: 'default',
          className: 'bg-green-500 text-white',
      });
      router.push('/dashboard/author');

    } catch (error: any) {
       console.error("Submission failed:", error);
       if(error.message?.includes("permission-error")) {
          // The error emitter will handle this
       } else {
         toast({
          title: 'Submission Failed',
          description: error.message || 'Could not submit your manuscript.',
          variant: 'destructive',
         });
       }
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-2xl">Submit New Manuscript</CardTitle>
                            <CardDescription>
                                Fill out the form below to submit your work for review.
                            </CardDescription>
                        </div>
                        {templateUrl && (
                             <Button asChild variant="outline">
                                <Link href={templateUrl} target="_blank">
                                    <Download className="mr-2" />
                                    Download Template
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Manuscript Title</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter the full title of your manuscript" {...field} disabled={isSubmitting}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="abstract"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Abstract</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Provide a concise summary of your research (250-300 words)"
                                className="min-h-[150px]"
                                {...field}
                                disabled={isSubmitting}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Keywords</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Quantum Physics, AI, Climate Change" {...field} disabled={isSubmitting}/>
                            </FormControl>
                            <FormDescription>
                            Separate keywords with commas.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    
                    <FormItem>
                        <FormLabel>Manuscript File</FormLabel>
                        <FormControl>
                            <FileUploader
                                endpoint="documentUploader"
                                onUploadComplete={(url, key) => {}}
                                onUploadError={(error) => {
                                    toast({
                                        title: 'Upload Failed',
                                        description: error.message,
                                        variant: 'destructive'
                                    })
                                }}
                                onFileSelect={setFile}
                            />
                        </FormControl>
                            <FormDescription>Please upload your manuscript in .docx format.</FormDescription>
                         <FormMessage />
                    </FormItem>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">List of Contributors</CardTitle>
                    <CardDescription>Add all contributing authors. Designate one as the primary contact.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 bg-secondary/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <FormField
                                    control={form.control}
                                    name={`contributors.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input placeholder="Contributor's full name" {...field} disabled={isSubmitting}/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`contributors.${index}.email`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" placeholder="contributor@example.com" {...field} disabled={isSubmitting}/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`contributors.${index}.institution`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Institution</FormLabel>
                                            <FormControl><Input placeholder="University or Organization" {...field} disabled={isSubmitting}/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`contributors.${index}.orcid`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ORCID ID (Optional)</FormLabel>
                                            <FormControl><Input placeholder="0000-0000-0000-0000" {...field} disabled={isSubmitting}/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                 <FormField
                                    control={form.control}
                                    name={`contributors.${index}.isPrimaryContact`}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            handlePrimaryContactChange(index);
                                                        }
                                                    }}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormLabel>Primary Contact</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                {index > 0 && ( // Don't allow removing the first author
                                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={isSubmitting}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => append({ name: '', email: '', institution: '', orcid: '', role: 'Author', isPrimaryContact: false })}
                        disabled={isSubmitting}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Contributor
                    </Button>
                     <FormMessage>{form.formState.errors.contributors?.message}</FormMessage>
                </CardContent>
            </Card>


            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || isUploading} size="lg">
                    {isUploading ? 'Uploading file...' : isSubmitting ? 'Submitting...' : 'Submit Manuscript'}
                </Button>
            </div>
        </form>
        </Form>
    </div>
  );
}

    