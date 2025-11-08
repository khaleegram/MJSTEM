
'use client';

import { notFound, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs, addDoc, serverTimestamp, query } from 'firebase/firestore';
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
import { File, Calendar, User, Mail, PlusCircle, Download, BookCopy, Edit, Sparkles, UserCheck, MessageSquare, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { SubmissionStatus, Reviewer, Submission, UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
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


const getStatusVariant = (status: SubmissionStatus) => {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Rejected':
        return 'destructive';
      case 'Minor Revision':
      case 'Major Revision':
      case 'Revisions Required':
        return 'secondary';
      case 'Under Peer Review':
      case 'Under Initial Review':
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

    const myReviewAssignment = submission.reviewers?.find(r => r.id === user?.uid);

    if (!myReviewAssignment || myReviewAssignment.status === 'Review Submitted') {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recommendation) {
            toast({ title: "Recommendation Required", description: "Please select a recommendation.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);

        const reviewData = {
            reviewerId: user?.uid,
            reviewerName: user?.displayName,
            recommendation,
            commentsForEditor,
            commentsForAuthor,
            submittedAt: new Date(),
        };

        const submissionRef = doc(db, 'submissions', submission.id);
        const reviewRef = collection(db, 'submissions', submission.id, 'reviews');

        // 1. Add review to subcollection
        addDoc(reviewRef, reviewData)
        .then(async () => {
             // 2. Update the reviewer's status in the submission's reviewers array
            const updatedReviewers = submission.reviewers?.map(r => 
                r.id === user?.uid ? { ...r, status: 'Review Submitted' } : r
            );
            await updateDoc(submissionRef, { reviewers: updatedReviewers });

            // 3. Log the review event
            await logSubmissionEvent({
                submissionId: submission.id,
                eventType: 'REVIEW_SUBMITTED',
                context: { reviewerName: user?.displayName || 'A reviewer' }
            });
            
            toast({ title: "Review Submitted", description: "Thank you for your contribution." });
            onReviewSubmit(); // Trigger a refetch on the parent page
        })
        .catch(serverError => {
             const permissionError = new FirestorePermissionError({
                path: reviewRef.path,
                operation: 'create',
                requestResourceData: reviewData
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
                <CardTitle className="font-headline">Submit Your Review</CardTitle>
                <CardDescription>Complete the fields below to provide your feedback.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Recommendation</label>
                        <Select onValueChange={setRecommendation} value={recommendation} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a recommendation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Accept">Accept</SelectItem>
                                <SelectItem value="Minor Revision">Minor Revision</SelectItem>
                                <SelectItem value="Major Revision">Major Revision</SelectItem>
                                <SelectItem value="Reject">Reject</SelectItem>
                            </SelectContent>
                        </Select>
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
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
  
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


export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const { toast } = useToast();
  const [availableReviewers, setAvailableReviewers] = React.useState<UserProfile[]>([]);
  const { user, userProfile } = useAuth();
  const [refetchTrigger, setRefetchTrigger] = React.useState(0);


  React.useEffect(() => {
    const fetchReviewers = async () => {
        try {
            const q = query(collection(db, 'users'));
            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
            setAvailableReviewers(users);
        } catch (error) {
            console.error("Error fetching reviewers:", error);
            toast({
                title: "Error",
                description: "Could not fetch list of reviewers.",
                variant: "destructive",
            })
        }
    }
    fetchReviewers();
  }, [toast]);

  const fetchSubmission = React.useCallback(async () => {
    if (!id) return;
    // Don't set loading to true here on refetch, only initial load
    try {
        const docRef = doc(db, 'submissions', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            setSubmission({
                id: docSnap.id,
                title: data.title,
                author: data.author,
                status: data.status,
                submittedAt: data.submittedAt ? data.submittedAt.toDate() : new Date(),
                abstract: data.abstract,
                keywords: data.keywords,
                manuscriptUrl: data.manuscriptUrl || '',
                reviewers: data.reviewers || [],
                reviewerIds: data.reviewerIds || [],
            });
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


  const handleDecision = (status: SubmissionStatus) => {
    if(!submission || !userProfile) return;
    setIsUpdating(true);

    const submissionRef = doc(db, 'submissions', submission.id);
    const updateData = { status };

    updateDoc(submissionRef, updateData)
      .then(async () => {
        await logSubmissionEvent({
            submissionId: submission.id,
            eventType: 'STATUS_CHANGED',
            context: { actorName: userProfile.displayName, status }
        });
        setRefetchTrigger(prev => prev + 1); // Trigger refetch
        toast({
            title: "Status Updated",
            description: `Submission marked as ${status}.`,
        });
      })
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: submissionRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  }

  const handleAssignReviewer = (reviewer: UserProfile) => {
      if(!submission) return;

      // Prevent assigning the same reviewer twice
      if (submission.reviewers?.some(r => r.id === reviewer.uid)) {
          toast({
              title: "Already Assigned",
              description: `${reviewer.displayName} is already a reviewer for this manuscript.`,
              variant: "destructive",
          });
          return;
      }
      
      setIsUpdating(true);

      const submissionRef = doc(db, 'submissions', submission.id);
      const newStatus = submission.status === 'Submitted' ? 'Under Initial Review' : submission.status;
      
      const updateData: any = {
          reviewers: arrayUnion({
            id: reviewer.uid,
            name: reviewer.displayName,
            status: 'Pending',
          }),
          reviewerIds: arrayUnion(reviewer.uid),
      };

      if (submission.status === 'Submitted') {
          updateData.status = 'Under Peer Review';
      }

      updateDoc(submissionRef, updateData)
        .then(async () => {
            await logSubmissionEvent({
                submissionId: submission.id,
                eventType: 'REVIEWER_ASSIGNED',
                context: { reviewerName: reviewer.displayName }
            });
            // If status was 'Submitted', log a status change too
            if (submission.status === 'Submitted' && userProfile) {
                 await logSubmissionEvent({
                    submissionId: submission.id,
                    eventType: 'STATUS_CHANGED',
                    context: { actorName: userProfile.displayName, status: 'Under Peer Review' }
                });
            }
            setRefetchTrigger(prev => prev + 1);
            toast({
                title: "Reviewer Assigned",
                description: `${reviewer.displayName} has been assigned.`,
            });
        })
        .catch(serverError => {
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
        })
        .finally(() => {
             setIsUpdating(false);
        });
  }

  const handleReviewSubmit = () => {
    setRefetchTrigger(prev => prev + 1);
  }

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!submission) {
    return notFound();
  }

  const isEditor = userProfile?.role === 'Editor' || userProfile?.role === 'Admin';
  const isReviewer = submission.reviewers?.some(r => r.id === user?.uid);
  const isDecisionMade = submission.status === 'Accepted' || submission.status === 'Rejected';


  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <Badge variant={getStatusVariant(submission.status)} className={cn("w-fit mb-2", submission.status.startsWith('Under') && 'bg-blue-500')}>
                {submission.status}
            </Badge>
            <CardTitle className="font-headline text-3xl">{submission.title}</CardTitle>
            <div className="text-sm text-muted-foreground flex items-center gap-4 pt-2">
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
            <p className="text-muted-foreground leading-relaxed">
              {submission.abstract}
            </p>
            <Separator className="my-6" />
            <h3 className="font-semibold mb-2 font-headline">Keywords</h3>
            <div className="flex flex-wrap gap-2">
                {submission.keywords && submission.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean).map(keyword => (
                    <Badge key={keyword} variant="secondary">{keyword}</Badge>
                ))}
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            {submission.manuscriptUrl && (
                <Button variant="outline" asChild>
                    <Link href={submission.manuscriptUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Manuscript
                    </Link>
                </Button>
            )}
          </CardFooter>
        </Card>

        {isEditor && <SubmittedReviews submissionId={submission.id} />}
      </div>

      <div className="space-y-8 lg:col-span-1">
        
        {isEditor && !isDecisionMade && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Decision</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision('Accepted')} disabled={isUpdating}>Accept</Button>
            <Button variant="secondary" onClick={() => handleDecision('Minor Revision')} disabled={isUpdating}>Request Minor Revision</Button>
            <Button variant="secondary" onClick={() => handleDecision('Major Revision')} disabled={isUpdating}>Request Major Revision</Button>
            <Button variant="destructive" onClick={() => handleDecision('Rejected')} disabled={isUpdating}>Reject</Button>
          </CardContent>
        </Card>
        )}
        
        {isReviewer && <ReviewSubmissionForm submission={submission} onReviewSubmit={handleReviewSubmit} />}

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Reviewers</CardTitle>
          </CardHeader>
          <CardContent>
             {submission.reviewers && submission.reviewers.length > 0 ? (
                <ul className="space-y-4">
                    {submission.reviewers.map(reviewer => (
                         <li key={reviewer.id} className="flex items-center gap-4">
                            <Image src={`https://picsum.photos/seed/${reviewer.id}/40/40`} width={40} height={40} alt="Reviewer" className="rounded-full" data-ai-hint="person face" />
                            <div>
                                <p className="font-medium">{reviewer.name}</p>
                                <p className="text-sm text-muted-foreground">{reviewer.status}</p>
                            </div>
                        </li>
                    ))}
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
                    Select a qualified reviewer for this manuscript.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {availableReviewers.map(reviewer => (
                      <li key={reviewer.uid} className='flex justify-between items-center p-3 rounded-lg border hover:bg-secondary/50'>
                         <div className="flex items-center gap-4">
                            <Image src={`https://picsum.photos/seed/${reviewer.uid}/40/40`} width={40} height={40} alt={reviewer.displayName || 'Reviewer'} className="rounded-full" data-ai-hint="person face" />
                            <div>
                                <p className="font-medium">{reviewer.displayName}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-48">{reviewer.specialization || 'No specialization listed'}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleAssignReviewer(reviewer)} disabled={isUpdating}>
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

        <SubmissionHistory submissionId={id} />
      </div>
    </div>
  );
}

    