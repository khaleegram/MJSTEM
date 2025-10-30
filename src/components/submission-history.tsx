'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { BookCopy, Edit, UserCheck, MessageSquare, FileEdit, Icon } from 'lucide-react';
import { cn } from '../lib/utils';


interface HistoryEvent {
    id: string;
    message: string;
    icon: string;
    timestamp: Date;
}

const iconMap: { [key: string]: React.ElementType } = {
    BookCopy,
    Edit,
    UserCheck,
    MessageSquare,
    FileEdit,
};

export const SubmissionHistory = ({ submissionId }: { submissionId: string }) => {
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!submissionId) {
            setLoading(false);
            return;
        };
        
        const historyQuery = query(
            collection(db, 'submissions', submissionId, 'history'),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(historyQuery, (querySnapshot) => {
            const fetchedHistory = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    timestamp: data.timestamp?.toDate(),
                    ...data
                } as HistoryEvent;
            }).filter(event => event.timestamp); // Filter out events without a timestamp
            setHistory(fetchedHistory);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching history:", error);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [submissionId]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">History</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No history recorded yet.</p>
                ) : (
                    <ul className="space-y-4">
                       {history.map((event) => {
                           const IconComponent = iconMap[event.icon] || Edit;
                           return (
                             <li key={event.id} className="flex items-start gap-4">
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-secondary")}>
                                    <IconComponent className="h-4 w-4 text-secondary-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm">{event.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                                    </p>
                                </div>
                            </li>
                           )
                       })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
};
