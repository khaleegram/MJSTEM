
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Volume, Article, Submission } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, BookCopy, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';

export default function ArchivePage() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [inPressArticles, setInPressArticles] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // 1. Fetch Volumes
    const volsQuery = query(collection(db, 'volumes'), orderBy('year', 'desc'));
    const unsubscribeVols = onSnapshot(volsQuery, (snapshot) => {
        const vols: Volume[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Volume, 'id'>),
          issues: doc.data().issues?.map((issue: any) => ({
            ...issue,
            articles: issue.articles?.map((article: any) => ({
              id: article.id,
              title: article.title,
              contributors: article.contributors || [{ name: article.authorName }],
              manuscriptUrl: article.manuscriptUrl || '',
              pageCount: article.pageCount || null,
              uniqueId: article.uniqueId,
            } as Article)) || [],
          })) || [],
        }));
        setVolumes(vols);
    }, (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'volumes', operation: 'list' }));
    });

    // 2. Fetch Accepted Submissions (to find Articles in Press)
    const subsQuery = query(collection(db, 'submissions'), where('status', '==', 'Accepted'));
    const unsubscribeSubs = onSnapshot(subsQuery, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        } as Submission)).filter((sub) => !(sub as any).hiddenFromInPress);
        
        // Filter out articles that are already assigned to a volume/issue
        // This is done client-side for reactive updates
        setInPressArticles(subs);
        setLoading(false);
    });

  return () => {
      unsubscribeVols();
      unsubscribeSubs();
  };
  }, []);

  const filteredInPress = useMemo(() => {
      const assignedArticleIds = new Set(
          volumes.flatMap(v => v.issues?.flatMap(i => i.articles?.map(a => a.id) || []) || [])
      );
      return inPressArticles.filter(article => !assignedArticleIds.has(article.id));
  }, [volumes, inPressArticles]);

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-headline text-foreground">Journal Archives</h1>
        <p className="text-muted-foreground mt-2">Browse all our published volumes and issues, or view recent Articles in Press.</p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Articles in Press Section */}
        {filteredInPress.length > 0 && (
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-2">
                    <Clock className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold font-headline">Articles in Press</h2>
                    <Badge variant="secondary" className="ml-auto">Pre-publication</Badge>
                </div>
                <div className="grid gap-4">
                    {filteredInPress.map(article => (
                        <div key={article.id} className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-all">
                            <h3 className="text-xl font-bold font-headline text-primary mb-2">
                                <Link href={`/article/${article.id}`} className="hover:underline">
                                    {article.title}
                                </Link>
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                By {article.contributors?.map(c => c.name).join(', ') || article.author.name}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground italic">Accepted for publication. Final formatting in progress.</span>
                                <Link href={`/article/${article.id}`} className="text-sm font-semibold text-primary hover:underline">
                                    View Abstract
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

      {loading ? (
          <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
          </div>
      ) : volumes.length > 0 ? (
        <section className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-2">
                <Book className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold font-headline">Published Volumes</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
            {volumes.map((volume) => (
                <AccordionItem value={volume.id} key={volume.id}>
                <AccordionTrigger className="text-xl font-bold font-headline py-6">
                    <div className="flex items-center gap-3">{volume.title}</div>
                </AccordionTrigger>
                <AccordionContent className="pl-8 pr-2">
                    {volume.issues && volume.issues.length > 0 ? (
                            <Accordion type="multiple" className="w-full">
                                {volume.issues.map(issue => (
                                <AccordionItem value={issue.id} key={issue.id}>
                                    <AccordionTrigger className="text-lg font-semibold font-headline">
                                            <div className="flex items-center gap-3"><BookCopy className="w-5 h-5" /> {issue.title}</div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-8 py-4">
                                        <ul className="space-y-4">
                                            {issue.articles && issue.articles.length > 0 ? (
                                                issue.articles.map(article => (
                                                    <li key={article.id} className="flex items-start justify-between gap-3 p-4 border rounded-lg">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                                            <div className="min-w-0">
                                                                <h4 className="font-semibold text-foreground break-words">
                                                                    <Link href={`/article/${article.id}`} className="hover:underline">
                                                                        {article.title}
                                                                    </Link>
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    By {article.contributors?.map(c => c.name).join(', ') || article.authorName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className='text-right'>
                                                                <Link href={article.manuscriptUrl || '#'} target='_blank' rel='noopener noreferrer' className='text-sm text-primary hover:underline'>
                                                                PDF
                                                            </Link>
                                                            {article.pageCount && <p className="text-sm text-muted-foreground">{article.pageCount} Pages</p>}
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">No articles published in this issue yet.</p>
                                            )}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                            </Accordion>
                    ) : (
                        <p className="text-muted-foreground italic py-4 text-center">No issues in this volume yet.</p>
                    )}
                </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        </section>
      ) : !filteredInPress.length && (
          <div className="flex flex-col items-center gap-4 text-center py-20">
              <Book className="h-24 w-24 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight font-headline">
              Nothing Published Yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
              Check back later to see our published articles. Accepted articles can be organized into volumes and issues on the publications dashboard.
              </p>
        </div>
      )}
      </div>
    </main>
  );
}
