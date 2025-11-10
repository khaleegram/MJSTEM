
import { PublicHeader } from '@/components/public-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ForAuthorsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-headline text-foreground">For Authors</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            Information on how to submit your work to MJSTEM.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Interested in Submitting?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Interested in submitting to this journal? We recommend that you review the <Link href="/aims-scope" className="text-primary hover:underline">Aims & Scope</Link> page for the journal's section policies, as well as the <Link href="/author-guidelines" className="text-primary hover:underline">Author Guidelines</Link>.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Authors need to <Link href="/signup" className="text-primary hover:underline">register</Link> with the journal prior to submitting or, if already registered, can simply <Link href="/login" className="text-primary hover:underline">log in</Link> and begin the five-step process.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
          <p className="mb-2">ISSN (Print): 3121-6552 | Barcode: 9773121655008</p>
          © {new Date().getFullYear()} MJSTEM. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
