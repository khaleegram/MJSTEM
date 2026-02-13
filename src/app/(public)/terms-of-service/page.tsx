
import { Scale, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-headline text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
          Please read these terms carefully before using our services.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><Scale /> Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the MJSTEM website and its services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to all the terms and conditions, then you may not access the website or use any services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><Users /> User Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              As a user of this platform (whether as an author, reviewer, or editor), you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and current information upon registration and maintain the accuracy of your information.</li>
              <li>Maintain the confidentiality of your account and password.</li>
              <li>Uphold the highest standards of academic and publication ethics. This includes ensuring all submitted work is original and not under consideration by another journal.</li>
              <li>Not use the service for any illegal or unauthorized purpose.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><FileText /> Copyright and Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                  Authors retain copyright of their work. All articles published by MJSTEM are distributed under the <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Creative Commons Attribution 4.0 International License (CC BY 4.0)</a>.
              </p>
              <p>
                  By submitting your manuscript, you grant MJSTEM a license to publish the article and identify itself as the original publisher.
              </p>
              <p>
                  The editorial team reserves the right to reject or remove any content that it deems, in its sole discretion, to be in violation of these terms or the journal's policies.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              The views expressed in articles published by MJSTEM are solely those of the contributing authors and do not necessarily reflect the views of the editorial board or the publisher. The service is provided on an "as is" and "as available" basis without any warranties of any kind.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
