
import { PublicHeader } from '@/components/public-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ForLibrariansPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-headline text-foreground">For Librarians</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            Information for including MJSTEM in your library's holdings.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Electronic Journal Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We encourage research librarians to list this journal among their library's electronic journal holdings. 
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                As well, it may be worth noting that this journal's open source publishing system is suitable for libraries to host for their faculty members to use with journals they are involved in editing (see <a href="https://pkp.sfu.ca/ojs/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open Journal Systems</a>).
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
