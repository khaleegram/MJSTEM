
import { PublicHeader } from '@/components/public-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ForReadersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-headline text-foreground">For Readers</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            Stay updated with the latest research from MJSTEM.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Get Notified of New Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We encourage readers to sign up for the publishing notification service for this journal. Use the <Link href="/signup" className="text-primary hover:underline">Register</Link> link at the top of the home page for the journal. This registration will result in the reader receiving the Table of Contents by email for each new issue of the journal. This list also allows the journal to claim a certain level of support or readership. 
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                See the journal's <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Statement</Link>, which assures readers that their name and email address will not be used for other purposes.
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
