
'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, runTransaction, getDocs, query, where, writeBatch } from 'firebase/firestore';
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
import { User, Calendar, PlusCircle, Download, BookText, Edit, MessageSquare, Shield, Clock, CheckCircle2, Info, Paperclip, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { SubmissionStatus, Submission, UserProfile } from '@/types';
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
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { logSubmissionEvent } from '@/ai/flows/log-submission-event';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileUploader } from '@/components/file-uploader';
import { generateNotification } from '@/ai/flows/generate-notification';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sendReviewerInvitationEmail } from '@/ai/flows/send-reviewer-invitation-email';
import { sendAttachmentNotificationEmail } from '@/ai/flows/send-attachment-notification-email';

const inviteReviewerSchema = z.object({
    name: z.string().min(2, 'Reviewer name is required.'),
    email: z.string().email('A valid email is required.'),
});

const editSubmissionSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters long.'),
    abstract: z.string().min(50, 'Abstract must be at least 50 characters long.'),
});

function getStatusVariant(status: SubmissionStatus) {
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
}

function DetailPageSkeleton() {
    return (
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
                    <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
                <Card><CardHeader><Skeleton className="h-20 w-full" /></CardHeader></Card>
            </div>
        </div>
    );
}

function ReviewSubmissionForm({ submission, onReviewSubmit }: { submission: Submission, onReviewSubmit: () => void }) {
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
            reviewerName: userProfile?.displayName || 'Anonymous Reviewer',
            recommendation,
            commentsForEditor,
            commentsForAuthor,
            submittedAt: serverTimestamp(),
            attachmentUrl,
            attachmentName,
        };

        const submissionRef = doc(db, 'submissions', submission.id);
        const reviewRef = collection(db, 'submissions', submission.id, 'reviews');

        addDoc(reviewRef, reviewData)
            .then(async () => {
                const updatedReviewers = submission.reviewers?.map(r => 
                    r.id === user?.uid ? { ...r, status: 'Review Submitted' as const } : r
                );
                await updateDoc(submissionRef, { reviewers: updatedReviewers });

                await logSubmissionEvent({
                    submissionId: submission.id,
                    eventType: 'REVIEW_SUBMITTED',
                    context: { reviewerName: userProfile?.displayName || 'A reviewer' }
                });
                
                await generateNotification({
                    userId: 'Admins',
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
                
                toast({ title: "Review Submitted", description: "The editor has been notified." });
                onReviewSubmit();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: reviewRef.path,
                    operation: 'create',
                    requestResourceData: reviewData
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    return (
        <Card id="review-form">
            <CardHeader>
                <CardTitle className="font-headline">Submit Review Report</CardTitle>
                <CardDescription>Provide your expert recommendation and feedback.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Recommendation</label>
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
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Confidential Comments for Editor
                        </label>
                        <Textarea 
                            value={commentsForEditor}
                            onChange={(e) => setCommentsForEditor(e.target.value)}
                            placeholder="Private feedback for the editorial board." 
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                           <MessageSquare className="w-4 h-4" />
                           Comments for Author
                        </label>
                        <Textarea 
                             value={commentsForAuthor}
                            onChange={(e) => setCommentsForAuthor(e.target.value)}
                            placeholder="Anonymized feedback shared with the authors." 
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
                            description="Upload annotated files (.doc, .docx)."
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

function AuthorRevisionForm({ submission, onRevisionSubmit }: { submission: Submission, onRevisionSubmit: () => void }) {
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
                    userId: 'Admins',
                    submissionId: submission.id,
                    eventType: 'REVISION_SUBMITTED',
                    context: {
                        submissionTitle: submission.title,
                        authorName: userProfile?.displayName || 'the author'
                    }
                });

                toast({ title: "Revision Submitted", description: "Your updated manuscript has been sent." });
                onRevisionSubmit();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: submissionRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Submit Revised Manuscript</CardTitle>
                <CardDescription>Upload your updated research file based on reviewer feedback.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <FileUploader 
                        endpoint="documentUploader" 
                        onUploadComplete={handleFileUploadComplete} 
                        onUploadError={(err) => toast({ title: "Upload Error", description: err.message, variant: "destructive"})}
                        description="Upload revised manuscript (.doc, .docx)."
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
}

function AuthorEditForm({ submission, onUpdate, onCancel }: { submission: Submission; onUpdate: () => void; onCancel: () => void }) {
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

        updateDoc(submissionRef, updateData)
            .then(() => {
                toast({ title: 'Submission Updated' });
                onUpdate();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: submissionRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="abstract" render={({ field }) => (
                    <FormItem><FormLabel>Abstract</FormLabel><FormControl><Textarea {...field} className="min-h-[150px]" /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
                </div>
            </form>
        </Form>
    );
}

function PageCountDialog({ submission, onUpdate }: { submission: Submission; onUpdate: () => void; }) {
    const [pageCount, setPageCount] = React.useState(submission.pageCount?.toString() || '');
    const [isSaving, setIsSaving] = React.useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        const submissionRef = doc(db, 'submissions', submission.id);
        const updateData = { pageCount: Number(pageCount) || null };
        updateDoc(submissionRef, updateData)
            .then(() => {
                toast({ title: 'Page Count Updated' });
                onUpdate();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: submissionRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSaving(false);
            });
    }

    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-auto px-2 py-1"><Edit className="w-3 h-3" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader><DialogTitle>Edit Page Count</DialogTitle></DialogHeader>
                <div className="py-4"><Label htmlFor="page-count">Pages</Label><Input id="page-count" type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} /></div>
                <DialogFooter><Button onClick={handleSave} disabled={isSaving}>Save</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

async function getNextSubmissionId(): Promise<string> {
    const counterRef = doc(db, 'settings', 'submissionCounter');
    const year = new Date().getFullYear().toString().slice(-2);

    const newCount = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists() || !counterDoc.data().counts || !counterDoc.data().counts[year]) {
            const initialCounts = counterDoc.exists() ? counterDoc.data().counts || {} : {};
            initialCounts[year] = 1;
            transaction.set(counterRef, { counts: initialCounts }, { merge: true });
            return 1;
        } else {
            const currentCount = counterDoc.data().counts[year];
            const nextCount = currentCount + 1;
            const nextCounts = { ...counterDoc.data().counts, [year]: nextCount };
            transaction.update(counterRef, { counts: nextCounts });
            return nextCount;
        }
    });

    const paddedCount = newCount.toString().padStart(3, '0');
    return `MJSTEM-S-${year}-${paddedCount}`;
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

  const inviteForm = useForm<z.infer<typeof inviteReviewerSchema>>({
    resolver: zodResolver(inviteReviewerSchema),
    defaultValues: { name: '', email: ''},
  });

  const isEditor = userProfile?.role === 'Editor' || userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor';
  const isAuthor = userProfile?.uid === submission?.author.id;
  const isReviewer = submission?.reviewerIds?.includes(user?.uid || '');

  React.useEffect(() => {
    const fetchReviewers = () => {
        if (!isEditor) return;
        const usersRef = collection(db, 'users');
        getDocs(query(usersRef))
            .then((querySnapshot) => {
                const list = querySnapshot.docs
                    .map(doc => doc.data() as UserProfile)
                    .filter(u => ['Reviewer', 'Editor', 'Admin', 'Managing Editor'].includes(u.role));
                setAvailableReviewers(list);
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: usersRef.path,
                    operation: 'list',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    }
    fetchReviewers();
  }, [isEditor]);

  const fetchSubmission = React.useCallback(async () => {
    if (!id) return;
    const docRef = doc(db, 'submissions', id);
    getDoc(docRef)
        .then((docSnap) => {
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
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setLoading(false);
        });
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
    
    updateDoc(submissionRef, updateData)
        .then(async () => {
            await logSubmissionEvent({ submissionId: submission.id, eventType: 'STATUS_CHANGED', context: { actorName: userProfile.displayName, status } });
            await generateNotification({ userId: submission.author.id, submissionId: submission.id, eventType: 'STATUS_CHANGED', context: { status, submissionTitle: submission.title } });
            await sendDecisionEmail({ authorEmail: submission.author.email, authorName: submission.author.name, manuscriptTitle: submission.title, submissionId: submission.id, uniqueId: submission.uniqueId, decision: status });
            toast({ title: "Status Updated", description: `Author notified.` });
            setRefetchTrigger(prev => prev + 1);
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({ path: submissionRef.path, operation: 'update', requestResourceData: updateData } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsUpdating(false);
        });
  }
  
  const handleDeleteSubmission = async () => {
    if (!submission) return;
    const submissionRef = doc(db, 'submissions', submission.id);
    runTransaction(db, async (transaction) => {
        transaction.delete(submissionRef);
    })
    .then(() => {
        toast({ title: "Deleted" });
        router.push('/dashboard/author');
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: submissionRef.path, operation: 'delete' } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleAssignReviewer = async (reviewer: UserProfile) => {
      if(!submission || !userProfile) return;
      if (submission.reviewers?.some(r => r.id === reviewer.uid)) {
          toast({ title: "Already Assigned", variant: "destructive" });
          return;
      }
      setIsUpdating(true);
      const submissionRef = doc(db, 'submissions', submission.id);
      const newReviewer = { id: reviewer.uid, name: reviewer.displayName, email: reviewer.email, status: 'Pending' as const };
      const updateData: any = { reviewers: arrayUnion(newReviewer), reviewerIds: arrayUnion(reviewer.uid) };
      if (['Submitted', 'Under Initial Review', 'With Editor'].includes(submission.status)) {
          updateData.status = 'Under Peer Review';
      }
      
      updateDoc(submissionRef, updateData)
        .then(async () => {
            logSubmissionEvent({ submissionId: submission.id, eventType: 'REVIEWER_ASSIGNED', context: { reviewerName: reviewer.displayName, actorName: userProfile.displayName } });
            generateNotification({ userId: reviewer.uid, submissionId: submission.id, eventType: 'REVIEWER_ASSIGNED', context: { submissionTitle: submission.title } });
            sendReviewerAssignmentEmail({ reviewerEmail: reviewer.email, reviewerName: reviewer.displayName, manuscriptTitle: submission.title, submissionId: submission.id });
            toast({ title: "Reviewer Assigned" });
            setRefetchTrigger(prev => prev + 1);
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({ path: submissionRef.path, operation: 'update', requestResourceData: updateData } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => { setIsUpdating(false); });
  }

  const handleInviteReviewer = async (values: z.infer<typeof inviteReviewerSchema>) => {
    if(!submission || !userProfile) return;
    const emailNorm = values.email.toLowerCase().trim();
    
    if (submission.invitedReviewerEmails?.includes(emailNorm)) {
        toast({ title: "Already Invited", variant: "destructive" });
        return;
    }
    setIsUpdating(true);

    const inviteData = {
        submissionId: submission.id,
        emailNorm: emailNorm,
        invitedBy: userProfile.uid,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
    };

    const invitesRef = collection(db, 'reviewInvitations');
    const submissionRef = doc(db, 'submissions', submission.id);

    addDoc(invitesRef, inviteData)
        .then(async () => {
            const newReviewer = { id: null, name: values.name, email: values.email, status: 'Invited' as const };
            const updateData: any = { reviewers: arrayUnion(newReviewer), invitedReviewerEmails: arrayUnion(emailNorm) };
            if (['Submitted', 'Under Initial Review', 'With Editor'].includes(submission.status)) {
                updateData.status = 'Under Peer Review';
            }
            await updateDoc(submissionRef, updateData);
            await logSubmissionEvent({ submissionId: submission.id, eventType: 'REVIEWER_INVITED', context: { reviewerName: values.name, reviewerEmail: values.email, actorName: userProfile.displayName } });
            await sendReviewerInvitationEmail({ reviewerEmail: values.email, reviewerName: values.name, manuscriptTitle: submission.title, submissionId: submission.id });
            toast({ title: "Invitation Sent" });
            inviteForm.reset();
            setRefetchTrigger(prev => prev + 1);
        })
        .catch(async (serverError) => { 
            const permissionError = new FirestorePermissionError({ path: invitesRef.path, operation: 'create', requestResourceData: inviteData } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => { setIsUpdating(false); });
  }

  const handleRemoveReviewer = async (reviewer: { id: string | null, email: string }) => {
    if (!submission || !userProfile) return;
    setIsUpdating(true);
    
    const submissionRef = doc(db, 'submissions', submission.id);
    const emailNorm = (reviewer.email || '').toLowerCase().trim();

    try {
        const batch = writeBatch(db);

        // 1. Update submission doc: Filter out the reviewer
        const updatedReviewers = submission.reviewers?.filter(r => 
            !(r.email.toLowerCase().trim() === emailNorm)
        ) || [];
        
        const updatedReviewerIds = submission.reviewerIds?.filter(id => id !== reviewer.id) || [];
        const updatedInvitedEmails = submission.invitedReviewerEmails?.filter(e => e.toLowerCase().trim() !== emailNorm) || [];

        batch.update(submissionRef, {
            reviewers: updatedReviewers,
            reviewerIds: updatedReviewerIds,
            invitedReviewerEmails: updatedInvitedEmails
        });

        // 2. Revoke pending invitation if it exists
        const invitesQuery = query(
            collection(db, 'reviewInvitations'),
            where('submissionId', '==', submission.id),
            where('emailNorm', '==', emailNorm),
            where('status', '==', 'pending')
        );
        const inviteSnapshot = await getDocs(invitesQuery);
        inviteSnapshot.forEach(inviteDoc => {
            batch.update(inviteDoc.ref, { 
                status: 'revoked',
                revokedAt: serverTimestamp(),
                revokedBy: userProfile.uid
            });
        });

        batch.commit()
            .then(async () => {
                await logSubmissionEvent({
                    submissionId: submission.id,
                    eventType: 'STATUS_CHANGED',
                    context: { 
                        actorName: userProfile.displayName, 
                        status: `Reviewer Removed (${reviewer.email})` 
                    }
                });

                toast({ title: "Reviewer Removed" });
                setRefetchTrigger(prev => prev + 1);
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: `submissions/${submission.id} or reviewInvitations`,
                    operation: 'write',
                    requestResourceData: { action: 'remove_reviewer', email: emailNorm }
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
            
    } catch (error) {
        console.error("Error preparing batch:", error);
        toast({ title: "Error", description: "Could not initiate removal.", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  }

  const handleAssignId = async () => {
    if (!submission) return;
    setIsUpdating(true);
    const submissionRef = doc(db, 'submissions', submission.id);
    try {
        const newId = await getNextSubmissionId();
        await updateDoc(submissionRef, { uniqueId: newId });
        toast({ title: "ID Assigned", description: newId });
        setRefetchTrigger(prev => prev + 1);
    } catch (e) { 
        toast({ title: "Error", variant: "destructive" }); 
    }
    finally { setIsUpdating(false); }
  };

  const handleEditorFileUpload = async (url: string, name?: string) => {
    if (!submission || !userProfile) return;
    setIsUpdating(true);
    const newAttachment = { url, name: name || 'Uploaded File', uploadedAt: new Date() };
    const submissionRef = doc(db, 'submissions', submission.id);
    
    updateDoc(submissionRef, { editorAttachments: arrayUnion(newAttachment) })
        .then(async () => {
            toast({ title: "File Shared with Author" });
            sendAttachmentNotificationEmail({ authorEmail: submission.author.email, authorName: submission.author.name, editorName: userProfile.displayName, submissionId: submission.id, manuscriptTitle: submission.title, fileName: newAttachment.name });
            setRefetchTrigger(p => p + 1);
        })
        .catch(async (serverError) => { 
            const permissionError = new FirestorePermissionError({ path: submissionRef.path, operation: 'update', requestResourceData: { editorAttachments: 'arrayUnion(...)' } } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError); 
        })
        .finally(() => { setIsUpdating(false); });
  }

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? names[0][0] + names[names.length - 1][0] : name.substring(0, 2);
  }

  if (loading) return <DetailPageSkeleton />;
  if (!submission) return notFound();

  const isDecisionMade = ['Accepted', 'Rejected'].includes(submission.status);
  const needsRevision = ['Minor Revision', 'Major Revision', 'Awaiting Revision: Similarity Issues'].includes(submission.status);
  const canAuthorEdit = isAuthor && !isDecisionMade;
  const canAuthorDelete = isAuthor && submission.status === 'Submitted';

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8 min-w-0">
        <Card>
            {isAuthorEditing ? (
                 <CardContent className="p-6">
                    <AuthorEditForm submission={submission} onUpdate={() => { setIsAuthorEditing(false); setRefetchTrigger(p => p+1); }} onCancel={() => setIsAuthorEditing(false)} />
                 </CardContent>
            ) : (
                <>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Badge variant={getStatusVariant(submission.status)} className="mb-2">{submission.status}</Badge>
                        {submission.uniqueId && <p className="text-sm font-mono text-muted-foreground">{submission.uniqueId}</p>}
                    </div>
                    <CardTitle className="font-headline text-3xl break-words">{submission.title}</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-x-4 gap-y-2 pt-2">
                        <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>{submission.author.name}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Submitted on {format(submission.submittedAt, 'PPP')}</span></div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2 font-headline">Abstract</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">{submission.abstract}</p>
                    <Separator className="my-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold mb-2 font-headline">Keywords</h3>
                            <div className="flex flex-wrap gap-2">
                                {submission.keywords?.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                                    <Badge key={k} variant="secondary">{k}</Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold mb-2 font-headline flex items-center gap-2">
                                <span>Page Count</span>
                                {isEditor && <PageCountDialog submission={submission} onUpdate={() => setRefetchTrigger(p => p+1)} />}
                            </div>
                            {submission.pageCount ? <p className="text-sm text-muted-foreground">{submission.pageCount} pages</p> : <p className="text-sm text-muted-foreground italic">Not set.</p>}
                        </div>
                    </div>
                    {submission.supplementaryFileUrl && (
                        <div className="mt-8 p-4 bg-secondary/30 border rounded-lg">
                            <h3 className="font-semibold mb-2 font-headline flex items-center gap-2"><Paperclip className="w-4 h-4" /> Supplementary Data</h3>
                            <p className="text-sm text-muted-foreground mb-4">Supporting datasets or additional materials provided by the author.</p>
                            <Button variant="outline" asChild size="sm">
                                <Link href={submission.supplementaryFileUrl} target="_blank"><Download className="mr-2 h-4 w-4" /> Download Material</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
                </>
            )}
          <CardFooter className="flex-wrap gap-2 justify-between">
             <div className="flex-wrap gap-2 flex">
                <Button asChild><Link href={`https://docs.google.com/gview?url=${submission.manuscriptUrl}&embedded=true`} target="_blank"><BookText className="mr-2 h-4 w-4" /> Read Online</Link></Button>
                {submission.manuscriptUrl && <Button variant="outline" asChild><Link href={submission.manuscriptUrl} target="_blank"><Download className="mr-2 h-4 w-4" /> Download Manuscript</Link></Button>}
            </div>
            {canAuthorEdit && !isAuthorEditing && <Button variant="secondary" onClick={() => setIsAuthorEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit Details</Button>}
          </CardFooter>
        </Card>

        {isReviewer && <ReviewSubmissionForm submission={submission} onReviewSubmit={() => setRefetchTrigger(p => p + 1)} />}
        {(isEditor || (isAuthor && needsRevision)) && <SubmittedReviews submissionId={submission.id} showForAuthor={isAuthor} />}
        {isAuthor && needsRevision && <AuthorRevisionForm submission={submission} onRevisionSubmit={() => setRefetchTrigger(p => p + 1)} />}
      </div>

      <div className="space-y-8 lg:col-span-1">
        {isEditor && !submission.uniqueId && submission.status === 'Accepted' && (
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
                <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><Info /> Assignment Needed</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Published articles require a unique MJSTEM ID.</p>
                    <Button onClick={handleAssignId} disabled={isUpdating} className="w-full">Assign Publication ID</Button>
                </CardContent>
            </Card>
        )}

        {isEditor && !isDecisionMade && (
        <Card>
          <CardHeader><CardTitle className="font-headline">Editorial Decision</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision('Accepted')} disabled={isUpdating}>Accept</Button>
            <Button variant="secondary" onClick={() => handleDecision('Minor Revision')} disabled={isUpdating}>Minor Revision</Button>
            <Button variant="secondary" onClick={() => handleDecision('Major Revision')} disabled={isUpdating}>Major Revision</Button>
            <Button variant="destructive" onClick={() => handleDecision('Rejected')} disabled={isUpdating}>Reject</Button>
          </CardContent>
        </Card>
        )}
        
        {isEditor && (
            <Card>
                <CardHeader><CardTitle className="font-headline">Editor Attachments</CardTitle></CardHeader>
                <CardContent>
                    <FileUploader endpoint="generalDocumentUploader" onUploadComplete={handleEditorFileUpload} onUploadError={(err) => toast({ title: "Upload Failed", variant: "destructive"})} description="Share files with authors." />
                </CardContent>
            </Card>
        )}
        
        <Card>
          <CardHeader><CardTitle className="font-headline">Peer Reviewers</CardTitle></CardHeader>
          <CardContent>
             {submission.reviewers?.length ? (
                <ul className="space-y-4">
                    {submission.reviewers.map((r, i) => (
                         <li key={r.id || r.email} className="flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                                <Avatar><AvatarFallback>{isEditor ? getInitials(r.name) : `Reviewer ${i+1}`}</AvatarFallback></Avatar>
                                <div>
                                    <p className="font-medium text-sm">{isEditor ? r.name : `Reviewer ${i+1}`}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      {r.status === 'Review Submitted' ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Clock className="w-3 h-3" />}
                                      <span>{r.status}</span>
                                    </div>
                                </div>
                            </div>
                            {isEditor && !isDecisionMade && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Reviewer Assignment?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will remove <strong>{r.name}</strong> from this submission and revoke any pending invitations. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemoveReviewer({ id: r.id, email: r.email })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove Reviewer</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                         </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No assignments yet.</p>}
          </CardContent>
          {isEditor && !isDecisionMade && (
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild><Button variant="outline" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Assign Reviewer</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Assign or Invite</DialogTitle></DialogHeader>
                 <Tabs defaultValue="existing" className="w-full">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="existing">Search Users</TabsTrigger><TabsTrigger value="invite">By Email</TabsTrigger></TabsList>
                    <TabsContent value="existing" className="pt-4 max-h-80 overflow-y-auto">
                        {availableReviewers.map(r => (
                            <div key={r.uid} className='flex justify-between items-center p-2 border-b last:border-0'>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(r.displayName)}</AvatarFallback></Avatar>
                                    <div className="text-xs">
                                        <p className="font-bold">{r.displayName}</p>
                                        <p className="text-muted-foreground line-clamp-1">{r.specialization || 'General'}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleAssignReviewer(r)}><PlusCircle className='h-4 w-4' /></Button>
                            </div>
                        ))}
                    </TabsContent>
                    <TabsContent value="invite" className="pt-4">
                        <Form {...inviteForm}>
                            <form onSubmit={inviteForm.handleSubmit(handleInviteReviewer)} className="space-y-4">
                                <FormField control={inviteForm.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Reviewer Name</FormLabel><FormControl><Input placeholder="Dr. Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={inviteForm.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Reviewer Email</FormLabel><FormControl><Input type="email" placeholder="invite@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <DialogFooter><Button type="submit" disabled={isUpdating}>Send Invite</Button></DialogFooter>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </CardFooter>
          )}
        </Card>
        
        {canAuthorDelete && (
             <Card className="border-destructive">
                <CardHeader><CardTitle className="font-headline text-lg text-destructive">Withdraw</CardTitle></CardHeader>
                <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" className="w-full">Delete Submission</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently withdraw and delete your submission.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSubmission}>Delete</AlertDialogAction></AlertDialogFooter>
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
