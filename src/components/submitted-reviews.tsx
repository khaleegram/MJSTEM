
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, MessageSquare, User, Paperclip, Download, BookText } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { Button } from './ui/button';
import Link from 'next/link';

interface Review {
    id: string;
    reviewerId: string;
    reviewerName: string;
    recommendation: 'Accept' | 'Minor Revision' | 'Major Revision' | 'Reject';
    commentsForEditor: string;
    commentsForAuthor: string;
    submittedAt: Date;
    attachmentUrl?: string;
    attachmentName?: string;
}

const getRecommendationVariant = (recommendation: string) => {
    switch(recommendation) {
        case 'Accept': return 'success';
        case 'Reject': return 'destructive';
        case 'Minor Revision':
        case 'Major Revision': 
            return 'secondary';
        default: return 'outline';
    }
}

const getOnlineReaderUrl = (url: string) =>
    `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

export const SubmittedReviews = ({
    submissionId,
    showForAuthor = false,
    refreshKey = 0,
}: {
    submissionId: string;
    showForAuthor?: boolean;
    refreshKey?: number;
}) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, userProfile } = useAuth();
    const isEditor = userProfile?.role === 'Editor' || userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor';

    useEffect(() => {
        if (!submissionId || !user) {
            setReviews([]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const loadReviews = async () => {
            setLoading(true);
            try {
                const token = await user.getIdToken(true);
                const scope = isEditor || showForAuthor ? 'all' : 'mine';
                const response = await fetch(`/api/submissions/${submissionId}/reviews?scope=${scope}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload?.error || 'Failed to load reviews.');
                }

                const fetchedReviews = (Array.isArray(payload?.reviews) ? payload.reviews : []).map((review: any) => {
                    const submittedAt = review?.submittedAt ? new Date(review.submittedAt) : new Date();
                    const safeSubmittedAt = Number.isNaN(submittedAt.getTime()) ? new Date() : submittedAt;
                    return {
                        ...review,
                        submittedAt: safeSubmittedAt,
                    } as Review;
                });

                if (cancelled) return;
                setReviews(fetchedReviews);
            } catch (error) {
                console.warn('[SubmittedReviews] Could not load reviews via API:', error);
                if (cancelled) return;
                setReviews([]);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadReviews();

        return () => {
            cancelled = true;
        };
    }, [submissionId, user?.uid, user?.email, isEditor, showForAuthor, refreshKey]);
    
    const reviewerIdToAnonymousNameMap = useMemo(() => {
        if (!showForAuthor) return new Map();
        const uniqueReviewerIds = Array.from(new Set(reviews.map(review => review.reviewerId)));
        const map = new Map<string, string>();
        uniqueReviewerIds.forEach((id, index) => {
            map.set(id, `Reviewer #${index + 1}`);
        });
        return map;
    }, [reviews, showForAuthor]);


    if (!isEditor && !showForAuthor && reviews.length === 0 && !loading) {
        return null;
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{showForAuthor ? "Reviewer Comments" : "Submitted Reviews"}</CardTitle>
                    <CardDescription>{showForAuthor ? "Feedback from reviewers to guide your revision." : "Reviewer feedback will appear here once submitted."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (reviews.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{showForAuthor ? "Reviewer Comments" : "Submitted Reviews"}</CardTitle>
                    <CardDescription>{showForAuthor ? "Feedback from reviewers to guide your revision." : "Reviewer feedback will appear here once submitted."}</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-center text-muted-foreground py-8">
                        <p>No reviews have been submitted yet.</p>
                   </div>
                </CardContent>
            </Card>
        )
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{showForAuthor ? "Reviewer Comments" : "Your Feedback & Reports"}</CardTitle>
                <CardDescription>{showForAuthor ? "Feedback from reviewers to guide your revision." : "View the feedback provided during the peer-review process."}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue='item-0'>
                    {reviews.map((review, index) => {
                        const isMyReview = review.reviewerId === user?.uid;
                        const reviewerName = showForAuthor 
                            ? reviewerIdToAnonymousNameMap.get(review.reviewerId) || `Reviewer #${index + 1}`
                            : isMyReview ? "Your Review" : review.reviewerName;

                        return (
                         <AccordionItem value={`item-${index}`} key={review.id}>
                            <AccordionTrigger>
                               <div className="flex items-center justify-between w-full pr-4">
                                    <div className='flex items-center gap-2'>
                                        <User className="w-4 h-4" />
                                        <span>Review from {reviewerName}</span>
                                    </div>
                                    {(!showForAuthor || isMyReview) && <Badge variant={getRecommendationVariant(review.recommendation)}>{review.recommendation}</Badge>}
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-6 pt-4">
                                <p className='text-xs text-muted-foreground'>Submitted on {format(review.submittedAt, 'PPP')}</p>
                                {(isEditor || isMyReview) && review.commentsForEditor && (
                                     <div>
                                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <Shield className="w-4 h-4" />
                                            Confidential Comments for Editor
                                        </h4>
                                        <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">{review.commentsForEditor}</p>
                                    </div>
                                )}
                               {review.commentsForAuthor && (
                                     <div>
                                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            Comments for Author
                                        </h4>
                                        <p className="text-sm text-muted-foreground border p-3 rounded-md">{review.commentsForAuthor}</p>
                                    </div>
                               )}
                                {(isEditor || isMyReview || showForAuthor) && review.attachmentUrl && (
                                     <div className="pt-4">
                                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <Paperclip className="w-4 h-4" />
                                            Reviewer's Attachment
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            <Button asChild size="sm">
                                                <Link href={getOnlineReaderUrl(review.attachmentUrl)} target="_blank" rel="noopener noreferrer">
                                                    <BookText className="w-4 h-4 mr-2" />
                                                    Read Online
                                                </Link>
                                            </Button>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={review.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download {review.attachmentName || 'Reviewer File'}
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {!review.commentsForEditor && !review.commentsForAuthor && !review.attachmentUrl && (
                                    <p className="text-sm text-muted-foreground text-center py-4">The reviewer did not provide any written comments or files.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                        )
                    })}
                </Accordion>
            </CardContent>
        </Card>
    )
};
