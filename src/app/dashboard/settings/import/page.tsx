
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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
import { Trash2, PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import { ContributorSchema, SubmissionStatus } from '@/types';
import { FileUploader } from '@/components/file-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { logSubmissionEvent } from '@/ai/flows/log-submission-event';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';


const statusOptions: SubmissionStatus[] = [
    'Submitted', 'Under Initial Review', 'Under Peer Review', 
    'Minor Revision', 'Major Revision', 'Accepted', 'Rejected'
];

const importSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long.'),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters long.'),
  keywords: z.string().min(3, 'Please provide at least one keyword.'),
  manuscriptUrl: z.string().url('Manuscript file is required.'),
  contributors: z.array(ContributorSchema).min(1, 'At least one contributor is required.'),
  status: z.enum(statusOptions),
  originalSubmissionDate: z.date().optional(),
});

export default function ImportSubmissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof importSchema>>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      title: '',
      abstract: '',
      keywords: '',
      contributors: [{ name: '', email: '', institution: '', isPrimaryContact: true, role: 'Author' }],
      manuscriptUrl: '',
      status: 'Submitted',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "contributors",
  });

  const handlePrimaryContactChange = (indexToSet: number) => {
    fields.forEach((_, index) => {
        update(index, { 
            ...fields[index], 
            isPrimaryContact: index === indexToSet
        });
    });
  }

  async function onSubmit(values: z.infer<typeof importSchema>) {
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be an admin to import submissions.', variant: 'destructive'});
        return;
    }
    
    const primaryContact = values.contributors.find(c => c.isPrimaryContact);
    if (!primaryContact) {
        toast({ title: "Primary contact missing", description: "One author must be designated as the primary contact.", variant: 'destructive'});
        return;
    }

    setIsSubmitting(true);

    const submissionData = {
        // Use a placeholder or a generic ID for imported authors, as they might not be system users
        author: { id: `imported_${Date.now()}`, name: primaryContact.name, email: primaryContact.email },
        status: values.status,
        submittedAt: values.originalSubmissionDate ? Timestamp.fromDate(values.originalSubmissionDate) : serverTimestamp(),
        title: values.title,
        abstract: values.abstract,
        keywords: values.keywords,
        manuscriptUrl: values.manuscriptUrl,
        contributors: values.contributors,
        reviewers: [],
        reviewerIds: [],
        originalSubmissionDate: values.originalSubmissionDate || null,
    };
    
    const submissionsCollectionRef = collection(db, 'submissions');

    try {
        const docRef = await addDoc(submissionsCollectionRef, submissionData);
        
        await logSubmissionEvent({
            submissionId: docRef.id,
            eventType: 'SUBMISSION_CREATED',
            context: { authorName: `(Imported) ${primaryContact.name}` },
        });

        toast({
            title: 'Import Successful!',
            description: 'The manuscript has been added to the system.',
            className: 'bg-green-500 text-white',
        });
        
        form.reset();
        
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: submissionsCollectionRef.path,
            operation: 'create',
            requestResourceData: submissionData
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Import Existing Submissions</h1>
          <p className="text-muted-foreground">Manually add papers that were submitted outside of this system.</p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Manuscript Details</CardTitle>
                    <CardDescription>Fill out the core information for the submission.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Manuscript Title</FormLabel><FormControl><Input placeholder="Enter the full title..." {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="abstract" render={({ field }) => (
                        <FormItem><FormLabel>Abstract</FormLabel><FormControl><Textarea placeholder="Provide a concise summary..." className="min-h-[150px]" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="keywords" render={({ field }) => (
                        <FormItem><FormLabel>Keywords</FormLabel><FormControl><Input placeholder="e.g., Quantum Physics, AI, Climate Change" {...field} disabled={isSubmitting}/></FormControl><FormDescription>Separate keywords with commas.</FormDescription><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="manuscriptUrl" render={({ field }) => (
                        <FormItem><FormLabel>Manuscript File</FormLabel><FormControl><FileUploader endpoint="documentUploader" onUploadComplete={(url) => field.onChange(url)} onUploadError={(error) => toast({title: 'Upload Failed', description: error.message, variant: 'destructive'})}/></FormControl><FormDescription>Upload the .docx or .pdf file.</FormDescription><FormMessage /></FormItem>
                    )}/>
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
                                <FormField control={form.control} name={`contributors.${index}.name`} render={({ field }) => (
                                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Contributor's full name" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`contributors.${index}.email`} render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contributor@example.com" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name={`contributors.${index}.institution`} render={({ field }) => (
                                    <FormItem><FormLabel>Institution</FormLabel><FormControl><Input placeholder="University or Organization" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`contributors.${index}.orcid`} render={({ field }) => (
                                    <FormItem><FormLabel>ORCID ID (Optional)</FormLabel><FormControl><Input placeholder="0000-0000-0000-0000" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                 <FormField control={form.control} name={`contributors.${index}.isPrimaryContact`} render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><input type="radio" name="primaryContact" checked={field.value} onChange={() => handlePrimaryContactChange(index)} className="form-radio h-4 w-4 text-primary" disabled={isSubmitting}/></FormControl>
                                        <FormLabel>Primary Contact</FormLabel>
                                    </FormItem>
                                )}/>
                                {fields.length > 1 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={isSubmitting}><Trash2 className="h-4 w-4 mr-2" /> Remove</Button>
                                )}
                            </div>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', email: '', institution: '', orcid: '', role: 'Author', isPrimaryContact: false })} disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4" /> Add Contributor</Button>
                    <FormMessage>{form.formState.errors.contributors?.message}</FormMessage>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Submission Metadata</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                     <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Current Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Set the current status" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormDescription>Set the current workflow status for this submission.</FormDescription>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="originalSubmissionDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Original Submission Date (Optional)</FormLabel>
                            <Popover><PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                            </PopoverContent></Popover>
                        <FormDescription>The date the paper was originally received.</FormDescription><FormMessage /></FormItem>
                    )}/>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} size="lg">{isSubmitting ? 'Importing...' : 'Import Submission'}</Button>
            </div>
        </form>
        </Form>
    </div>
  );
}
