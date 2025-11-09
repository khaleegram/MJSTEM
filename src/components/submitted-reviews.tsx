
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, MessageSquare, User } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface Review {
    id: string;
    reviewerName: string;
    recommendation: 'Accept' | 'Minor Revision' | 'Major Revision' | 'Reject';
    commentsForEditor: string;
    commentsForAuthor: string;
    submittedAt: Date;
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

export const SubmittedReviews = ({ submissionId, showForAuthor = false }: { submissionId: string; showForAuthor?: boolean }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            try {
                const reviewsQuery = query(
                    collection(db, 'submissions', submissionId, 'reviews'),
                    orderBy('submittedAt', 'desc')
                );
                const querySnapshot = await getDocs(reviewsQuery);
                const fetchedReviews = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const submittedAt = data.submittedAt instanceof Timestamp 
                        ? data.submittedAt.toDate() 
                        : new Date(data.submittedAt);
                    return {
                        id: doc.id,
                        ...data,
                        submittedAt,
                    } as Review;
                });
                setReviews(fetchedReviews);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        if (submissionId) {
            fetchReviews();
        }
    }, [submissionId]);

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
                <CardTitle className="font-headline">{showForAuthor ? "Reviewer Comments" : "Submitted Reviews"}</CardTitle>
                <CardDescription>{showForAuthor ? "Feedback from reviewers to guide your revision." : "Feedback from the assigned peer reviewers."}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {reviews.map((review, index) => (
                         <AccordionItem value={`item-${index}`} key={review.id}>
                            <AccordionTrigger>
                               <div className="flex items-center justify-between w-full pr-4">
                                    <div className='flex items-center gap-2'>
                                        <User className="w-4 h-4" />
                                        <span>Review from {showForAuthor ? `Reviewer #${index + 1}` : review.reviewerName}</span>
                                    </div>
                                    {!showForAuthor && <Badge variant={getRecommendationVariant(review.recommendation)}>{review.recommendation}</Badge>}
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-6 pt-4">
                                <p className='text-xs text-muted-foreground'>Submitted on {format(review.submittedAt, 'PPP')}</p>
                                {!showForAuthor && review.commentsForEditor && (
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
                                {!review.commentsForEditor && !review.commentsForAuthor && (
                                    <p className="text-sm text-muted-foreground text-center py-4">The reviewer did not provide any written comments.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
};

    