
import { PublicHeader } from '@/components/public-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { AuthorGuidelinesPage } from '../author-guidelines/page';

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
    <span className="text-muted-foreground">{children}</span>
  </li>
);

export default function AimsScopePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-headline text-foreground">Aims & Scope</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            Our mission is to foster interdisciplinary research and provide a platform for scholarly exchange across diverse fields.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                The Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM) is an international, peer-reviewed, open-access journal dedicated to the rapid publication of high-quality, original research articles, reviews, and short communications. Our mission is to bridge the gaps between diverse disciplines, fostering a rich environment for collaboration and innovation. We believe that the most significant scientific breakthroughs often occur at the intersection of different fields of study.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Aims of the Journal</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <ListItem>
                  To publish cutting-edge research that spans multiple disciplines, including but not limited to science, technology, education, and management.
                </ListItem>
                <ListItem>
                  To provide a reputable platform for academics and researchers to disseminate their findings to a global audience.
                </ListItem>
                <ListItem>
                  To promote interdisciplinary collaboration and the cross-pollination of ideas.
                </ListItem>
                <ListItem>
                  To maintain the highest standards of academic integrity and peer review, ensuring the quality and validity of all published works.
                </ListItem>
                <ListItem>
                  To make scholarly knowledge freely and openly accessible to all, supporting the global advancement of research and education.
                </ListItem>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Scope of the Journal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                MJSTEM welcomes submissions from a wide range of fields. We are particularly interested in manuscripts that present novel ideas, new theoretical frameworks, or empirical results with broad implications. The main subject areas covered by the journal include, but are not limited to:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground">
                    <span>- Engineering and Technology</span>
                    <span>- Life Sciences and Biology</span>
                    <span>- Physical Sciences</span>
                    <span>- Computer Science & AI</span>
                    <span>- Educational Theory and Practice</span>
                    <span>- Higher Education Management</span>
                    <span>- Business and Economics</span>
                    <span>- Public Administration</span>
                    <span>- Social Sciences and Humanities</span>
                    <span>- Health and Medical Sciences</span>
                    <span>- Technical Vocational Education and Training (TVET)</span>
                    <span>- Cyber Security</span>
                    <span>- Science Education</span>
                    <span>- Educational Technology</span>
                    <span>- Data Science</span>
                    <span>- Library and Information Technology/Science</span>
              </div>
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
