
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Submission } from '@/types';
import { PublicHeader } from '@/components/public-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, Calendar, Users, FileText, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Metadata, ResolvingMetadata } from 'next';

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


export default async function ArticlePage({ params }: { params: { id: string } }) {
  const submission = await getSubmission(params.id);

  if (!submission) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    {submission.uniqueId && (
                        <Badge variant="secondary" className="w-fit mb-4">
                           DOI: {submission.uniqueId}
                        </Badge>
                    )}
                    <CardTitle className="text-3xl lg:text-4xl font-headline font-bold text-foreground">
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
                    <div className="my-6">
                        <Button asChild>
                            <Link href={submission.manuscriptUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Link>
                        </Button>
                    </div>

                    <Separator className="my-6" />
                    
                    <h2 className="text-2xl font-headline font-bold mb-4">Abstract</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{submission.abstract}</p>

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
      </main>
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
          <p className="mb-2">ISSN (Print): 3121-6552 | EISSN: 3121-9292</p>
          © {new Date().getFullYear()} MJSTEM. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
