
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Feather, Microscope, BookOpen, BookText } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { getLatestIssue } from '@/services/publication-service';
import { Icons } from '@/components/icons';

const HowItWorksCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/20 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
    <CardHeader className="flex flex-row items-center gap-4">
      <div className="bg-primary/10 text-primary p-3 rounded-lg">
        {icon}
      </div>
      <CardTitle className="font-headline text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{children}</p>
    </CardContent>
  </Card>
);

export default async function HomePage() {
  const latestIssue = await getLatestIssue();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative flex items-center justify-center text-center text-foreground py-24 md:py-32">
          <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] dark:bg-[linear-gradient(to_right,#1e1e1e_1px,transparent_1px),linear-gradient(to_bottom,#1e1e1e_1px,transparent_1px)]">
             <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--background)),transparent)] dark:bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--accent)),transparent)]"></div>
          </div>
          <div className="relative z-10 px-4">
             <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight drop-shadow-md">
                MJSTEM
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground drop-shadow-sm">
                A premier, peer-reviewed journal for science, technology, education, and management.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" asChild>
                    <Link href="/dashboard/submissions/new">Submit Your Manuscript</Link>
                </Button>
                 <Button size="lg" variant="outline" asChild>
                    <Link href="/archive">Browse Archives</Link>
                </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <HowItWorksCard icon={<Feather className="w-6 h-6"/>} title="1. Effortless Submission">
                    Our clear guidelines and intuitive submission portal make sharing your manuscript straightforward. Focus on your research, not the paperwork.
                </HowItWorksCard>
                 <HowItWorksCard icon={<Microscope className="w-6 h-6"/>} title="2. Rigorous Peer Review">
                    Benefit from constructive, double-blind peer review by experts in your field to ensure the quality and validity of your work.
                </HowItWorksCard>
                 <HowItWorksCard icon={<BookOpen className="w-6 h-6"/>} title="3. Timely Publication">
                    Accepted articles are formatted, assigned a DOI, and published online swiftly, ensuring your research reaches the global community without delay.
                </HowItWorksCard>
            </div>
          </div>
        </section>

        {latestIssue ? (
          <section className="py-16 sm:py-24 bg-accent/50">
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
        ) : (
             <section className="py-16 sm:py-24 bg-accent/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                     <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
                        Coming Soon
                    </h2>
                     <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                        Our first issue is currently being prepared for publication. Check back soon to read the latest research.
                    </p>
                </div>
            </section>
        )}

      </main>

      <footer className="bg-secondary/50 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="flex items-center gap-2">
                    <Icons.logo className="h-8 w-8 text-primary" />
                    <h2 className="text-2xl font-bold font-headline text-foreground">
                        MJSTEM
                    </h2>
                </div>
                <div className="md:col-span-3">
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
                            <h4 className="font-headline font-semibold mb-3">Explore</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/archive" className="hover:text-primary">Archives</Link></li>
                                <li><Link href="#" className="hover:text-primary">Most Read</Link></li>
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
           <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} MJSTEM. All Rights Reserved.
            </div>
        </div>
      </footer>
    </div>
  );
}
