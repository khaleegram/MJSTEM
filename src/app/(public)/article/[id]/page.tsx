'use client';

import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound, useParams } from 'next/navigation';
import { Submission, Article } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, Calendar, Users, Info, BookText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CitationExporter } from '@/components/citation-exporter';
import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';

export default function ArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
        setLoading(true);
        const docRef = doc(db, 'submissions', id);
        getDoc(docRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.status === 'Accepted') {
                        const sub = {
                            id: docSnap.id,
                            ...data,
                            submittedAt: data.submittedAt.toDate(),
                        } as Submission;
                        setSubmission(sub);
                        fetchRelated(sub.keywords, sub.id);
                    } else {
                        setSubmission(null);
                    }
                } else {
                    setSubmission(null);
                }
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const fetchRelated = async (keywords: string, currentId: string) => {
        if (!keywords) return;
        const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
        if (keywordList.length === 0) return;

        const subsRef = collection(db, 'submissions');
        const q = query(
            subsRef,
            where('status', '==', 'Accepted'),
            where('keywords', 'array-contains-any', keywordList.slice(0, 10)),
            limit(4)
        );

        getDocs(q)
            .then((querySnapshot) => {
                const articles: Article[] = [];
                querySnapshot.forEach(doc => {
                    if (doc.id !== currentId) {
                        const data = doc.data();
                        articles.push({
                            id: doc.id,
                            title: data.title,
                            contributors: data.contributors,
                            manuscriptUrl: data.manuscriptUrl,
                            authorName: data.author.name,
                        } as Article);
                    }
                });
                setRelatedArticles(articles.slice(0, 3));
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: subsRef.path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    fetchArticle();
  }, [id]);

  if (loading) {
      return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid lg:grid-cols-4 gap-12">
                  <div className="lg:col-span-3"><Skeleton className="h-[600px] w-full" /></div>
                  <div className="lg:col-span-1"><Skeleton className="h-[400px] w-full" /></div>
              </div>
          </main>
      );
  }

  if (!submission) {
    notFound();
  }

  const serializableSubmission = JSON.parse(JSON.stringify(submission));

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-4 gap-12">
          <article className="lg:col-span-3 min-w-0">
              <Card>
                  <CardHeader>
                      <CardTitle className="text-3xl lg:text-4xl font-headline font-bold text-foreground break-words">
                          {submission.title}
                      </CardTitle>
                      <div className="mt-4 text-muted-foreground text-sm space-y-2">
                          <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{submission.contributors?.map(c => c.name).join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Published on {format(submission.submittedAt, 'PPP')}</span>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <div className="my-6 flex flex-wrap items-center gap-2">
                          <Button asChild>
                              <Link href={`https://docs.google.com/gview?url=${submission.manuscriptUrl}&embedded=true`} target="_blank" rel="noopener noreferrer">
                                  <BookText className="mr-2 h-4 w-4" />
                                  Read Online
                              </Link>
                          </Button>
                           <Button asChild variant="outline">
                              <Link href={submission.manuscriptUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download DOCX
                              </Link>
                          </Button>
                          <CitationExporter submission={serializableSubmission} />
                      </div>

                      <Separator className="my-6" />
                      
                      <h2 className="text-2xl font-headline font-bold mb-4">Abstract</h2>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">{submission.abstract}</p>

                        <Separator className="my-6" />

                        <h3 className="font-semibold mb-2 font-headline">Keywords</h3>
                          <div className="flex flex-wrap gap-2">
                              {submission.keywords && submission.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean).map(keyword => (
                                  <Badge key={keyword} variant="secondary">{keyword}</Badge>
                              ))}
                          </div>
                      
                      <Separator className="my-6" />

                      <div className="flex items-start gap-3 rounded-lg border bg-secondary/50 p-4">
                          <Info className="w-8 h-8 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="flex-1">
                              <h4 className="font-semibold">License</h4>
                              <p className="text-sm text-muted-foreground">This is an open access article distributed under the terms of the <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Creative Commons Attribution License 4.0 (CC BY 4.0)</a>.</p>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </article>
          <aside className="lg:col-span-1 space-y-8">
                {relatedArticles.length > 0 && (
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline">Related Articles</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <ul className="space-y-4">
                              {relatedArticles.map(article => (
                                  <li key={article.id}>
                                      <Link href={`/article/${article.id}`} className="group">
                                          <div className="min-w-0">
                                            <h4 className="font-semibold text-foreground group-hover:underline group-hover:text-primary transition-colors break-words">
                                                {article.title}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                By {article.contributors?.map(c => c.name).join(', ') || article.authorName}
                                            </p>
                                          </div>
                                      </Link>
                                  </li>
                              ))}
                          </ul>
                      </CardContent>
                  </Card>
              )}
          </aside>
      </div>
    </main>
  );
}
