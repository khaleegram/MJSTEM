
'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Volume, Article } from '@/types';
import { PublicHeader } from '@/components/public-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, BookCopy, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ArchivePage() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolumes = async () => {
      setLoading(true);
      try {
        const volsQuery = query(collection(db, 'volumes'), orderBy('year', 'desc'));
        const volsSnapshot = await getDocs(volsQuery);
        const vols: Volume[] = volsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Volume, 'id'>),
          // Ensure nested articles have all fields
          issues: doc.data().issues?.map((issue: any) => ({
            ...issue,
            articles: issue.articles?.map((article: any) => ({
              id: article.id,
              title: article.title,
              authorName: article.authorName,
              manuscriptUrl: article.manuscriptUrl || '',
            } as Article)) || [],
          })) || [],
        }));
        setVolumes(vols);
      } catch (error) {
        console.error('Error fetching volumes: ', error);
        // Handle error display if needed
      } finally {
        setLoading(false);
      }
    };
    fetchVolumes();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-headline text-foreground">Journal Archives</h1>
          <p className="text-muted-foreground mt-2">Browse all our published volumes and issues.</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
        {loading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        ) : volumes.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {volumes.map((volume) => (
              <AccordionItem value={volume.id} key={volume.id}>
                <AccordionTrigger className="text-xl font-bold font-headline py-6">
                  <div className="flex items-center gap-3"><Book className="w-6 h-6" /> {volume.title}</div>
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
                                                        <div className="flex items-start gap-3">
                                                            <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                                            <div>
                                                                <h4 className="font-semibold text-foreground">{article.title}</h4>
                                                                <p className="text-sm text-muted-foreground">By {article.authorName}</p>
                                                            </div>
                                                        </div>
                                                        <Button asChild variant="outline" size="sm" disabled={!article.manuscriptUrl}>
                                                            <Link href={article.manuscriptUrl || '#'} target='_blank' rel='noopener noreferrer'>
                                                                Read Article
                                                                <ArrowRight className="w-4 h-4 ml-2" />
                                                            </Link>
                                                        </Button>
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
        ) : (
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
       <footer className="bg-background border-t">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} MJSTEM. All Rights Reserved.
            </div>
        </footer>
    </div>
  );
}
