
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Submission } from '@/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PublicHeader } from '@/components/public-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { FileText, Search as SearchIcon } from 'lucide-react';

function SearchResultsPage() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q');
    const [allArticles, setAllArticles] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
                const articlesQuery = query(collection(db, 'submissions'), where('status', '==', 'Accepted'));
                const querySnapshot = await getDocs(articlesQuery);
                const articles = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    submittedAt: doc.data().submittedAt.toDate(),
                } as Submission));
                setAllArticles(articles);
            } catch (error) {
                console.error("Error fetching articles for search:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    const filteredArticles = useMemo(() => {
        if (!q) {
            return [];
        }
        const lowerCaseQuery = q.toLowerCase();
        return allArticles.filter(article => {
            const titleMatch = article.title.toLowerCase().includes(lowerCaseQuery);
            const authorMatch = article.contributors?.some(c => c.name.toLowerCase().includes(lowerCaseQuery));
            const keywordMatch = article.keywords?.toLowerCase().includes(lowerCaseQuery);
            const doiMatch = article.uniqueId?.toLowerCase().includes(lowerCaseQuery);
            return titleMatch || authorMatch || keywordMatch || doiMatch;
        });
    }, [allArticles, q]);

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Search Results</CardTitle>
                        {q && <CardDescription>Showing results for: "{q}"</CardDescription>}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : filteredArticles.length > 0 ? (
                            <ul className="space-y-4">
                                {filteredArticles.map(article => (
                                    <li key={article.id} className="p-4 border rounded-lg hover:bg-muted/50">
                                        <Link href={`/article/${article.id}`}>
                                            <h3 className="font-headline font-semibold text-lg text-primary break-words">{article.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                By {article.contributors?.map(c => c.name).join(', ') || article.author.name}
                                            </p>
                                             <p className="text-sm text-muted-foreground mt-2 line-clamp-2 break-words">{article.abstract}</p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <SearchIcon className="mx-auto h-12 w-12" />
                                <h3 className="mt-4 text-lg font-medium">No Results Found</h3>
                                <p className="mt-1 text-sm">We couldn't find any articles matching your search.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

// Wrap with a Suspense boundary if this was a server component, but it's a client one.
// The page needs to be client-rendered to use `useSearchParams`.
// A wrapper can provide the Suspense for the component tree.
export default function SearchPageWrapper() {
    return (
        // React's Suspense can be used here if needed for data fetching libraries
        // that integrate with it. For now, the internal loading state is sufficient.
        <SearchResultsPage />
    );
}
