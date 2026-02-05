
'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs, addDoc, serverTimestamp, query, where, runTransaction, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { File, Calendar, User, Mail, PlusCircle, Download, BookCopy, Edit, Sparkles, UserCheck, MessageSquare, Shield, Upload, Clock, CheckCircle2, FileSearch, Info, Trash2, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { SubmissionStatus, Reviewer, Submission, UserProfile, Volume } from '@/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmittedReviews } from '@/components/submitted-reviews';
import { SubmissionHistory } from '@/components/submission-history';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { logSubmissionEvent } from '@/ai/flows/log-submission-event';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileUploader } from '@/components/file-uploader';
import { generateNotification } from '@/ai/flows/generate-notification';
import { Input } from '@/components/ui/input';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { sendReviewerAssignmentEmail } from '@/ai/flows/send-reviewer-assignment-email';
import { sendDecisionEmail } from '@/ai/flows/send-decision-email';
import { Label } from '@/components/ui/label';


async function getNextSubmissionId(): Promise<string> {
    const counterRef = doc(db, 'settings', 'submissionCounter');
    const year = new Date().getFullYear().toString().slice(-2); // e.g., 24

    const newCount = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists() || !counterDoc.data().counts || !counterDoc.data().counts[year]) {
            // Initialize for the year
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
}


const getStatusVariant = (status: SubmissionStatus) => {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Rejected':
        return 'destructive';
      case 'Awaiting Revision: Similarity Issues':
      case 'Major Revision':
      case 'Minor Revision':
        return 'warning';
      case 'Under Peer Review':
      case 'Under Initial Review':
      case 'Under Review-R1':
      case 'Under Review-R2':
        return 'info';
      case 'With Editor':
      case 'Submitted':
        return 'default';
      default:
        return 'outline';
    }
  };

const ReviewSubmissionForm = ({ submission, onReviewSubmit }: { submission: Submission, onReviewSubmit: () => void }) => {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [recommendation, setRecommendation] = React.useState('');
    const [commentsForEditor, setCommentsForEditor] = React.useState('');
    const [commentsForAuthor, setCommentsForAuthor] = React.useState('');
    const [attachmentUrl, setAttachmentUrl] = React.useState('');
    const [attachmentName, setAttachmentName] = React.useState('');

    const myReviewAssignment = submission.reviewers?.find(r => r.id === user?.uid);

    if (!myReviewAssignment || myReviewAssignment.status === 'Review Submitted') {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recommendation) {
            toast({ title: "Recommendation Required", description: "Please select a recommendation for the editor.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);

        const reviewData = {
            reviewerId: user?.uid,
            reviewerName: user?.displayName,
            recommendation,
            commentsForEditor,
            commentsForAuthor,
            submittedAt: serverTimestamp(),
            attachmentUrl,
            attachmentName,
        };

        const submissionRef = doc(db, 'submissions', submission.id);
        const reviewRef = collection(db, 'submissions', submission.id, 'reviews');

        try {
            // 1. Add review to subcollection
            await addDoc(reviewRef, reviewData);
            
            // 2. Update the reviewer's status in the submission's reviewers array
            const updatedReviewers = submission.reviewers?.map(r => 
                r.id === user?.uid ? { ...r, status: 'Review Submitted' as const } : r
            );
            await updateDoc(submissionRef, { reviewers: updatedReviewers });

            // 3. Log the review event
            await logSubmissionEvent({
                submissionId: submission.id,
                eventType: 'REVIEW_SUBMITTED',
                context: { reviewerName: userProfile?.displayName || 'A reviewer' }
            });
            
             // 4. Notify editors and author
            await generateNotification({
                userId: 'Admins', // Special keyword for all Admins/Managing Editors
                submissionId: submission.id,
                eventType: 'REVIEW_SUBMITTED',
                context: { 
                    submissionTitle: submission.title,
                    reviewerName: userProfile?.displayName || 'a reviewer'
                }
            });

            await generateNotification({
                userId: submission.author.id,
                submissionId: submission.id,
                eventType: 'REVIEW_SUBMITTED',
                context: { submissionTitle: submission.title }
            });
            
            toast({ title: "Review Submitted", description: "Thank you for your contribution. The editor has been notified." });
            onReviewSubmit(); // Trigger a refetch on the parent page
        
        } catch (serverError: any) {
             const permissionError = new FirestorePermissionError({
                path: reviewRef.path,
                operation: 'create',
                requestResourceData: reviewData
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Submit Your Review</CardTitle>
                <CardDescription>Provide your expert recommendation to the editor and comments for the author.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Recommendation to the Editor</label>
                        <Select onValueChange={setRecommendation} value={recommendation} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a recommendation..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Accept">Recommend Acceptance</SelectItem>
                                <SelectItem value="Minor Revision">Recommend Minor Revision</SelectItem>
                                <SelectItem value="Major Revision">Recommend Major Revision</SelectItem>
                                <SelectItem value="Reject">Recommend Rejection</SelectItem>
                            </SelectContent>
                        </Select>
                         <p className="text-xs text-muted-foreground">This is a confidential recommendation to the editor, who makes the final decision.</p>
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Confidential Comments for the Editor
                        </label>
                        <Textarea 
                            value={commentsForEditor}
                            onChange={(e) => setCommentsForEditor(e.target.value)}
                            placeholder="These comments will only be seen by the editor." 
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                           <MessageSquare className="w-4 h-4" />
                           Comments for the Author
                        </label>
                        <Textarea 
                             value={commentsForAuthor}
                            onChange={(e) => setCommentsForAuthor(e.target.value)}
                            placeholder="These comments will be shared with the author anonymously." 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            Upload Annotated Manuscript (Optional)
                        </label>
                        <FileUploader 
                            endpoint="documentUploader"
                            onUploadComplete={(url, name) => {
                                setAttachmentUrl(url || '');
                                setAttachmentName(name || 'attachment');
                            }}
                            onUploadError={(err) => toast({ title: "Upload Error", description: err.message, variant: "destructive"})}
                            description="Upload your annotated manuscript (.doc or .docx)."
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Recommendation'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

const AuthorRevisionForm = ({ submission, onRevisionSubmit }: { submission: Submission, onRevisionSubmit: () => void }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [fileUrl, setFileUrl] = React.useState<string | null>(null);
    const { userProfile } = useAuth();


    const handleFileUploadComplete = React.useCallback(async (url: string) => {
        if (!url) return;
        setFileUrl(url);
      }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileUrl) {
            toast({ title: "No file uploaded", description: "Please upload your revised manuscript.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        
        const currentRevision = submission.revision || 0;
        const newRevision = currentRevision + 1;

        const submissionRef = doc(db, 'submissions', submission.id);
        const newStatus: SubmissionStatus = newRevision >= 2 ? 'Under Review-R2' : 'Under Review-R1';
        
        const updateData: any = {
            manuscriptUrl: fileUrl,
            status: newStatus,
            revision: newRevision,
        };

        if (!submission.originalManuscriptUrl) {
            updateData.originalManuscriptUrl = submission.manuscriptUrl;
        }

        updateDoc(submissionRef, updateData)
            .then(async () => {
                await logSubmissionEvent({
                    submissionId: submission.id,
                    eventType: 'STATUS_CHANGED',
                    context: { actorName: userProfile?.displayName || 'Author', status: `Revision Submitted (${submission.status})` }
                });
                
                await generateNotification({
                    userId: 'Admins', // Notify all admins/editors
                    submissionId: submission.id,
                    eventType: 'REVISION_SUBMITTED',
                    context: {
                        submissionTitle: submission.title,
                        authorName: userProfile?.displayName || 'the author'
                    }
                });

                toast({ title: "Revision Submitted", description: "Your updated manuscript has been sent to the editor." });
                onRevisionSubmit();
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: submissionRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Submit Revision</CardTitle>
                <CardDescription>Upload your revised manuscript file. The editor will be notified.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <FileUploader 
                        endpoint="documentUploader" 
                        onUploadComplete={handleFileUploadComplete} 
                        onUploadError={(err) => toast({ title: "Upload Error", description: err.message, variant: "destructive"})}
                        description="Upload your revised manuscript (.doc, .docx)."
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting || !fileUrl}>
                        {isSubmitting ? 'Submitting...' : 'Submit Revision'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
  
const DetailPageSkeleton = () => (
    <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                    <div className="flex items-center gap-4 pt-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-48" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-20 w-full" />
                    <Separator className="my-6" />
                    <Skeleton className="h-6 w-24 mb-2" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-48" />
                </CardFooter>
            </Card>
        </div>
        <div className="space-y-8 lg:col-span-1">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
)

const editSubmissionSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters long.'),
    abstract: z.string().min(50, 'Abstract must be at least 50 characters long.'),
});

const AuthorEditForm = ({ submission, onUpdate, onCancel }: { submission: Submission; onUpdate: () => void; onCancel: () => void }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<z.infer<typeof editSubmissionSchema>>({
        resolver: zodResolver(editSubmissionSchema),
        defaultValues: {
            title: submission.title,
            abstract: submission.abstract,
        },
    });

    const onSubmit = async (values: z.infer<typeof editSubmissionSchema>) => {
        setIsSubmitting(true);
        const submissionRef = doc(db, 'submissions', submission.id);
        const updateData = {
            title: values.title,
            abstract: values.abstract,
        };

        try {
            await updateDoc(submissionRef, updateData);
            toast({ title: 'Submission Updated', description: 'Your changes have been saved.' });
            onUpdate();
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: submissionRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input {...field} />
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
                                <Textarea {...field} className="min-h-[150px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

const PageCountDialog = ({ submission, onUpdate }: { submission: Submission; onUpdate: () => void; }) => {
    const [pageCount, setPageCount] = React.useState(submission.pageCount || '');
    const [isSaving, setIsSaving] = React.useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        const submissionRef = doc(db, 'submissions', submission.id);
        try {
            await updateDoc(submissionRef, { pageCount: Number(pageCount) || null });
            toast({ title: 'Page Count Updated' });
            onUpdate();
        } catch (e) {
            toast({ title: 'Error', description: 'Could not update page count.', variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto px-2 py-1"><Edit className="w-3 h-3" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Edit Page Count</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="page-count">Pages</Label>
                    <Input id="page-count" type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const { toast } = useToast();
  const [availableReviewers, setAvailableReviewers] = React.useState<UserProfile[]>([]);
  const { user, userProfile } = useAuth();
  const [refetchTrigger, setRefetchTrigger] = React.useState(0);
  const [isAuthorEditing, setIsAuthorEditing] = React.useState(false);
  const router = useRouter();


  const isEditor = userProfile?.role === 'Editor' || userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor';
  const isAuthor = userProfile?.uid === submission?.author.id;
  const isReviewer = submission?.reviewerIds?.includes(user?.uid || '');

  React.useEffect(() => {
    const fetchReviewers = async () => {
        if (!isEditor) return;
        try {
            const q = query(
                collection(db, 'users'), 
                where('role', 'in', ['Reviewer', 'Editor', 'Admin', 'Managing Editor'])
            );
            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
            setAvailableReviewers(users);
        } catch (error) {
            console.error("Error fetching reviewers:", error);
            // This error is handled gracefully by not showing the assign reviewer button
        }
    }
    fetchReviewers();
  }, [isEditor]);

  const fetchSubmission = React.useCallback(async () => {
    if (!id) return;
    try {
        const docRef = doc(db, 'submissions', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            setSubmission({
                id: docSnap.id,
                ...data,
                submittedAt: data.submittedAt ? data.submittedAt.toDate() : new Date(),
            } as Submission);
        } else {
            notFound();
        }
    } catch (error) {
        console.error("Error fetching submission: ", error);
        notFound();
    } finally {
        setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    setLoading(true);
    fetchSubmission();
  }, [fetchSubmission, refetchTrigger]);


  const handleDecision = async (status: SubmissionStatus) => {
    if(!submission || !userProfile || !submission.uniqueId) return;
    setIsUpdating(true);

    const submissionRef = doc(db, 'submissions', submission.id);
    const updateData = { status };

    try {
        await updateDoc(submissionRef, updateData);

        await logSubmissionEvent({
            submissionId: submission.id,
            eventType: 'STATUS_CHANGED',
            context: { actorName: userProfile.displayName, status }
        });

        await generateNotification({
            userId: submission.author.id,
            submissionId: submission.id,
            eventType: 'STATUS_CHANGED',
            context: { status, submissionTitle: submission.title }
        });
        
        await sendDecisionEmail({
            authorEmail: submission.author.email,
            authorName: submission.author.name,
            manuscriptTitle: submission.title,
            submissionId: submission.id,
            uniqueId: submission.uniqueId,
            decision: status,
        });

        toast({
            title: "Status Updated",
            description: `Submission marked as ${status}. The author has been notified by email.`,
        });

        setRefetchTrigger(prev => prev + 1); // Trigger refetch
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
          path: submissionRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsUpdating(false);
    }
  }
  
  const handleDeleteSubmission = async () => {
    if (!submission) return;

    try {
        await runTransaction(db, async (transaction) => {
            const submissionRef = doc(db, 'submissions', submission.id);
            
            // Inefficient, but required by data model. Find and remove from volume.
            const volumesQuery = query(collection(db, 'volumes'));
            const volumesSnapshot = await getDocs(volumesQuery);
            for (const volDoc of volumesSnapshot.docs) {
                const volume = volDoc.data() as Volume;
                let volumeUpdated = false;
                const updatedIssues = volume.issues?.map(issue => {
                    const articleIndex = issue.articles?.findIndex(a => a.id === submission.id);
                    if (articleIndex !== -1 && issue.articles) {
                        issue.articles.splice(articleIndex, 1);
                        volumeUpdated = true;
                    }
                    return issue;
                });
                if (volumeUpdated) {
                    transaction.update(doc(db, 'volumes', volDoc.id), { issues: updatedIssues });
                    break; 
                }
            }
            // Delete submission
            transaction.delete(submissionRef);
        });

        toast({ title: "Submission Deleted", description: "The submission has been permanently removed." });
        router.push('/dashboard/author');
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: `submissions/${submission.id}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };

  const handleAssignReviewer = async (reviewer: UserProfile) => {
      if(!submission || !userProfile) return;

      if (submission.reviewerIds?.includes(reviewer.uid)) {
          toast({
              title: "Already Assigned",
              description: `${reviewer.displayName} is already a reviewer for this manuscript.`,
              variant: "destructive",
          });
          return;
      }
      
      setIsUpdating(true);

      const submissionRef = doc(db, 'submissions', submission.id);
      
      const newReviewer = {
          id: reviewer.uid,
          name: reviewer.displayName,
          status: 'Pending' as const,
      };

      const updateData: any = {
          reviewers: arrayUnion(newReviewer),
          reviewerIds: arrayUnion(reviewer.uid),
      };

      if (submission.status === 'Submitted' || submission.status === 'Under Initial Review' || submission.status === 'With Editor') {
          updateData.status = 'Under Peer Review';
      }

      try {
        await updateDoc(submissionRef, updateData);

        // Fire-and-forget background tasks
        logSubmissionEvent({
            submissionId: submission.id,
            eventType: 'REVIEWER_ASSIGNED',
            context: { reviewerName: reviewer.displayName, actorName: userProfile.displayName }
        }).catch(e => console.error("Failed to log event:", e));
        
        generateNotification({
            userId: reviewer.uid,
            submissionId: submission.id,
            eventType: 'REVIEWER_ASSIGNED',
            context: { submissionTitle: submission.title }
        }).catch(e => console.error("Failed to generate in-app notification:", e));

        sendReviewerAssignmentEmail({
            reviewerEmail: reviewer.email,
            reviewerName: reviewer.displayName,
            manuscriptTitle: submission.title,
            submissionId: submission.id,
        }).catch(e => console.error("Failed to send assignment email:", e));

        if (updateData.status) {
             logSubmissionEvent({
                submissionId: submission.id,
                eventType: 'STATUS_CHANGED',
                context: { actorName: userProfile.displayName, status: updateData.status }
            }).catch(e => console.error("Failed to log status change:", e));

            generateNotification({
                userId: submission.author.id,
                submissionId: submission.id,
                eventType: 'STATUS_CHANGED',
                context: { status: updateData.status, submissionTitle: submission.title }
            }).catch(e => console.error("Failed to generate status change notification:", e));
        }
        
        toast({
            title: "Reviewer Assigned",
            description: `${reviewer.displayName} has been assigned and notified.`,
        });

        setRefetchTrigger(prev => prev + 1);
      } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: submissionRef.path,
                operation: 'update',
                requestResourceData: { 
                    reviewers: `(arrayUnion with ${reviewer.displayName})`, 
                    reviewerIds: `(arrayUnion with ${reviewer.uid})`,
                    status: 'Under Peer Review'
                }
            });
            errorEmitter.emit('permission-error', permissionError);
      } finally {
             setIsUpdating(false);
      }
  }

  const handleAssignId = async () => {
    if (!submission) return;
    setIsUpdating(true);
    try {
        const newId = await getNextSubmissionId();
        const submissionRef = doc(db, 'submissions', submission.id);
        
        await runTransaction(db, async (transaction) => {
            // Update submission doc
            transaction.update(submissionRef, { uniqueId: newId });

            // Update volume doc if it exists
            const volumesQuery = query(collection(db, 'volumes'));
            const volumesSnapshot = await getDocs(volumesQuery);
            for (const volDoc of volumesSnapshot.docs) {
                const volume = volDoc.data() as Volume;
                let volumeUpdated = false;
                const updatedIssues = volume.issues?.map(issue => {
                    const articleIndex = issue.articles?.findIndex(a => a.id === submission.id);
                    if (articleIndex !== -1 && issue.articles) {
                        issue.articles[articleIndex].uniqueId = newId;
                        volumeUpdated = true;
                    }
                    return issue;
                });
                if (volumeUpdated) {
                    transaction.update(doc(db, 'volumes', volDoc.id), { issues: updatedIssues });
                    break;
                }
            }
        });

        toast({ title: "Unique ID Assigned", description: `Assigned ID: ${newId}` });
        setRefetchTrigger(prev => prev + 1);
    } catch (e) {
        console.error("Error assigning unique ID:", e);
        toast({ title: "Error", description: "Could not assign a unique ID.", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleRevisionSubmit = () => {
    setRefetchTrigger(prev => prev + 1);
  }
  
  const handleEditorFileUpload = async (url: string, name?: string) => {
    if (!submission) return;
    setIsUpdating(true);

    const newAttachment = {
        url,
        name: name || url.split('/').pop() || 'Uploaded File',
        uploadedAt: serverTimestamp(),
    };

    const submissionRef = doc(db, 'submissions', submission.id);
    const updateData = {
        editorAttachments: arrayUnion(newAttachment)
    };

    try {
        await updateDoc(submissionRef, updateData);
        toast({ title: "File Uploaded", description: "The file has been attached and is visible to the author." });
        setRefetchTrigger(p => p + 1); // refetch
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: submissionRef.path,
            operation: 'update',
            requestResourceData: { editorAttachments: '(arrayUnion)' }
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsUpdating(false);
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) return names[0][0] + names[names.length - 1][0];
    return name.substring(0, 2);
  }

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!submission) {
    return notFound();
  }

  const isDecisionMade = submission.status === 'Accepted' || submission.status === 'Rejected';
  const needsRevision = submission.status === 'Minor Revision' || submission.status === 'Major Revision' || submission.status === 'Awaiting Revision: Similarity Issues';
  const canAuthorEdit = isAuthor && !isDecisionMade;
  const canAuthorDelete = isAuthor && submission.status === 'Submitted';

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8 min-w-0">
        <Card>
            {isAuthorEditing ? (
                 <CardContent className="p-6">
                    <AuthorEditForm 
                        submission={submission}
                        onUpdate={() => {
                            setIsAuthorEditing(false);
                            setRefetchTrigger(p => p+1);
                        }}
                        onCancel={() => setIsAuthorEditing(false)}
                    />
                 </CardContent>
            ) : (
                <>
                <CardHeader>
                    <div className="flex items-center justify-between">
                    <Badge variant={getStatusVariant(submission.status)} className={cn("w-fit mb-2")}>
                        {submission.status}
                    </Badge>
                    {submission.uniqueId && (
                        <p className="text-sm font-mono text-muted-foreground">{submission.uniqueId}</p>
                    )}
                    </div>
                    <CardTitle className="font-headline text-3xl break-words min-w-0">{submission.title}</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-x-4 gap-y-2 pt-2">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{submission.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Submitted on {format(submission.submittedAt, 'PPP')}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2 font-headline">Abstract</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words min-w-0">{submission.abstract}</p>
                    <Separator className="my-6" />
                    <h3 className="font-semibold mb-2 font-headline">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                        {submission.keywords && submission.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean).map(keyword => (
                            <Badge key={keyword} variant="secondary">{keyword}</Badge>
                        ))}
                    </div>
                    <Separator className="my-6" />
                    <div className="space-y-1">
                         <div className="font-semibold mb-2 font-headline flex items-center gap-2">
                            <span>Page Count</span>
                            {isEditor && <PageCountDialog submission={submission} onUpdate={() => setRefetchTrigger(p => p+1)} />}
                         </div>
                        {submission.pageCount ? <p className="text-sm text-muted-foreground">{submission.pageCount} pages</p> : <p className="text-sm text-muted-foreground italic">Not set.</p>}
                    </div>
                </CardContent>
                </>
            )}

          <CardFooter className="flex-wrap gap-2 justify-between">
             <div className="flex-wrap gap-2 flex">
                {submission.originalManuscriptUrl && submission.manuscriptUrl && (
                    <>
                        <Button variant="outline" asChild>
                            <Link href={submission.originalManuscriptUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Download Original Manuscript
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={submission.manuscriptUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Download Revised Manuscript
                            </Link>
                        </Button>
                    </>
                )}
                {(!submission.originalManuscriptUrl && submission.manuscriptUrl) && (
                    <Button variant="outline" asChild>
                        <Link href={submission.manuscriptUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download Manuscript
                        </Link>
                    </Button>
                )}
                 {submission.supplementaryFileUrl && (
                    <Button variant="outline" asChild>
                        <Link href={submission.supplementaryFileUrl} target="_blank" rel="noopener noreferrer">
                            <Paperclip className="mr-2 h-4 w-4" />
                            Download Supplementary File
                        </Link>
                    </Button>
                )}
            </div>
            {canAuthorEdit && !isAuthorEditing && (
                <Button variant="secondary" onClick={() => setIsAuthorEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            )}
          </CardFooter>
        </Card>

        {isAuthor && submission.editorAttachments && submission.editorAttachments.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Editor's Attachments</CardTitle>
                    <CardDescription>Files provided by the editor for your review.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {submission.editorAttachments.map((file, index) => (
                            <li key={index} className="flex items-center justify-between text-sm p-3 border rounded-md bg-secondary/50">
                                <div className="flex items-center gap-3">
                                    <Paperclip className="h-4 w-4" />
                                    <span>{file.name}</span>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={file.url} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        )}

        {isReviewer && <ReviewSubmissionForm submission={submission} onReviewSubmit={handleRevisionSubmit} />}
        
        {(isEditor || (isAuthor && (needsRevision))) && <SubmittedReviews submissionId={submission.id} showForAuthor={isAuthor} />}

        {isAuthor && needsRevision && <AuthorRevisionForm submission={submission} onRevisionSubmit={handleRevisionSubmit} />}

      </div>

      <div className="space-y-8 lg:col-span-1">
        
        {isEditor && !submission.uniqueId && submission.status === 'Accepted' && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center gap-2"><Info /> Missing Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">This published article is missing a unique publication ID.</p>
                    <Button onClick={handleAssignId} disabled={isUpdating}>
                        {isUpdating ? 'Assigning...' : 'Assign Publication ID'}
                    </Button>
                </CardContent>
            </Card>
        )}

        {isEditor && !isDecisionMade && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Make Final Decision</CardTitle>
            <CardDescription>This will override the current status and notify the author.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision('Accepted')} disabled={isUpdating}>Accept</Button>
            <Button variant="secondary" onClick={() => handleDecision('Minor Revision')} disabled={isUpdating}>Request Minor Revision</Button>
            <Button variant="secondary" onClick={() => handleDecision('Major Revision')} disabled={isUpdating}>Request Major Revision</Button>
            <Button variant="destructive" onClick={() => handleDecision('Rejected')} disabled={isUpdating}>Reject</Button>
          </CardContent>
        </Card>
        )}
        
        {isEditor && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Editor Attachments</CardTitle>
                    <CardDescription>Upload files for the author (e.g., annotated manuscript, revision notes).</CardDescription>
                </CardHeader>
                <CardContent>
                    {submission.editorAttachments && submission.editorAttachments.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <h4 className="text-sm font-medium">Uploaded Files</h4>
                            <ul className="space-y-2">
                                {submission.editorAttachments.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between text-sm p-2 border rounded-md">
                                        <span className="truncate">{file.name}</span>
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={file.url} target="_blank">Download</Link>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <FileUploader
                        endpoint="documentUploader"
                        onUploadComplete={handleEditorFileUpload}
                        onUploadError={(err) => toast({ title: "Upload Failed", description: err.message, variant: "destructive"})}
                        description="Upload files for the author (.doc, .docx)."
                    />
                </CardContent>
            </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Assigned Reviewers</CardTitle>
          </CardHeader>
          <CardContent>
             {submission.reviewers && submission.reviewers.length > 0 ? (
                <ul className="space-y-4">
                    {submission.reviewers.map((reviewer, index) => {
                        const isSubmitted = reviewer.status === 'Review Submitted';
                        const displayName = isEditor ? reviewer.name : `Reviewer ${index + 1}`;
                        
                        return (
                         <li key={reviewer.id} className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                                <Avatar>
                                    {isEditor ? <AvatarImage src={availableReviewers.find(r => r.uid === reviewer.id)?.photoURL || ''} alt={reviewer.name} /> : null}
                                    <AvatarFallback>{isEditor ? getInitials(reviewer.name) : `R${index+1}`}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{displayName}</p>
                                    <div className={cn("flex items-center gap-1.5 text-xs", isSubmitted ? "text-green-600" : "text-muted-foreground")}>
                                      {isSubmitted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                      <span>{reviewer.status}</span>
                                    </div>
                                </div>
                            </div>
                         </li>
                    )})}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No reviewers assigned yet.</p>
            )}
          </CardContent>
          {isEditor && !isDecisionMade && (
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={isUpdating}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Assign Reviewer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Assign Reviewer</DialogTitle>
                  <DialogDescription>
                    Select a qualified user to review this manuscript.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {availableReviewers.map(reviewer => (
                      <li key={reviewer.uid} className='flex justify-between items-center p-3 rounded-lg border hover:bg-secondary/50'>
                         <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={reviewer.photoURL || ''} alt={reviewer.displayName || 'Reviewer'} />
                                <AvatarFallback>{getInitials(reviewer.displayName || 'R')}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{reviewer.displayName}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-48">{reviewer.specialization || 'No specialization listed'}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleAssignReviewer(reviewer)} disabled={isUpdating || submission.reviewerIds?.includes(reviewer.uid)}>
                          <PlusCircle className='h-5 w-5' />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
          )}
        </Card>
        
        {canAuthorDelete && (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground mb-4">Deleting a submission is permanent and cannot be undone.</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Submission
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete your submission &quot;{submission.title}&quot;. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSubmission}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        )}

        <SubmissionHistory submissionId={id} />
      </div>
    </div>
  );
}
