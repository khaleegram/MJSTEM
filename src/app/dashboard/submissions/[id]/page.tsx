
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
import { User, Calendar, PlusCircle, Download, BookOpen, BookText, Edit, MessageSquare, Shield, Clock, CheckCircle2, Info, Paperclip, Trash2 } from 'lucide-react';
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
import { FirestorePermissionError } from '@/firebase/errors';
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
import { sendReviewerAssignmentEmail } from '@/ai/flows/send-reviewer-assignment-email';
import { sendDecisionEmail } from '@/ai/flows/send-decision-email';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sendReviewerInvitationEmail } from '@/ai/flows/send-reviewer-invitation-email';
import { sendAttachmentNotificationEmail } from '@/ai/flows/send-attachment-notification-email';
import { sendWorkflowNotificationEmail } from '@/ai/flows/send-workflow-notification-email';
import { extractDocxPageCount } from '@/ai/flows/extract-docx-page-count';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

function normalizeFirestoreDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') {
        const date = value.toDate();
        return date instanceof Date && !isNaN(date.getTime()) ? date : null;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function getOnlineReaderUrl(url: string): string {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
}

function toRound(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) return 0;
    return parsed;
}

function formatRoundLabel(round: number): string {
    return round > 0 ? `R${round}` : 'Initial';
}

type RevisionDocumentCategory =
    | 'revised_manuscript_clean'
    | 'response_to_reviewers'
    | 'tracked_changes'
    | 'supplementary'
    | 'figure_table'
    | 'ethics'
    | 'cover_letter'
    | 'additional';

type UploadedRevisionFile = {
    url: string;
    fileName: string;
};

type RevisionExtraDocDraft = {
    id: string;
    category: RevisionDocumentCategory;
    label: string;
    url: string;
    fileName: string;
    visibleToReviewers: boolean;
    uploaderKey: number;
};

const REVISION_DOC_CATEGORY_LABELS: Record<RevisionDocumentCategory, string> = {
    revised_manuscript_clean: 'Revised Manuscript (Clean)',
    response_to_reviewers: 'Response to Reviewers',
    tracked_changes: 'Tracked Changes Manuscript',
    supplementary: 'Supplementary Material',
    figure_table: 'Figures/Tables',
    ethics: 'Ethics/Data/Consent Document',
    cover_letter: 'Cover Letter to Editor',
    additional: 'Additional Document',
};

const EXTRA_REVISION_DOC_OPTIONS: Array<{
    value: RevisionDocumentCategory;
    label: string;
}> = [
    { value: 'additional', label: 'Additional Document' },
    { value: 'supplementary', label: 'Supplementary Material' },
    { value: 'figure_table', label: 'Figures/Tables' },
    { value: 'ethics', label: 'Ethics/Data/Consent' },
    { value: 'cover_letter', label: 'Cover Letter to Editor' },
];

function getRevisionDocumentLabel(category: RevisionDocumentCategory): string {
    return REVISION_DOC_CATEGORY_LABELS[category];
}

function normalizeRevisionCategory(value: unknown): RevisionDocumentCategory {
    if (typeof value !== 'string') return 'additional';
    return value in REVISION_DOC_CATEGORY_LABELS
        ? (value as RevisionDocumentCategory)
        : 'additional';
}

function createRevisionDraftId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createExtraRevisionDocDraft(): RevisionExtraDocDraft {
    return {
        id: createRevisionDraftId('revision-doc'),
        category: 'additional',
        label: '',
        url: '',
        fileName: '',
        visibleToReviewers: true,
        uploaderKey: 0,
    };
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
    const [reviewId, setReviewId] = React.useState<string | null>(null);
    const [recommendation, setRecommendation] = React.useState('');
    const [commentsForEditor, setCommentsForEditor] = React.useState('');
    const [commentsForAuthor, setCommentsForAuthor] = React.useState('');
    const [attachmentUrl, setAttachmentUrl] = React.useState('');
    const [attachmentName, setAttachmentName] = React.useState('');
    const [isEditing, setIsEditing] = React.useState(false);

    const userEmail = user?.email?.toLowerCase().trim();
    const myReviewAssignment = submission.reviewers?.find(r => 
        r.id === user?.uid || (userEmail && r.email?.toLowerCase().trim() === userEmail)
    );
    const currentReviewRound = toRound(submission.revision);

    React.useEffect(() => {
        if (!user || !submission.id) return;

        let cancelled = false;
        setReviewId(null);
        setRecommendation('');
        setCommentsForEditor('');
        setCommentsForAuthor('');
        setAttachmentUrl('');
        setAttachmentName('');

        const loadExistingReview = async () => {
            try {
                const token = await user.getIdToken(true);
                const response = await fetch(`/api/submissions/${submission.id}/reviews?scope=mine&round=${currentReviewRound}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload?.error || 'Failed to load your existing review.');
                }

                const myReviews = Array.isArray(payload?.reviews) ? payload.reviews : [];
                if (myReviews.length === 0 || cancelled) return;

                const existingReview = myReviews[0];
                setReviewId(existingReview.id || null);
                setRecommendation(existingReview.recommendation || '');
                setCommentsForEditor(existingReview.commentsForEditor || '');
                setCommentsForAuthor(existingReview.commentsForAuthor || '');
                setAttachmentUrl(existingReview.attachmentUrl || '');
                setAttachmentName(existingReview.attachmentName || '');
            } catch (err) {
                console.error("Error fetching existing review:", err);
            }
        };

        loadExistingReview();

        return () => {
            cancelled = true;
        };
    }, [user?.uid, submission.id, currentReviewRound]);

    if (!myReviewAssignment || myReviewAssignment.status === 'Invited') {
        return null;
    }

    const isSubmitted = !!reviewId;

    if (isSubmitted && !isEditing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Review Submitted - Round {formatRoundLabel(currentReviewRound)}</CardTitle>
                    <CardDescription>You have already submitted feedback for this round. You can update it if needed.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Your Review</Button>
                </CardFooter>
            </Card>
        );
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
            round: currentReviewRound,
            recommendation,
            commentsForEditor,
            commentsForAuthor,
            submittedAt: serverTimestamp(),
            attachmentUrl,
            attachmentName,
        };

        const submissionRef = doc(db, 'submissions', submission.id);
        
        if (reviewId) {
            const reviewRef = doc(db, 'submissions', submission.id, 'reviews', reviewId);
            try {
                await updateDoc(reviewRef, reviewData);
                const updatedReviewers = submission.reviewers?.map(r => {
                    const isMe = r.id === user?.uid || (userEmail && r.email?.toLowerCase().trim() === userEmail);
                    return isMe
                        ? {
                            ...r,
                            id: user?.uid,
                            status: 'Review Submitted' as const,
                            lastReviewedRound: currentReviewRound,
                            lastReviewedAt: new Date(),
                        }
                        : r;
                });
                if (updatedReviewers) {
                    await updateDoc(submissionRef, { reviewers: updatedReviewers });
                }
            } catch (serverError: any) {
            console.error('[Revision] Error submitting revision:', serverError);
            toast({
                title: 'Error submitting revision',
                description: serverError?.message || 'An unknown error occurred while submitting.',
                variant: 'destructive'
            });
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: reviewRef.path,
                    operation: 'update',
                    requestResourceData: reviewData
                }));
                setIsSubmitting(false);
                return;
            }

            try {
                await logSubmissionEvent({
                    submissionId: submission.id,
                    eventType: 'REVIEW_SUBMITTED',
                    context: { reviewerName: userProfile?.displayName || 'A reviewer', action: `updated (${formatRoundLabel(currentReviewRound)})` }
                });
                await sendWorkflowNotificationEmail({
                    event: 'REVIEW_UPDATED',
                    submissionId: submission.id,
                    manuscriptTitle: submission.title,
                    actorName: userProfile?.displayName || 'A reviewer',
                    round: currentReviewRound,
                    recommendation,
                });
            } catch (error) {
                console.error('[Review] Post-update side effects failed:', error);
            }

            toast({ 
                title: "Review Updated Successfully!", 
                description: "Your changes have been saved and the editor has been updated.",
                className: "bg-green-600 text-white border-none"
            });
            setIsEditing(false);
            onReviewSubmit();
            setIsSubmitting(false);
        } else {
            const reviewsCollectionRef = collection(db, 'submissions', submission.id, 'reviews');
            try {
                const createdReviewRef = await addDoc(reviewsCollectionRef, reviewData);
                setReviewId(createdReviewRef.id);
                const updatedReviewers = submission.reviewers?.map(r => {
                    const isMe = r.id === user?.uid || (userEmail && r.email?.toLowerCase().trim() === userEmail);
                    return isMe
                        ? {
                            ...r,
                            id: user?.uid,
                            status: 'Review Submitted' as const,
                            lastReviewedRound: currentReviewRound,
                            lastReviewedAt: new Date(),
                        }
                        : r;
                });
                await updateDoc(submissionRef, { reviewers: updatedReviewers });
            } catch (serverError: any) {
            console.error('[Revision] Error submitting revision:', serverError);
            toast({
                title: 'Error submitting revision',
                description: serverError?.message || 'An unknown error occurred while submitting.',
                variant: 'destructive'
            });
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: reviewsCollectionRef.path,
                    operation: 'create',
                    requestResourceData: reviewData
                }));
                setIsSubmitting(false);
                return;
            }

            try {
                await logSubmissionEvent({
                    submissionId: submission.id,
                    eventType: 'REVIEW_SUBMITTED',
                    context: { reviewerName: userProfile?.displayName || 'A reviewer', round: formatRoundLabel(currentReviewRound) }
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
                await sendWorkflowNotificationEmail({
                    event: 'REVIEW_SUBMITTED',
                    submissionId: submission.id,
                    manuscriptTitle: submission.title,
                    actorName: userProfile?.displayName || 'A reviewer',
                    round: currentReviewRound,
                    recommendation,
                });
            } catch (error) {
                console.error('[Review] Post-submit side effects failed:', error);
            }
            
            toast({ 
                title: "Done! Review Submitted", 
                description: `Your expert report for ${formatRoundLabel(currentReviewRound)} has been received. Thank you for your contribution.`,
                className: "bg-green-600 text-white border-none"
            });
            onReviewSubmit();
            setIsSubmitting(false);
        }
    }

    return (
        <Card id="review-form">
            <CardHeader>
                <CardTitle className="font-headline">{reviewId ? `Update Your Review (${formatRoundLabel(currentReviewRound)})` : `Submit Review Report (${formatRoundLabel(currentReviewRound)})`}</CardTitle>
                <CardDescription>Provide your expert recommendation and feedback for this review round.</CardDescription>
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
                <CardFooter className="gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : reviewId ? 'Update Review' : 'Submit Report'}
                    </Button>
                    {isEditing && (
                        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}

function AcceptInvitationCard({ submission, onAccept }: { submission: Submission, onAccept: () => void }) {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [isAccepting, setIsAccepting] = React.useState(false);

    const handleAccept = async () => {
        if (!user || !userProfile) return;
        setIsAccepting(true);
        const emailNorm = user.email?.toLowerCase().trim();
        const submissionRef = doc(db, 'submissions', submission.id);

        try {
            await runTransaction(db, async (transaction) => {
                const subSnap = await transaction.get(submissionRef);
                if (!subSnap.exists()) throw new Error("Submission not found.");

                const data = subSnap.data() as Submission;
                const updatedReviewers = data.reviewers?.map(r => {
                    if (r.email?.toLowerCase().trim() === emailNorm) {
                        return { ...r, id: user.uid, status: 'Pending' as const };
                    }
                    return r;
                }) || [];

                transaction.update(submissionRef, {
                    reviewers: updatedReviewers,
                    reviewerIds: arrayUnion(user.uid),
                    invitedReviewerEmails: data.invitedReviewerEmails?.filter(e => e.toLowerCase().trim() !== emailNorm) || []
                });
            });

            await logSubmissionEvent({
                submissionId: submission.id,
                eventType: 'STATUS_CHANGED',
                context: { actorName: userProfile.displayName, status: 'Review Invitation Accepted' }
            });
            await sendWorkflowNotificationEmail({
                event: 'REVIEWER_INVITATION_ACCEPTED',
                submissionId: submission.id,
                manuscriptTitle: submission.title,
                actorName: userProfile.displayName,
            });

            toast({ 
                title: "Invitation Accepted!", 
                description: "You can now access the full manuscript and submit your review.",
                className: "bg-green-600 text-white border-none"
            });
            onAccept();
        } catch (error: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: submissionRef.path,
                operation: 'write',
                requestResourceData: { action: 'accept_invitation' }
            }));
        } finally {
            setIsAccepting(false);
        }
    }

    return (
        <Card className="border-primary bg-primary/5">
            <CardHeader>
                <CardTitle className="font-headline">Review Invitation</CardTitle>
                <CardDescription>You have been invited to review this manuscript. Please accept the invitation to proceed.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
                    {isAccepting ? 'Accepting...' : 'Accept Review Assignment'}
                </Button>
            </CardFooter>
        </Card>
    );
}

function AuthorRevisionForm({ submission, onRevisionSubmit }: { submission: Submission, onRevisionSubmit: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [cleanManuscript, setCleanManuscript] = React.useState<UploadedRevisionFile | null>(null);
    const [responseToReviewers, setResponseToReviewers] = React.useState<UploadedRevisionFile | null>(null);
    const [trackedChanges, setTrackedChanges] = React.useState<UploadedRevisionFile | null>(null);
    const [extraDocs, setExtraDocs] = React.useState<RevisionExtraDocDraft[]>([createExtraRevisionDocDraft()]);
    const [formResetSeed, setFormResetSeed] = React.useState(0);
    const { userProfile } = useAuth();
    
    const updateExtraDoc = React.useCallback((docId: string, patch: Partial<RevisionExtraDocDraft>) => {
        setExtraDocs((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, ...patch } : doc)));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cleanManuscript || !responseToReviewers) {
            toast({
                title: "Required Files Missing",
                description: "Upload both Revised Manuscript (Clean) and Response to Reviewers before submitting.",
                variant: "destructive"
            });
            return;
        }

        const populatedExtraDocs = extraDocs.filter((doc) => !!doc.url);
        const unlabeledExtraDoc = populatedExtraDocs.find((doc) => doc.label.trim().length === 0);
        if (unlabeledExtraDoc) {
            toast({
                title: "Missing Document Label",
                description: "Please give each uploaded additional document a clear label.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        let detectedPageCount: number | null = null;
        try {
            detectedPageCount = await extractDocxPageCount({ fileUrl: cleanManuscript.url });
        } catch (error) {
            console.warn('[Revision] Could not auto-detect page count:', error);
        }
        
        const currentRevision = submission.revision || 0;
        const newRevision = currentRevision + 1;
        const submissionRef = doc(db, 'submissions', submission.id);
        const newStatus: SubmissionStatus = newRevision >= 2 ? 'Under Review-R2' : 'Under Review-R1';
        const now = new Date();

        const packageDocuments = [
            {
                category: 'revised_manuscript_clean' as const,
                label: getRevisionDocumentLabel('revised_manuscript_clean'),
                url: cleanManuscript.url,
                fileName: cleanManuscript.fileName || getRevisionDocumentLabel('revised_manuscript_clean'),
                required: true,
                visibleToReviewers: true,
            },
            {
                category: 'response_to_reviewers' as const,
                label: getRevisionDocumentLabel('response_to_reviewers'),
                url: responseToReviewers.url,
                fileName: responseToReviewers.fileName || getRevisionDocumentLabel('response_to_reviewers'),
                required: true,
                visibleToReviewers: true,
            },
            ...(trackedChanges ? [{
                category: 'tracked_changes' as const,
                label: getRevisionDocumentLabel('tracked_changes'),
                url: trackedChanges.url,
                fileName: trackedChanges.fileName || getRevisionDocumentLabel('tracked_changes'),
                required: false,
                visibleToReviewers: true,
            }] : []),
            ...populatedExtraDocs.map((doc) => ({
                category: doc.category,
                label: doc.label.trim(),
                url: doc.url,
                fileName: doc.fileName || doc.label.trim() || getRevisionDocumentLabel(doc.category),
                required: false,
                visibleToReviewers: doc.visibleToReviewers,
            })),
        ].map((document, index) => ({
            ...document,
            id: `r${newRevision}-d${index + 1}`,
            uploadedAt: now,
        }));

        const revisionPackage = {
            round: newRevision,
            status: 'submitted' as const,
            submittedAt: now,
            submittedBy: {
                id: userProfile?.uid || submission.author.id,
                name: userProfile?.displayName || submission.author.name,
                email: userProfile?.email || submission.author.email,
            },
            documents: packageDocuments,
        };
        
        const updateData: any = {
            manuscriptUrl: cleanManuscript.url,
            status: newStatus,
            revision: newRevision,
            revisionManuscripts: arrayUnion({
                revision: newRevision,
                url: cleanManuscript.url,
                uploadedAt: now,
            }),
            revisionPackages: arrayUnion(revisionPackage),
        };
        if (typeof detectedPageCount === 'number' && detectedPageCount > 0) {
            updateData.pageCount = detectedPageCount;
        }

        if (!submission.originalManuscriptUrl) {
            updateData.originalManuscriptUrl = submission.manuscriptUrl;
        }

        try {
            await updateDoc(submissionRef, updateData);
        } catch (serverError) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: submissionRef.path,
                operation: 'update',
                requestResourceData: updateData
            }));
            setIsSubmitting(false);
            return;
        }

        try {
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
                    authorName: userProfile?.displayName || 'the author',
                    filesCount: packageDocuments.length,
                }
            });
            await sendWorkflowNotificationEmail({
                event: 'REVISION_SUBMITTED',
                submissionId: submission.id,
                manuscriptTitle: submission.title,
                actorName: userProfile?.displayName || 'Author',
                round: newRevision,
            });
        } catch (error) {
            console.error('[Revision] Post-submit side effects failed:', error);
        }

        toast({ 
            title: "Revision Package Submitted",
            description: `Submitted Round R${newRevision} with ${packageDocuments.length} document(s).`,
            className: "bg-green-600 text-white border-none"
        });
        setCleanManuscript(null);
        setResponseToReviewers(null);
        setTrackedChanges(null);
        setExtraDocs([createExtraRevisionDocDraft()]);
        setFormResetSeed((prev) => prev + 1);
        onRevisionSubmit();
        setIsSubmitting(false);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Submit Revision Package</CardTitle>
                <CardDescription>
                    Round-based revision package: required files plus any additional supporting documents.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="rounded-md border bg-secondary/20 p-4 space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm">Required Documents</h4>
                            <p className="text-xs text-muted-foreground">Both files are mandatory to submit this revision round.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Revised Manuscript (Clean) *</Label>
                            <FileUploader
                                key={`clean-${formResetSeed}`}
                                endpoint="documentUploader"
                                onUploadComplete={(url, name) =>
                                    setCleanManuscript(url ? { url, fileName: name || getRevisionDocumentLabel('revised_manuscript_clean') } : null)
                                }
                                onUploadError={(err) => toast({ title: "Upload Error", description: err.message, variant: "destructive" })}
                                description="Upload revised manuscript clean version (.doc, .docx)."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Response to Reviewers *</Label>
                            <FileUploader
                                key={`response-${formResetSeed}`}
                                endpoint="generalDocumentUploader"
                                onUploadComplete={(url, name) =>
                                    setResponseToReviewers(url ? { url, fileName: name || getRevisionDocumentLabel('response_to_reviewers') } : null)
                                }
                                onUploadError={(err) => toast({ title: "Upload Error", description: err.message, variant: "destructive" })}
                                description="Upload response letter (.pdf, .doc, .docx, .txt)."
                            />
                        </div>
                    </div>

                    <div className="rounded-md border p-4 space-y-3">
                        <div>
                            <h4 className="font-semibold text-sm">Optional Reviewer-Facing File</h4>
                            <p className="text-xs text-muted-foreground">Add tracked changes manuscript if available.</p>
                        </div>
                        <FileUploader
                            key={`tracked-${formResetSeed}`}
                            endpoint="documentUploader"
                            onUploadComplete={(url, name) =>
                                setTrackedChanges(url ? { url, fileName: name || getRevisionDocumentLabel('tracked_changes') } : null)
                            }
                            onUploadError={(err) => toast({ title: "Upload Error", description: err.message, variant: "destructive" })}
                            description="Upload tracked changes manuscript (.doc, .docx)."
                        />
                    </div>

                    <div className="rounded-md border p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h4 className="font-semibold text-sm">Additional Documents</h4>
                                <p className="text-xs text-muted-foreground">Add as many additional documents as needed for this round.</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setExtraDocs((prev) => [...prev, createExtraRevisionDocDraft()])}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Document
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {extraDocs.map((extraDoc, index) => (
                                <div key={extraDoc.id} className="rounded-md border bg-background/80 p-3 space-y-3">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <div className="w-full md:w-[200px]">
                                            <Label className="text-xs">Type</Label>
                                            <Select
                                                value={extraDoc.category}
                                                onValueChange={(value) => {
                                                    const category = value as RevisionDocumentCategory;
                                                    updateExtraDoc(extraDoc.id, {
                                                        category,
                                                        label: extraDoc.label.trim().length ? extraDoc.label : getRevisionDocumentLabel(category),
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EXTRA_REVISION_DOC_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1 min-w-[220px]">
                                            <Label className="text-xs">Label</Label>
                                            <Input
                                                value={extraDoc.label}
                                                onChange={(event) => updateExtraDoc(extraDoc.id, { label: event.target.value })}
                                                placeholder={`Document ${index + 1} label`}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <label className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={extraDoc.visibleToReviewers}
                                                    onChange={(event) => updateExtraDoc(extraDoc.id, { visibleToReviewers: event.target.checked })}
                                                />
                                                Visible to reviewers
                                            </label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setExtraDocs((prev) => prev.filter((doc) => doc.id !== extraDoc.id))}
                                                disabled={extraDocs.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <FileUploader
                                        key={`extra-${extraDoc.id}-${extraDoc.uploaderKey}-${formResetSeed}`}
                                        endpoint="generalDocumentUploader"
                                        onUploadComplete={(url, name) =>
                                            updateExtraDoc(extraDoc.id, {
                                                url: url || '',
                                                fileName: name || '',
                                            })
                                        }
                                        onUploadError={(err) => toast({ title: "Upload Error", description: err.message, variant: "destructive" })}
                                        description="Upload supporting document (.pdf, .doc, .docx, .txt, .rtf, .ppt, .pptx)."
                                    />
                                    {extraDoc.url && (
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" asChild>
                                                <Link href={getOnlineReaderUrl(extraDoc.url)} target="_blank" rel="noopener noreferrer">
                                                    <BookText className="mr-2 h-4 w-4" />
                                                    Read Online
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={extraDoc.url} target="_blank">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download {extraDoc.fileName || extraDoc.label || 'Document'}
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {(cleanManuscript || responseToReviewers || trackedChanges) && (
                        <div className="rounded-lg border bg-secondary/30 p-4 space-y-2">
                            <h4 className="font-semibold text-sm">Ready for Submission</h4>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>Clean manuscript: {cleanManuscript ? 'Uploaded' : 'Missing'}</p>
                                <p>Response to reviewers: {responseToReviewers ? 'Uploaded' : 'Missing'}</p>
                                {trackedChanges && <p>Tracked changes: Uploaded</p>}
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting || !cleanManuscript || !responseToReviewers}>
                        {isSubmitting ? 'Submitting...' : 'Submit Revision Package'}
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
                toast({ 
                    title: "Done! Changes Saved", 
                    description: "Manuscript details have been updated successfully.",
                    className: "bg-green-600 text-white border-none"
                });
                onUpdate();
            })
            .catch(async (serverError) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: submissionRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
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
                toast({ 
                    title: "Done! Page count updated", 
                    className: "bg-green-600 text-white border-none"
                });
                onUpdate();
            })
            .catch(async (serverError) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: submissionRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
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
  const [showRevisionReplaceUploader, setShowRevisionReplaceUploader] = React.useState(false);
  const [revisionReplacementUrl, setRevisionReplacementUrl] = React.useState('');
  const [revisionReplaceUploaderKey, setRevisionReplaceUploaderKey] = React.useState(0);
  const [isReplacingRevision, setIsReplacingRevision] = React.useState(false);
  const [editorAttachmentVisibleToReviewers, setEditorAttachmentVisibleToReviewers] = React.useState(false);
  const router = useRouter();

  const inviteForm = useForm<z.infer<typeof inviteReviewerSchema>>({
    resolver: zodResolver(inviteReviewerSchema),
    defaultValues: { name: '', email: ''},
  });

  const isEditor = userProfile?.role === 'Editor' || userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor';
  const isEIC = userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor';
  const userEmail = user?.email?.toLowerCase().trim();
  const reviewerEntries = Array.isArray(submission?.reviewers) ? submission.reviewers : [];
  
  const isAuthor = userProfile?.uid === submission?.author.id || 
                   (userEmail && submission?.author.email && userEmail === submission.author.email.toLowerCase().trim());

  const myReviewerEntry = reviewerEntries.find((reviewer) => {
    const reviewerId = typeof reviewer?.id === 'string' ? reviewer.id : '';
    const reviewerEmail = typeof reviewer?.email === 'string' ? reviewer.email.toLowerCase().trim() : '';
    return reviewerId === (user?.uid || '') || (!!userEmail && reviewerEmail === userEmail);
  });
  
  const isReviewer = !!(
    submission?.reviewerIds?.includes(user?.uid || '') ||
    (userEmail && submission?.invitedReviewerEmails?.some(e => e.toLowerCase().trim() === userEmail)) ||
    myReviewerEntry
  );

  const needsToAcceptInvite = isReviewer &&
    !submission?.reviewerIds?.includes(user?.uid || '') &&
    myReviewerEntry?.status === 'Invited';

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
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: usersRef.path,
                    operation: 'list',
                }));
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
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            }));
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
    if(!submission || !userProfile) return;
    setIsUpdating(true);
    const submissionRef = doc(db, 'submissions', submission.id);
    const updateData = { status };

    try {
        await updateDoc(submissionRef, updateData);
    } catch (serverError) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: submissionRef.path, operation: 'update', requestResourceData: updateData }));
        setIsUpdating(false);
        return;
    }

    let sideEffectsFailed = false;
    try {
        await logSubmissionEvent({ submissionId: submission.id, eventType: 'STATUS_CHANGED', context: { actorName: userProfile.displayName, status } });
        await generateNotification({ userId: submission.author.id, submissionId: submission.id, eventType: 'STATUS_CHANGED', context: { status, submissionTitle: submission.title } });
        await sendDecisionEmail({ authorEmail: submission.author.email, authorName: submission.author.name, manuscriptTitle: submission.title, submissionId: submission.id, uniqueId: submission.uniqueId || submission.id, decision: status });
    } catch (error) {
        sideEffectsFailed = true;
        console.error('[Decision] Post-update side effects failed:', error);
    }

    toast({ 
        title: "Decision Recorded!", 
        description: sideEffectsFailed
            ? `Status changed to '${status}', but some notifications/emails could not be sent.`
            : `Author has been notified of the '${status}' status.`,
        className: "bg-green-600 text-white border-none"
    });
    setRefetchTrigger(prev => prev + 1);
    setIsUpdating(false);
  }

  const handleReplaceRevisedManuscript = async () => {
    if (!submission || !userProfile || !revisionReplacementUrl || (!isAuthor && !isEditor)) return;
    setIsReplacingRevision(true);

    let detectedPageCount: number | null = null;
    try {
        detectedPageCount = await extractDocxPageCount({ fileUrl: revisionReplacementUrl });
    } catch (error) {
        console.warn('[Revision Replace] Could not auto-detect page count:', error);
    }

    const submissionRef = doc(db, 'submissions', submission.id);
    const updateData: Record<string, unknown> = {
        manuscriptUrl: revisionReplacementUrl,
        revisionManuscripts: arrayUnion({
            revision: Math.max(submission.revision ?? 1, 1),
            url: revisionReplacementUrl,
            uploadedAt: new Date(),
            replaced: true,
        }),
    };
    if (typeof detectedPageCount === 'number' && detectedPageCount > 0) {
        updateData.pageCount = detectedPageCount;
    }

    if (!submission.originalManuscriptUrl) {
        updateData.originalManuscriptUrl = submission.manuscriptUrl;
    }

    try {
        await updateDoc(submissionRef, updateData);
    } catch (serverError) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: submissionRef.path,
            operation: 'update',
            requestResourceData: updateData
        }));
        setIsReplacingRevision(false);
        return;
    }

    try {
        await logSubmissionEvent({
            submissionId: submission.id,
            eventType: 'STATUS_CHANGED',
            context: {
                actorName: userProfile.displayName,
                status: 'Revised Manuscript File Replaced'
            }
        });
        await sendWorkflowNotificationEmail({
            event: 'REVISION_REPLACED',
            submissionId: submission.id,
            manuscriptTitle: submission.title,
            actorName: userProfile.displayName,
            round: Math.max(submission.revision ?? 1, 1),
        });
    } catch (error) {
        console.error('[Revision Replace] Post-update side effects failed:', error);
    }

    toast({
        title: "Revised Manuscript Updated",
        description: "The revised manuscript file has been replaced successfully.",
        className: "bg-green-600 text-white border-none"
    });

    setShowRevisionReplaceUploader(false);
    setRevisionReplacementUrl('');
    setRevisionReplaceUploaderKey(v => v + 1);
    setRefetchTrigger(prev => prev + 1);
    setIsReplacingRevision(false);
  }
  
  const handleDeleteSubmission = async () => {
    if (!submission) return;
    const submissionRef = doc(db, 'submissions', submission.id);
    runTransaction(db, async (transaction) => {
        transaction.delete(submissionRef);
    })
    .then(() => {
        toast({ 
            title: "Submission Withdrawn", 
            description: "The manuscript has been permanently removed.",
            className: "bg-red-600 text-white border-none"
        });
        router.push('/dashboard/author');
    })
    .catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: submissionRef.path, operation: 'delete' }));
    });
  };

  const handleAssignSectionEditor = async (editorId: string | null, editorName: string | null) => {
      if (!submission || !isEIC) return;
      setIsUpdating(true);
      const submissionRef = doc(db, 'submissions', submission.id);
      try {
          await updateDoc(submissionRef, { 
              assignedEditorId: editorId,
              assignedEditorName: editorName
          });
          toast({ 
              title: "Editor Assignment Updated", 
              className: "bg-green-600 text-white border-none"
          });
          setRefetchTrigger(prev => prev + 1);
      } catch (error: any) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
          setIsUpdating(false);
      }
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
            toast({ 
                title: "Done! Reviewer Assigned", 
                description: `${reviewer.displayName} has been added.`,
                className: "bg-green-600 text-white border-none"
            });
            setRefetchTrigger(prev => prev + 1);
        })
        .catch(async (serverError) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: submissionRef.path, operation: 'update', requestResourceData: updateData }));
        })
        .finally(() => { setIsUpdating(false); });
  }

  const handleInviteReviewer = async (values: z.infer<typeof inviteReviewerSchema>) => {
    if(!submission || !userProfile) return;
    const emailNorm = values.email.toLowerCase().trim();
    
    setIsUpdating(true);

    try {
        const batch = writeBatch(db);

        const placeholderRef = doc(db, 'users', emailNorm);
        const placeholderSnap = await getDoc(placeholderRef);

        if (!placeholderSnap.exists()) {
            batch.set(placeholderRef, {
                email: emailNorm,
                displayName: values.name,
                role: 'Reviewer',
                isPlaceholder: true,
                createdAt: serverTimestamp(),
            });
        } else {
            if (placeholderSnap.data().role === 'Author') {
                batch.update(placeholderRef, { role: 'Reviewer' });
            }
        }

        const invitesRef = collection(db, 'reviewInvitations');
        const inviteDocRef = doc(invitesRef);
        batch.set(inviteDocRef, {
            submissionId: submission.id,
            emailNorm: emailNorm,
            invitedBy: userProfile.uid,
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        const submissionRef = doc(db, 'submissions', submission.id);
        const newReviewer = { id: null, name: values.name, email: values.email, status: 'Invited' as const };
        const updateData: any = { 
            reviewers: arrayUnion(newReviewer), 
            invitedReviewerEmails: arrayUnion(emailNorm) 
        };
        if (['Submitted', 'Under Initial Review', 'With Editor'].includes(submission.status)) {
            updateData.status = 'Under Peer Review';
        }
        batch.update(submissionRef, updateData);

        await batch.commit();

        await logSubmissionEvent({ submissionId: submission.id, eventType: 'REVIEWER_INVITED', context: { reviewerName: values.name, reviewerEmail: values.email, actorName: userProfile.displayName } });
        await sendReviewerInvitationEmail({ reviewerEmail: values.email, reviewerName: values.name, manuscriptTitle: submission.title, submissionId: submission.id });
        
        toast({ 
            title: "Done! Invitation Sent", 
            description: `Reviewer ${values.name} has been invited.`,
            className: "bg-green-600 text-white border-none"
        });
        inviteForm.reset();
        setRefetchTrigger(prev => prev + 1);

    } catch (error: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users or submissions', operation: 'write', requestResourceData: { email: emailNorm } }));
    } finally {
        setIsUpdating(false);
    }
  }

  const handleRemoveReviewer = async (reviewer: { id: string | null, email: string }) => {
    if (!submission || !userProfile) return;
    setIsUpdating(true);
    
    const submissionRef = doc(db, 'submissions', submission.id);
    const emailNorm = (reviewer.email || '').toLowerCase().trim();

    try {
        const batch = writeBatch(db);

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

        await batch.commit();
        await logSubmissionEvent({ submissionId: submission.id, eventType: 'STATUS_CHANGED', context: { actorName: userProfile.displayName, status: `Reviewer Removed (${reviewer.email})` } });
        toast({ 
            title: "Done! Reviewer Removed", 
            className: "bg-orange-600 text-white border-none"
        });
        setRefetchTrigger(prev => prev + 1);
            
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `submissions/${submission.id} or reviewInvitations`,
            operation: 'write',
            requestResourceData: { action: 'remove_reviewer', email: emailNorm }
        }));
    } finally {
        setIsUpdating(false);
    }
  }

  const handleToggleInPress = async (hidden: boolean) => {
    if (!submission || !isEIC) return;
    setIsUpdating(true);
    const submissionRef = doc(db, 'submissions', submission.id);
    try {
        await updateDoc(submissionRef, { hiddenFromInPress: hidden });
        toast({ 
            title: hidden ? "Article Hidden" : "Article Visible", 
            description: hidden ? "It is removed from Articles in Press." : "It will now appear in Articles in Press.",
            className: "bg-green-600 text-white border-none"
        });
        setRefetchTrigger(prev => prev + 1);
    } catch (error: any) { 
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    finally { setIsUpdating(false); }
  };

  const handleAssignId = async () => {
    if (!submission) return;
    setIsUpdating(true);
    const submissionRef = doc(db, 'submissions', submission.id);
    try {
        const newId = await getNextSubmissionId();
        const updateData = { uniqueId: newId };
        await updateDoc(submissionRef, updateData);
        toast({ 
            title: "Done! ID Assigned", 
            description: `ID: ${newId}`,
            className: "bg-green-600 text-white border-none"
        });
        setRefetchTrigger(prev => prev + 1);
    } catch (error: any) { 
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: submissionRef.path,
            operation: 'update',
            requestResourceData: { action: 'assign_id' }
        }));
    }
    finally { setIsUpdating(false); }
  };

  const handleEditorFileUpload = async (url: string, name?: string) => {
    if (!submission || !userProfile) return;
    if (!url) {
        toast({ title: "Upload Failed", description: "Attachment URL is missing.", variant: "destructive" });
        return;
    }
    setIsUpdating(true);
    const newAttachment = {
        url,
        name: name || 'Uploaded File',
        uploadedAt: new Date(),
        round: toRound(submission.revision),
        visibleToReviewers: editorAttachmentVisibleToReviewers,
        uploadedBy: {
            id: userProfile.uid,
            name: userProfile.displayName,
            email: userProfile.email,
        },
    };
    const submissionRef = doc(db, 'submissions', submission.id);
    const updateData = { editorAttachments: arrayUnion(newAttachment) };
    
    updateDoc(submissionRef, updateData)
        .then(async () => {
            toast({ 
                title: "Done! File Shared", 
                description: `Attachment shared for ${formatRoundLabel(toRound(submission.revision))}.`,
                className: "bg-green-600 text-white border-none"
            });
            await sendAttachmentNotificationEmail({ authorEmail: submission.author.email, authorName: submission.author.name, editorName: userProfile.displayName, submissionId: submission.id, manuscriptTitle: submission.title, fileName: newAttachment.name });
            await sendWorkflowNotificationEmail({
                event: 'EDITOR_ATTACHMENT_SHARED_REVIEWERS',
                submissionId: submission.id,
                manuscriptTitle: submission.title,
                actorName: userProfile.displayName,
                round: toRound(submission.revision),
                fileName: newAttachment.name,
                visibleToReviewers: editorAttachmentVisibleToReviewers,
            });
            setEditorAttachmentVisibleToReviewers(false);
            setRefetchTrigger(p => p + 1);
        })
        .catch(async (serverError) => { 
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: submissionRef.path, operation: 'update', requestResourceData: updateData })); 
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
  const currentSubmissionRound = toRound(submission.revision);
  const rawRevisionPackages = Array.isArray((submission as any).revisionPackages)
    ? ((submission as any).revisionPackages as any[])
    : [];
  const rawRevisionManuscripts = Array.isArray((submission as any).revisionManuscripts)
    ? ((submission as any).revisionManuscripts as any[])
    : [];
  const hasSubmittedRevision =
    rawRevisionPackages.length > 0 ||
    rawRevisionManuscripts.length > 0 ||
    !!submission.originalManuscriptUrl ||
    (submission.revision ?? 0) > 0 ||
    submission.status === 'Under Review-R1' ||
    submission.status === 'Under Review-R2';
  const canViewRevisionContainer = hasSubmittedRevision && (isAuthor || isEditor || isReviewer);
  const hasDistinctOriginalManuscript =
    !!submission.originalManuscriptUrl &&
    submission.originalManuscriptUrl !== submission.manuscriptUrl;
  const revisionManuscriptHistory = (() => {
    const rawHistory = Array.isArray((submission as any).revisionManuscripts)
      ? ((submission as any).revisionManuscripts as any[])
      : [];

    const parsed = rawHistory
      .filter((item) => item && typeof item.url === 'string' && item.url.length > 0)
      .map((item, index) => ({
        id: `${item.url}-${index}`,
        revision: typeof item.revision === 'number' ? item.revision : (submission.revision ?? 1),
        url: item.url as string,
        uploadedAt: normalizeFirestoreDate(item.uploadedAt),
      }));

    if (hasSubmittedRevision && submission.manuscriptUrl && !parsed.some((item) => item.url === submission.manuscriptUrl)) {
      parsed.push({
        id: `latest-${submission.id}`,
        revision: submission.revision ?? 1,
        url: submission.manuscriptUrl,
        uploadedAt: null,
      });
    }

    return parsed.sort((a, b) => {
      if (b.revision !== a.revision) return b.revision - a.revision;
      const bTime = b.uploadedAt ? b.uploadedAt.getTime() : 0;
      const aTime = a.uploadedAt ? a.uploadedAt.getTime() : 0;
      return bTime - aTime;
    });
  })();
  const revisionPackageHistory = (() => {
    const parsed = rawRevisionPackages
      .map((pkg: any, pkgIndex: number) => {
        const round = typeof pkg?.round === 'number' ? pkg.round : pkgIndex + 1;
        const submittedAt = normalizeFirestoreDate(pkg?.submittedAt);
        const docsRaw = Array.isArray(pkg?.documents) ? pkg.documents : [];
        const documents = docsRaw
          .filter((doc: any) => doc && typeof doc.url === 'string' && doc.url.length > 0)
          .map((doc: any, docIndex: number) => {
            const category = normalizeRevisionCategory(doc.category);
            const defaultLabel = getRevisionDocumentLabel(category);
            return {
              id: typeof doc.id === 'string' ? doc.id : `r${round}-d${docIndex + 1}`,
              category,
              label: typeof doc.label === 'string' && doc.label.trim().length > 0 ? doc.label.trim() : defaultLabel,
              url: doc.url as string,
              fileName: typeof doc.fileName === 'string' && doc.fileName.trim().length > 0 ? doc.fileName.trim() : defaultLabel,
              uploadedAt: normalizeFirestoreDate(doc.uploadedAt),
              visibleToReviewers: doc.visibleToReviewers !== false,
              required: doc.required === true,
            };
          });

        return {
          id: `round-${round}-${pkgIndex}`,
          round,
          submittedAt,
          documents,
        };
      })
      .filter((pkg) => pkg.documents.length > 0);

    if (parsed.length > 0) {
      return parsed.sort((a, b) => {
        if (b.round !== a.round) return b.round - a.round;
        const bTime = b.submittedAt ? b.submittedAt.getTime() : 0;
        const aTime = a.submittedAt ? a.submittedAt.getTime() : 0;
        return bTime - aTime;
      });
    }

    return revisionManuscriptHistory.map((entry, index) => ({
      id: `legacy-round-${entry.revision}-${index}`,
      round: entry.revision,
      submittedAt: entry.uploadedAt,
      documents: [
        {
          id: `legacy-doc-${entry.revision}-${index}`,
          category: 'revised_manuscript_clean' as RevisionDocumentCategory,
          label: getRevisionDocumentLabel('revised_manuscript_clean'),
          url: entry.url,
          fileName: `Revision R${entry.revision} Manuscript`,
          uploadedAt: entry.uploadedAt,
          visibleToReviewers: true,
          required: true,
        },
      ],
    }));
  })();

  const visibleRevisionPackageHistory = (() => {
    if (isEditor || isAuthor) return revisionPackageHistory;
    if (!isReviewer) return [];

    return revisionPackageHistory
      .map((pkg) => ({
        ...pkg,
        documents: pkg.documents.filter((doc) => doc.visibleToReviewers),
      }))
      .filter((pkg) => pkg.documents.length > 0);
  })();

  const editorAttachmentHistory = (() => {
    const raw = Array.isArray((submission as any).editorAttachments)
      ? ((submission as any).editorAttachments as any[])
      : [];

    return raw
      .filter((attachment) => attachment && typeof attachment.url === 'string' && attachment.url.length > 0)
      .map((attachment, index) => ({
        id: typeof attachment.id === 'string' ? attachment.id : `editor-attachment-${index}`,
        url: attachment.url as string,
        name:
          typeof attachment.name === 'string' && attachment.name.trim().length > 0
            ? attachment.name.trim()
            : `Attachment ${index + 1}`,
        uploadedAt: normalizeFirestoreDate(attachment.uploadedAt),
        round: toRound(attachment.round),
        visibleToReviewers: attachment.visibleToReviewers === true,
        uploadedBy: attachment.uploadedBy || null,
      }))
      .sort((a, b) => {
        if (b.round !== a.round) return b.round - a.round;
        const bTime = b.uploadedAt ? b.uploadedAt.getTime() : 0;
        const aTime = a.uploadedAt ? a.uploadedAt.getTime() : 0;
        return bTime - aTime;
      });
  })();

  const visibleEditorAttachmentHistory = editorAttachmentHistory.filter((attachment) => {
    if (isEditor || isAuthor) return true;
    if (isReviewer) return attachment.visibleToReviewers;
    return false;
  });

  const editorAttachmentRounds = (() => {
    const grouped = new Map<number, typeof visibleEditorAttachmentHistory>();
    for (const attachment of visibleEditorAttachmentHistory) {
      const existing = grouped.get(attachment.round) ?? [];
      existing.push(attachment);
      grouped.set(attachment.round, existing);
    }
    return Array.from(grouped.entries())
      .map(([round, attachments]) => ({ round, attachments }))
      .sort((a, b) => b.round - a.round);
  })();

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
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" asChild>
                                    <Link href={getOnlineReaderUrl(submission.supplementaryFileUrl)} target="_blank" rel="noopener noreferrer"><BookText className="mr-2 h-4 w-4" /> Read Material</Link>
                                </Button>
                                <Button variant="outline" asChild size="sm">
                                    <Link href={submission.supplementaryFileUrl} target="_blank"><Download className="mr-2 h-4 w-4" /> Download Material</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
                </>
            )}
          <CardFooter className="flex-wrap gap-2 justify-between">
             <div className="flex-wrap gap-2 flex">
                <Button asChild><Link href={getOnlineReaderUrl(submission.manuscriptUrl)} target="_blank"><BookText className="mr-2 h-4 w-4" /> Read Latest Manuscript</Link></Button>
                {submission.manuscriptUrl && <Button variant="outline" asChild><Link href={submission.manuscriptUrl} target="_blank"><Download className="mr-2 h-4 w-4" /> Download Latest Manuscript</Link></Button>}
            </div>
            {canAuthorEdit && !isAuthorEditing && <Button variant="secondary" onClick={() => setIsAuthorEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit Details</Button>}
          </CardFooter>
        </Card>

        {canViewRevisionContainer && (
            <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Revised Manuscript Versions</CardTitle>
                    <CardDescription>
                        The top manuscript buttons are always the latest file. This section tracks revised versions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm">
                            <Link href={getOnlineReaderUrl(submission.manuscriptUrl)} target="_blank">
                                <BookText className="mr-2 h-4 w-4" />
                                Read Revised Manuscript (Latest)
                            </Link>
                        </Button>
                        {hasDistinctOriginalManuscript && (
                            <>
                                <Button variant="secondary" size="sm" asChild>
                                    <Link href={getOnlineReaderUrl(submission.originalManuscriptUrl!)} target="_blank" rel="noopener noreferrer">
                                        <BookText className="mr-2 h-4 w-4" />
                                        Read Original Manuscript
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={submission.originalManuscriptUrl!} target="_blank">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Original Manuscript
                                    </Link>
                                </Button>
                            </>
                        )}
                        {(isAuthor || isEditor) && (
                            <Button
                                type="button"
                                variant={showRevisionReplaceUploader ? "ghost" : "secondary"}
                                size="sm"
                                onClick={() => {
                                    if (showRevisionReplaceUploader) {
                                        setShowRevisionReplaceUploader(false);
                                        setRevisionReplacementUrl('');
                                        setRevisionReplaceUploaderKey(v => v + 1);
                                        return;
                                    }
                                    setShowRevisionReplaceUploader(true);
                                }}
                            >
                                {showRevisionReplaceUploader ? 'Cancel Replace' : 'Replace Revised File'}
                            </Button>
                        )}
                    </div>
                    {visibleRevisionPackageHistory.length > 0 ? (
                        <div className="space-y-3">
                            {visibleRevisionPackageHistory.map((pkg) => (
                                <div key={pkg.id} className="rounded-md border bg-background/70 p-3 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold">Revision Round R{pkg.round}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {pkg.submittedAt ? `Submitted ${format(pkg.submittedAt, 'PPP p')}` : 'Submitted date not recorded'}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{pkg.documents.length} file{pkg.documents.length === 1 ? '' : 's'}</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {pkg.documents.map((doc) => (
                                            <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                                                <div className="text-xs space-y-1">
                                                    <p className="font-medium text-foreground">{doc.label}</p>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                                                        <span>{getRevisionDocumentLabel(doc.category)}</span>
                                                        {doc.required && <span>Required</span>}
                                                        <span>{doc.visibleToReviewers ? 'Visible to reviewers' : 'Editor only'}</span>
                                                        {doc.url === submission.manuscriptUrl && <span>Latest manuscript</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={getOnlineReaderUrl(doc.url)} target="_blank" rel="noopener noreferrer" aria-label={`Read ${doc.label} online`}>
                                                            <BookOpen className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={doc.url} target="_blank">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border bg-background/70 p-3 text-xs text-muted-foreground">
                            No revision package history recorded yet.
                        </div>
                    )}
                </CardContent>
                {showRevisionReplaceUploader && (
                    <CardContent className="pt-0 space-y-3">
                        <div className="rounded-md border p-3 space-y-3">
                            <FileUploader
                                key={revisionReplaceUploaderKey}
                                endpoint="documentUploader"
                                onUploadComplete={(url) => setRevisionReplacementUrl(url || '')}
                                onUploadError={(err) => toast({ title: "Upload Error", description: err.message, variant: "destructive" })}
                                description="Upload new revised or final manuscript (.pdf, .doc, .docx)."
                            />
                            {revisionReplacementUrl && (
                                <div className="flex flex-wrap gap-2">
                                    <Button asChild size="sm">
                                        <Link href={getOnlineReaderUrl(revisionReplacementUrl)} target="_blank">
                                            <BookText className="mr-2 h-4 w-4" />
                                            Read Replacement
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={revisionReplacementUrl} target="_blank">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download Replacement
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleReplaceRevisedManuscript}
                                        disabled={isReplacingRevision}
                                    >
                                        {isReplacingRevision ? 'Saving...' : 'Save Replacement'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
        )}

        {needsToAcceptInvite && (
            <AcceptInvitationCard submission={submission} onAccept={() => setRefetchTrigger(p => p + 1)} />
        )}

        {isReviewer && !needsToAcceptInvite && (
            <ReviewSubmissionForm submission={submission} onReviewSubmit={() => setRefetchTrigger(p => p + 1)} />
        )}

        {(isEditor || (isAuthor && (needsRevision || submission.status.includes('Review'))) || isReviewer) && <SubmittedReviews submissionId={submission.id} showForAuthor={isAuthor} refreshKey={refetchTrigger} />}
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

        {isEIC && submission.status === 'Accepted' && (
            <Card className={(submission as any).hiddenFromInPress ? "border-muted" : "border-primary"}>
                <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><BookText className="w-5 h-5"/> In-Press Visibility</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        {(submission as any).hiddenFromInPress 
                            ? "This article is currently hidden from the public 'Articles in Press' list." 
                            : "This article is currently visible to the public in the 'Articles in Press' list."}
                    </p>
                    <Button 
                        variant={(submission as any).hiddenFromInPress ? "default" : "secondary"} 
                        onClick={() => handleToggleInPress(!(submission as any).hiddenFromInPress)} 
                        disabled={isUpdating} 
                        className="w-full"
                    >
                        {(submission as any).hiddenFromInPress ? "Show in Articles in Press" : "Hide from Articles in Press"}
                    </Button>
                </CardContent>
            </Card>
        )}

        {isEditor && !isDecisionMade && (
        <Card>
          <CardHeader><CardTitle className="font-headline">Editorial Decision</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {isEIC ? (
               <>
                 <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision('Accepted')} disabled={isUpdating}>Accept</Button>
                 <Button variant="secondary" onClick={() => handleDecision('Minor Revision')} disabled={isUpdating}>Minor Revision</Button>
                 <Button variant="secondary" onClick={() => handleDecision('Major Revision')} disabled={isUpdating}>Major Revision</Button>
                 <Button variant="destructive" onClick={() => handleDecision('Rejected')} disabled={isUpdating}>Reject</Button>
               </>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-2">Only the Editor-in-Chief can make the final decision.</p>
            )}
          </CardContent>
        </Card>
        )}
        
        {(isEditor || isAuthor || (isReviewer && visibleEditorAttachmentHistory.length > 0)) && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Editor Attachments (By Round)</CardTitle>
                    <CardDescription>Editorial files are tracked per review round for a complete record.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditor && (
                        <div className="space-y-3 rounded-md border p-3">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={editorAttachmentVisibleToReviewers}
                                    onChange={(event) => setEditorAttachmentVisibleToReviewers(event.target.checked)}
                                />
                                Also visible to reviewers
                            </label>
                            <FileUploader endpoint="generalDocumentUploader" onUploadComplete={handleEditorFileUpload} onUploadError={(err) => toast({ title: "Upload Failed", description: err.message, variant: "destructive"})} description="Share files with authors (and optionally reviewers)." />
                        </div>
                    )}

                    {editorAttachmentRounds.length > 0 ? (
                        <div className="space-y-3">
                            {editorAttachmentRounds.map((roundGroup) => (
                                <div key={`editor-round-${roundGroup.round}`} className="rounded-md border p-3 space-y-2">
                                    <p className="text-sm font-semibold">Round {formatRoundLabel(roundGroup.round)}</p>
                                    <div className="space-y-2">
                                        {roundGroup.attachments.map((attachment) => (
                                            <div key={attachment.id} className="rounded border p-2 space-y-2">
                                                <p className="text-xs font-medium break-words">{attachment.name}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {attachment.uploadedAt ? `Uploaded ${format(attachment.uploadedAt, 'PPP p')}` : 'Upload time not recorded'}
                                                    {attachment.uploadedBy?.name ? ` by ${attachment.uploadedBy.name}` : ''}
                                                    {isReviewer && !isAuthor && !isEditor ? '' : ` - ${attachment.visibleToReviewers ? 'Visible to reviewers' : 'Author/editor only'}`}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button size="sm" asChild>
                                                        <Link href={getOnlineReaderUrl(attachment.url)} target="_blank" rel="noopener noreferrer">
                                                            <BookText className="mr-2 h-4 w-4" />
                                                            Read Online
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={attachment.url} target="_blank" rel="noopener noreferrer">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No editor attachments shared yet.</p>
                    )}
                </CardContent>
            </Card>
        )}
        
        {isEIC && (
        <Card>
          <CardHeader><CardTitle className="font-headline">Assigned Editor</CardTitle></CardHeader>
          <CardContent>
            {(submission as any).assignedEditorName ? (
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback>{getInitials((submission as any).assignedEditorName)}</AvatarFallback></Avatar>
                        <div>
                            <p className="font-medium text-sm">{(submission as any).assignedEditorName}</p>
                            <p className="text-xs text-muted-foreground">Managing this submission</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleAssignSectionEditor(null, null)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No specific editor assigned.</p>
            )}
          </CardContent>
          <CardFooter>
             <Dialog>
              <DialogTrigger asChild><Button variant="outline" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Assign Editor</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Assign an Editor</DialogTitle></DialogHeader>
                <div className="pt-4 max-h-80 overflow-y-auto">
                    {availableReviewers.filter(r => ['Editor', 'Managing Editor', 'Admin'].includes(r.role)).length > 0 ? availableReviewers.filter(r => ['Editor', 'Managing Editor', 'Admin'].includes(r.role)).map(r => (
                        <div key={r.uid} className='flex justify-between items-center p-2 border-b last:border-0'>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(r.displayName)}</AvatarFallback></Avatar>
                                <div className="text-xs">
                                    <p className="font-bold">{r.displayName}</p>
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">{r.role}</Badge>
                                        {r.specialization && <span className="text-muted-foreground line-clamp-1">{r.specialization}</span>}
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleAssignSectionEditor(r.uid, r.displayName)}><PlusCircle className='h-4 w-4' /></Button>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center py-4">No users found with Editor role.</p>}
                </div>
              </DialogContent>
             </Dialog>
          </CardFooter>
        </Card>
        )}
        
        <Card>
          <CardHeader><CardTitle className="font-headline">Peer Reviewers</CardTitle></CardHeader>
          <CardContent>
             {submission.reviewers?.length ? (
                <ul className="space-y-4">
                    {submission.reviewers.map((r, i) => {
                         const reviewerLastRound = toRound((r as any).lastReviewedRound);
                         const reviewerDisplayStatus = r.status === 'Invited'
                            ? 'Invited'
                            : reviewerLastRound >= currentSubmissionRound
                              ? 'Review Submitted'
                              : 'Pending';
                         return (
                         <li key={r.id || r.email} className="flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                                <Avatar><AvatarFallback>{isEditor ? getInitials(r.name) : `Reviewer ${i+1}`}</AvatarFallback></Avatar>
                                <div>
                                    <p className="font-medium text-sm">{isEditor ? r.name : `Reviewer ${i+1}`}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      {reviewerDisplayStatus === 'Review Submitted' ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Clock className="w-3 h-3" />}
                                      <span>
                                        {reviewerDisplayStatus}
                                        {reviewerDisplayStatus === 'Invited' ? '' : ` (${formatRoundLabel(currentSubmissionRound)})`}
                                      </span>
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
                    )})}
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
