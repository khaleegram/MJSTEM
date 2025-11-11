
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Feather, Microscope, BookOpen, BookText, Download } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { getLatestIssue } from '@/services/publication-service';
import { Icons } from '@/components/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const dynamic = 'force-dynamic';

const HowItWorksCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/20 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group flex flex-col">
    <CardHeader className="flex flex-row items-center gap-4">
      <div className="bg-primary/10 text-primary p-3 rounded-lg">
        {icon}
      </div>
      <CardTitle className="font-headline text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-1 flex flex-col">
      <div className="text-muted-foreground flex-1">{children}</div>
    </CardContent>
  </Card>
);

export default async function HomePage() {
  const latestIssue = await getLatestIssue();
  let journalInfo: { coverLetterUrl?: string, submissionTemplateUrl?: string } = {};

  try {
    const docRef = doc(db, 'settings', 'journalInfo');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      journalInfo = docSnap.data();
    }
  } catch (e) {
    console.error("Could not fetch journal info", e);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative flex items-center py-24 md:py-32">
           <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,hsl(var(--primary)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.1)_1px,transparent_1px)]">
             <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--background)),transparent)] dark:bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--accent)/0.1),transparent)]"></div>
          </div>
          <div className="relative z-10 container px-4 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
              {journalInfo.coverLetterUrl && (
                <div className="md:col-span-2 flex justify-center">
                  <Image 
                    src={journalInfo.coverLetterUrl} 
                    alt="Cover Letter"
                    width={300}
                    height={400}
                    className="rounded-lg shadow-2xl object-cover"
                    priority
                  />
                </div>
              )}
              <div className={journalInfo.coverLetterUrl ? 'md:col-span-3 text-center md:text-left' : 'md:col-span-5 text-center'}>
                 <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight drop-shadow-md">
                    Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM)
                </h1>
                {latestIssue ? (
                  <p className="mt-6 max-w-2xl mx-auto md:mx-0 text-lg md:text-xl text-muted-foreground drop-shadow-sm font-body">
                    Read our latest publication: <span className="font-semibold text-foreground">{latestIssue.title}</span> from <span className="font-semibold text-foreground">{latestIssue.volumeTitle}</span>.
                  </p>
                ) : (
                  <p className="mt-6 max-w-2xl mx-auto md:mx-0 text-lg md:text-xl text-muted-foreground drop-shadow-sm font-body">
                    A premier, peer-reviewed journal for science, technology, education, and management.
                  </p>
                )}
                <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                    <Button size="lg" asChild>
                        <Link href="/dashboard/submissions/new">Submit Your Manuscript</Link>
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className='inline-flex'>
                             <Button size="lg" variant="outline" asChild disabled={!journalInfo.submissionTemplateUrl}>
                                <Link href={journalInfo.submissionTemplateUrl || '#'} target="_blank">
                                  <Download className="mr-2 h-5 w-5" />
                                  Download Template
                                </Link>
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!journalInfo.submissionTemplateUrl && (
                           <TooltipContent>
                            <p>No template uploaded yet. An admin must upload one in Journal Settings.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto">
                     <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
                        Advancing Knowledge Across Disciplines
                    </h2>
                    <p className="text-muted-foreground mt-4 text-lg">
                        The Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM) is dedicated to the rapid dissemination of high-quality research. We provide a platform for scholars to exchange ideas that push the boundaries of their fields.
                    </p>
                </div>
            </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">How It Works</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">A streamlined process from submission to publication, designed for authors.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <HowItWorksCard icon={<Download className="w-6 h-6"/>} title="1. Get the Template">
                    <div className="flex-1">Ensure your work meets our formatting standards by starting with the official submission template.</div>
                    <div className="mt-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="inline-flex w-full">
                                        <Button asChild variant="outline" size="sm" className="w-full" disabled={!journalInfo.submissionTemplateUrl}>
                                            <Link href={journalInfo.submissionTemplateUrl || '#'} target="_blank">
                                                Download Template
                                            </Link>
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {!journalInfo.submissionTemplateUrl && (
                                   <TooltipContent>
                                    <p>No template uploaded yet.</p>
                                  </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </HowItWorksCard>
               <HowItWorksCard icon={<Feather className="w-6 h-6"/>} title="2. Effortless Submission">
                    Our clear guidelines and intuitive submission portal make sharing your manuscript straightforward. Focus on your research, not the paperwork.
                </HowItWorksCard>
                 <HowItWorksCard icon={<Microscope className="w-6 h-6"/>} title="3. Rigorous Peer Review">
                    Benefit from constructive, double-blind peer review by experts in your field to ensure the quality and validity of your work.
                </HowItWorksCard>
                 <HowItWorksCard icon={<BookOpen className="w-6 h-6"/>} title="4. Timely Publication">
                    Accepted articles are formatted, assigned a DOI, and published online swiftly, ensuring your research reaches the global community without delay.
                </HowItWorksCard>
            </div>
          </div>
        </section>

        {latestIssue && (
          <section className="py-16 sm:py-24 bg-primary/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
                  From Our Latest Issue
                </h2>
                <p className="text-muted-foreground mt-2">
                  {latestIssue.volumeTitle} - {latestIssue.title}
                </p>
              </div>
              <div className="max-w-4xl mx-auto">
                <ul className="space-y-4">
                  {latestIssue.articles?.map((article) => (
                     <li key={article.id} className="p-4 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all flex items-center justify-between gap-4">
                        <div>
                            <h3 className="font-headline font-semibold text-lg text-foreground">{article.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">By {article.authorName}</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                            <Link href={article.manuscriptUrl || '#'} target="_blank" rel="noopener noreferrer">
                                <BookText className="w-4 h-4 mr-2" /> Read
                            </Link>
                        </Button>
                    </li>
                  ))}
                </ul>
                <div className="text-center mt-12">
                   <Button asChild>
                    <Link href="/archive">
                      Explore All Issues <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      <footer className="bg-secondary/50 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
           <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                <div className="col-span-2 md:col-span-1 flex items-start flex-col gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Icons.logo className="h-8 w-8 text-primary" />
                        <h2 className="text-2xl font-bold font-headline text-foreground">
                            MJSTEM
                        </h2>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-2">ISSN (Print): 3121-6552</p>
                    <p className="text-sm text-muted-foreground">Barcode: 9773121655008</p>
                </div>
                <div className="md:col-span-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                         <div>
                            <h4 className="font-headline font-semibold mb-3">Journal</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/aims-scope" className="hover:text-primary">Aims & Scope</Link></li>
                                <li><Link href="/editorial-board" className="hover:text-primary">Editorial Board</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Authors</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/author-guidelines" className="hover:text-primary">Author Guidelines</Link></li>
                                <li><Link href="/dashboard/submissions/new" className="hover:text-primary">Submit</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-headline font-semibold mb-3">Information</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/for-readers" className="hover:text-primary">For Readers</Link></li>
                                <li><Link href="/for-authors" className="hover:text-primary">For Authors</Link></li>
                                <li><Link href="/for-librarians" className="hover:text-primary">For Librarians</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Account</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/login" className="hover:text-primary">Login</Link></li>
                                <li><Link href="/signup" className="hover:text-primary">Register</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
           </div>
           <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
              <p className="mb-2">The views expressed in articles published by MJSTEM are solely those of contributing authors. Therefore, the journal cannot be held liable for such opinions. MJSTEM is solely a scholarly publication meant to satisfy the intellectual needs of the academic community.</p>
              <p>© {new Date().getFullYear()} MJSTEM. All Rights Reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
