
import { PublicHeader } from '@/components/public-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Copyright, Sigma, Bot, ShieldCheck } from 'lucide-react';

export default function EthicsPoliciesPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-headline text-foreground">Ethics & Policies</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
          Our commitment to maintaining the highest standards of publication ethics.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><Scale /> Author Fees / APCs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              MJSTEM does not charge fees for submission, processing, or publication. We are committed to open access for all, without financial barriers for authors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><Copyright /> Copyright and Licensing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Authors retain full copyright of their work. All articles are published under the <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Creative Commons Attribution 4.0 International License (CC BY 4.0)</a>. This license allows others to distribute, remix, adapt, and build upon your work, even commercially, as long as they credit you for the original creation. Authors grant MJSTEM the right to publish and distribute their work online as the original publisher.
            </p>
          </CardContent>
        </Card>

          <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><Sigma /> Plagiarism and Publication Ethics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Manuscripts must be the original work of the author(s). The acceptable similarity level for plagiarism is **≤15%**. Submissions exceeding this threshold will be returned to the authors for correction or rejected outright.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Plagiarism, data fabrication, falsification, and other forms of unethical behavior are strictly prohibited and will be addressed with serious consequences, including but not limited to rejection of the manuscript, retraction of the published article, and notification of the authors' institutions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><ShieldCheck /> COPE Compliance Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              MJSTEM adheres to the principles and core practices of the <a href="https://publicationethics.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Committee on Publication Ethics (COPE)</a>. Our editorial team follows COPE's guidelines in handling cases of suspected misconduct, including plagiarism, data fabrication/falsification, duplicate publication, authorship disputes, or conflicts of interest.
            </p>
          </CardContent>
        </Card>

          <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3"><Bot /> Use of Artificial Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              AI tools (such as large language models) may only be used as a supportive aid for improving the language and readability of a manuscript. AI and AI-assisted technologies cannot be listed as authors. Authors remain fully responsible and accountable for the originality, accuracy, and integrity of their work. The use of AI to generate content, manipulate data, or misrepresent findings is strictly prohibited.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
