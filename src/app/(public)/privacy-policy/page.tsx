
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-headline text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
          Your privacy is important to us. This policy explains what information we collect and how we use it.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><ShieldCheck /> Our Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              The names and email addresses entered in this journal site will be used exclusively for the stated purposes of this journal and will not be made available for any other purpose or to any other party.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              We collect information from you when you register on our site, submit a manuscript, or perform a review. The information collected includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Identification Information:</strong> Name, email address, ORCID iD, and institutional affiliation.</li>
              <li><strong>Manuscript Data:</strong> Any information contained within the manuscripts you submit, including text, figures, and supplementary materials.</li>
              <li><strong>Review Data:</strong> Comments and recommendations you provide during the peer-review process.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              The information we collect is used in the following ways:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To manage your account and facilitate your use of our submission and peer review system.</li>
              <li>To communicate with you regarding your submissions, reviews, or other journal-related activities.</li>
              <li>To manage the editorial and peer-review process for manuscripts.</li>
              <li>To publish accepted manuscripts, which includes author names and affiliations.</li>
              <li>To send registered users notifications about new journal issues or important updates (if opted-in).</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Data Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              We implement a variety of security measures to maintain the safety of your personal information. Your data is stored on secure servers, and all communications with our platform are encrypted.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
