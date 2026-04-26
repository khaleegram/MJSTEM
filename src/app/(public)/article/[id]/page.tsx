import { notFound } from 'next/navigation';
import { Submission, Article } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, Calendar, Users, Info, BookText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CitationExporter } from '@/components/citation-exporter';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

type ArticlePageProps = {
  params: Promise<{ id: string }>;
};

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

async function getAcceptedSubmission(id: string): Promise<Submission | null> {
  if (!adminDb) return null;
  const docSnap = await adminDb.collection('submissions').doc(id).get();
  if (!docSnap.exists) return null;

  const data = docSnap.data();
  if (!data || data.status !== 'Accepted') return null;

  return {
    id: docSnap.id,
    ...data,
    submittedAt: toDate(data.submittedAt),
  } as Submission;
}

async function getRelatedArticles(currentId: string, keywords: string): Promise<Article[]> {
  if (!adminDb) return [];
  const trimmedKeywords = (keywords || '')
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  if (trimmedKeywords.length === 0) return [];

  const querySnap = await adminDb
    .collection('submissions')
    .where('status', '==', 'Accepted')
    .limit(15)
    .get();

  const related: Article[] = [];
  querySnap.forEach((docSnap) => {
    if (docSnap.id === currentId || related.length >= 3) return;
    const data = docSnap.data();
    const articleKeywords = String(data.keywords || '')
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const overlap = articleKeywords.some((k) => trimmedKeywords.includes(k));
    if (!overlap) return;

    related.push({
      id: docSnap.id,
      title: data.title,
      contributors: data.contributors,
      manuscriptUrl: data.manuscriptUrl,
      authorName: data.author?.name || '',
    } as Article);
  });

  return related;
}

function resolveReaderUrl(manuscriptUrl: string): string {
  return manuscriptUrl;
}

function resolveDownloadLabel(manuscriptUrl: string): string {
  return manuscriptUrl.toLowerCase().endsWith('.pdf') ? 'Download PDF' : 'Download Manuscript';
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const submission = await getAcceptedSubmission(id);
  if (!submission) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(submission.id, submission.keywords);

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
                              <Link href={resolveReaderUrl(submission.manuscriptUrl)} target="_blank" rel="noopener noreferrer">
                                  <BookText className="mr-2 h-4 w-4" />
                                  Read Online
                              </Link>
                          </Button>
                           <Button asChild variant="outline">
                              <Link href={submission.manuscriptUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-2 h-4 w-4" />
                                  {resolveDownloadLabel(submission.manuscriptUrl)}
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
