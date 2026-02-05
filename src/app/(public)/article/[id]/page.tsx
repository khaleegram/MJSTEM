
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Submission, Article } from '@/types';
import { PublicHeader } from '@/components/public-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, Calendar, Users, FileText, Info, BookText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Metadata, ResolvingMetadata } from 'next';
import { CitationExporter } from '@/components/citation-exporter';

type Props = {
  params: { id: string }
}

// This function generates the metadata for the page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const submission = await getSubmission(id);

  if (!submission) {
    return {
      title: 'Article Not Found',
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${submission.title} | MJSTEM`,
    description: submission.abstract,
    keywords: submission.keywords.split(',').map(k => k.trim()),
    authors: submission.contributors?.map(c => ({ name: c.name })),
    openGraph: {
      title: submission.title,
      description: submission.abstract,
      type: 'article',
      publishedTime: submission.submittedAt.toISOString(),
      authors: submission.contributors?.map(c => c.name || ''),
      images: [...previousImages],
    },
    // Google Scholar metadata tags
    other: {
        'citation_title': submission.title,
        'citation_author': submission.contributors?.map(c => c.name).join(', ') || '',
        'citation_publication_date': format(submission.submittedAt, 'yyyy/MM/dd'),
        'citation_journal_title': 'Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM)',
        'citation_pdf_url': submission.manuscriptUrl,
        'citation_keywords': submission.keywords,
        'citation_doi': submission.uniqueId || '',
    }
  }
}

async function getSubmission(id: string): Promise<Submission | null> {
    try {
        const docRef = doc(db, 'submissions', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Only return if it's an accepted article
            if (data.status === 'Accepted') {
                return {
                    id: docSnap.id,
                    ...data,
                    submittedAt: data.submittedAt.toDate(),
                } as Submission;
            }
        }
        return null;
    } catch (e) {
        console.error("Could not fetch article", e);
        return null;
    }
}

async function getRelatedArticles(keywords: string, currentId: string): Promise<Article[]> {
    if (!keywords) return [];
    
    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    if (keywordList.length === 0) return [];

    try {
        const q = query(
            collection(db, 'submissions'),
            where('status', '==', 'Accepted'),
            where('keywords', 'array-contains-any', keywordList.slice(0, 10)), // Firestore limit of 10 for array-contains-any
            limit(4) // Fetch a bit more to filter out the current article
        );

        const querySnapshot = await getDocs(q);
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
                } as Article)
            }
        });
        
        return articles.slice(0, 3); // Return at most 3 related articles
    } catch (error) {
        console.error("Error fetching related articles: ", error);
        return [];
    }
}


export default async function ArticlePage({ params }: { params: { id: string } }) {
  const submission = await getSubmission(params.id);

  if (!submission) {
    notFound();
  }
  
  const relatedArticles = submission ? await getRelatedArticles(submission.keywords, submission.id) : [];

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-4 gap-12">
          <article className="lg:col-span-3 min-w-0">
              <Card>
                  <CardHeader>
                      {submission.uniqueId && (
                          <Badge variant="secondary" className="w-fit mb-4">
                              DOI: {submission.uniqueId}
                          </Badge>
                      )}
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
                      <div className="my-6 flex items-center gap-2">
                          <Button asChild>
                              <Link href={submission.manuscriptUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download DOCX
                              </Link>
                          </Button>
                          <CitationExporter submission={submission} />
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
                                          <h4 className="font-semibold text-foreground group-hover:underline group-hover:text-primary transition-colors break-words">
                                              {article.title}
                                          </h4>
                                          <p className="text-sm text-muted-foreground">
                                              By {article.contributors?.map(c => c.name).join(', ') || article.authorName}
                                          </p>
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
