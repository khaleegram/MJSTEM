
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, getDoc, doc, runTransaction, Timestamp } from 'firebase/firestore';

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
import { Trash2, PlusCircle, Download, Paperclip } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { ContributorSchema, NewSubmissionSchema } from '@/lib/data-schemas';
import { FileUploader } from '@/components/file-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { logSubmissionEvent } from '@/ai/flows/log-submission-event';
import Link from 'next/link';
import { generateNotification } from '@/ai/flows/generate-notification';
import { sendConfirmationEmail } from '@/ai/flows/send-confirmation-email';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = NewSubmissionSchema;


const getNextSubmissionId = async (): Promise<string> => {
    const counterRef = doc(db, 'settings', 'submissionCounter');
    const year = new Date().getFullYear().toString().slice(-2); // e.g., 24

    try {
        const newCount = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists() || !counterDoc.data().counts || !counterDoc.data().counts[year]) {
                const initialCounts = counterDoc.exists() ? counterDoc.data().counts || {} : {};
                initialCounts[year] = 1;
                transaction.set(counterRef, { counts: initialCounts }, { merge: true });
                return 1;
            } else {
                const currentCount = counterDoc.data().counts[year];
                const newCount = currentCount + 1;
                const newCounts = { ...counterDoc.data().counts, [year]: newCount };
                transaction.update(counterRef, { counts: newCounts });
                return newCount;
            }
        });

        const paddedCount = newCount.toString().padStart(3, '0');
        return `MJSTEM-S-${year}-${paddedCount}`;
    } catch (error) {
        console.error("Error generating submission ID:", error);
        // Throw a new error to be caught by the calling function
        throw new Error("Could not generate a submission ID. Please try again.");
    }
};


export default function NewSubmissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateUrl, setTemplateUrl] = useState('');
  
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
      manuscriptUrl: '',
      supplementaryFileUrl: '',
      contributors: [],
      pageCount: undefined,
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
        institution: userProfile?.specialization || '',
        orcid: '',
        role: 'Author',
        isPrimaryContact: true,
      });
    }
  }, [user, userProfile, fields.length, append]);


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
    
    if (!values.manuscriptUrl) {
      toast({
        title: "Manuscript file is required",
        description: "Please upload your manuscript file before submitting.",
        variant: "destructive",
      });
      return;
    }

    const primaryContact = values.contributors.find(c => c.isPrimaryContact);
    if (!primaryContact || !primaryContact.name || !primaryContact.email) {
        toast({ title: "Primary contact missing", description: "One author must be designated as the primary contact with a valid name and email.", variant: 'destructive'});
        return;
    }

    setIsSubmitting(true);
    let uniqueId;
    
    try {
        uniqueId = await getNextSubmissionId();
    } catch(error: any) {
        console.error('ID Generation Error:', error);
        toast({
            title: 'Submission Failed',
            description: error.message || "Could not generate a submission ID. Please check your connection and try again.",
            variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
    }

    const submissionData = {
        author: { id: user.uid, name: primaryContact.name, email: primaryContact.email },
        status: 'Submitted' as const,
        submittedAt: serverTimestamp(),
        title: values.title,
        abstract: values.abstract,
        keywords: values.keywords,
        manuscriptUrl: values.manuscriptUrl,
        supplementaryFileUrl: values.supplementaryFileUrl || '',
        contributors: values.contributors,
        pageCount: values.pageCount || null,
        reviewers: [],
        reviewerIds: [],
        uniqueId: uniqueId,
        revision: 0,
    };
    
    const submissionsCollectionRef = collection(db, 'submissions');

    try {
        // 1. Create the submission document first.
        const docRef = await addDoc(submissionsCollectionRef, submissionData);

        toast({
            title: 'Submission Successful!',
            description: 'Your manuscript will first undergo editorial review to assess its suitability, formatting, and compliance with journal policies. If it passes all editorial checks, it will then be sent for peer review.',
            variant: 'default',
            className: 'bg-green-500 text-white',
            duration: 8000,
        });

        // 2. After success, trigger background tasks (email, logs, notifications)
        // These can fail without affecting the core submission.
        try {
            await logSubmissionEvent({
                submissionId: docRef.id,
                eventType: 'SUBMISSION_CREATED',
                context: { authorName: primaryContact.name },
            });
            await generateNotification({
                userId: 'Admins',
                submissionId: docRef.id,
                eventType: 'NEW_SUBMISSION',
                context: { submissionTitle: values.title, authorName: primaryContact.name },
            });
            await sendConfirmationEmail({
                authorEmail: primaryContact.email,
                authorName: primaryContact.name,
                manuscriptTitle: values.title,
                uniqueId: uniqueId,
            });
        } catch (backgroundError) {
            console.error("Failed to send post-submission notifications/emails:", backgroundError);
            // Don't bother the user with this, just log it. The main submission worked.
        }

        router.push('/dashboard/author');

    } catch (serverError) {
        console.error('Submission Error:', serverError);
        const permissionError = new FirestorePermissionError({
            path: submissionsCollectionRef.path,
            operation: 'create',
            requestResourceData: submissionData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
            <h1 className="text-3xl font-bold font-headline">Submit New Manuscript</h1>
            <p className="text-muted-foreground">Fill out the form below to submit your work for review.</p>
        </div>

        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertTitle className="font-headline text-blue-900 dark:text-blue-200">Important Policies</AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-300">
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong className="font-semibold">Plagiarism:</strong> Submissions must have a similarity index of ≤15%.</li>
                    <li><strong className="font-semibold">AI Usage:</strong> AI tools may be used for language editing, but not for generating content.</li>
                    <li><strong className="font-semibold">APCs:</strong> This journal does not charge any Article Processing Charges.</li>
                </ul>
            </AlertDescription>
        </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-xl">1. Manuscript Details</CardTitle>
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
                    
                    <FormField
                        control={form.control}
                        name="manuscriptUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Manuscript File</FormLabel>
                                <FormControl>
                                    <FileUploader
                                        endpoint="documentUploader"
                                        onUploadComplete={(url) => form.setValue('manuscriptUrl', url || '')}
                                        onUploadError={(error) => {
                                            toast({
                                                title: 'Upload Failed',
                                                description: error.message,
                                                variant: 'destructive'
                                            })
                                        }}
                                        description="Upload your manuscript in Word format (.doc, .docx)."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                     <FormField
                        control={form.control}
                        name="supplementaryFileUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <Paperclip className="w-4 h-4" />
                                    Supplementary File (Optional)
                                </FormLabel>
                                <FormControl>
                                    <FileUploader
                                        endpoint="documentUploader"
                                        onUploadComplete={(url) => field.onChange(url)}
                                        onUploadError={(error) => {
                                            toast({
                                                title: 'Upload Failed',
                                                description: error.message,
                                                variant: 'destructive'
                                            })
                                        }}
                                        description="You can attach a single supplementary file (.doc, .docx)."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">2. List of Contributors</CardTitle>
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
                                                 <input
                                                    type="radio"
                                                    name="primaryContactRadio"
                                                    checked={field.value}
                                                    onChange={() => handlePrimaryContactChange(index)}
                                                    className="form-radio h-4 w-4 text-primary transition duration-150 ease-in-out"
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
                <Button type="submit" disabled={isSubmitting} size="lg">
                    {isSubmitting ? 'Submitting...' : 'Submit Manuscript'}
                </Button>
            </div>
        </form>
        </Form>
    </div>
  );
}
