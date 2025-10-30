import { Check, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicHeader } from '@/components/public-header';

const ChecklistItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
    <span className="text-muted-foreground">{children}</span>
  </li>
);

const StructuredAbstractItem = ({ title, description }: { title: string, description: string }) => (
    <div>
        <h4 className="font-bold font-headline text-foreground">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
    </div>
)

export default function AuthorGuidelinesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
        <PublicHeader />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
             <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold font-headline text-foreground">Author Guidelines</h1>
                <p className="text-muted-foreground mt-2">Everything you need to know to prepare your submission.</p>
             </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Manuscript Submission Guidelines</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                               <ChecklistItem>
                                The submission <strong>has not been previously published</strong>, nor is it under consideration by another journal (unless an explanation is provided in the Comments to the Editor).
                               </ChecklistItem>
                               <ChecklistItem>
                                Manuscripts <strong>must be submitted in Microsoft Word format</strong>.
                               </ChecklistItem>
                               <ChecklistItem>
                               The text is <strong>single line-spaced</strong>, uses a <strong>12-point font</strong>, <strong>Times New Roman</strong> font style, and <strong>1-inch margins</strong> on all sides.
                               </ChecklistItem>
                               <ChecklistItem>
                                <strong>British spelling</strong> is used throughout the manuscript, except in direct quotations.
                               </ChecklistItem>
                                <ChecklistItem>
                               Italics are used for emphasis; <strong>underlining is avoided</strong>, except in URL addresses.
                               </ChecklistItem>
                               <ChecklistItem>
                               Figures and tables are <strong>numbered</strong>, referred to in the text, and <strong>placed within the text</strong> at appropriate points—not at the end.
                               </ChecklistItem>
                               <ChecklistItem>
                               The title of the manuscript appears <strong>Center-aligned</strong> on the first page.
                               </ChecklistItem>
                                <ChecklistItem>
                               Author names and institutional affiliations are listed <strong>below the title on the title page only</strong>.
                               </ChecklistItem>
                               <ChecklistItem>
                               The main document is <strong>anonymised</strong>, with no identifying author information.
                               </ChecklistItem>
                               <ChecklistItem>
                               A <strong>separate title page</strong> includes:
                               <ul className='list-disc pl-6 mt-2 space-y-1'>
                                    <li>Full names of all authors</li>
                                    <li>Institutional affiliations</li>
                                    <li>Corresponding author's email address</li>
                                    <li><strong>ORCID iDs</strong> (e.g., <a href="https://orcid.org/0000-0000-0000-0000" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://orcid.org/0000-0000-0000-0000</a>)</li>
                               </ul>
                               </ChecklistItem>
                               <ChecklistItem>
                                The number of authors and their details <strong>must match</strong> the information entered in the journal's online submission system. Inconsistencies may result in <strong>omitted author names</strong>.
                                </ChecklistItem>
                                <ChecklistItem>
                                The <strong>structured abstract</strong> (maximum 250 words) follows the format provided in the Author Guidelines.
                                </ChecklistItem>
                                 <ChecklistItem>
                                <strong>Keywords</strong> are listed below the abstract.
                                </ChecklistItem>
                                <ChecklistItem>
                                The manuscript is <strong>no more than 5,000 words</strong>, including references.
                                </ChecklistItem>
                                <ChecklistItem>
                                Manuscript originality <strong>should not exceed 15%</strong>
                                </ChecklistItem>
                                 <ChecklistItem>
                                <strong>No AI generated content is accepted</strong>
                                </ChecklistItem>
                                <ChecklistItem>
                                The manuscript should be divided into <strong>clearly labelled sections and subsections</strong>.
                                </ChecklistItem>
                                 <ChecklistItem>
                                The total number of references <strong>should not exceed 25</strong>, except for systematic reviews.
                                </ChecklistItem>
                                <ChecklistItem>
                                References and in-text citations follow <strong>APA 7th Edition</strong>.
                                </ChecklistItem>
                                <ChecklistItem>
                                Where available, <strong>URLs for references</strong> should be provided.
                                </ChecklistItem>
                            </ul>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Author Guidelines</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-bold text-lg font-headline">Referencing Style</h3>
                                <p className="text-muted-foreground">References and in-text citations follow APA 7th Edition.</p>
                            </div>
                             <div>
                                <h3 className="font-bold text-lg font-headline">Originality of Submissions</h3>
                                <p className="text-muted-foreground">We take the issue of plagiarism very seriously. Manuscript originality should not exceed 15%. All submissions will be subjected to originality checks and if the similarity level is more than the allowed percentage it will be returned to the author(s) to correct before proceeding to the next round of review. No AI generated content is accepted.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg font-headline">Structured Abstract</h3>
                                <div className="space-y-4 mt-2">
                                <StructuredAbstractItem 
                                    title="Background"
                                    description="In the background, contributors are discouraged from citations. The background should simply set the stage for the study. Conceivably, it should give an insight into the work, why the topic is important, and why the study is worth conducting."
                                />
                                <StructuredAbstractItem 
                                    title="The objective of the study"
                                    description="The objective of the study should clearly state the problem to be solved."
                                />
                                <StructuredAbstractItem 
                                    title="Methodology"
                                    description="This should indicate how the research was carried out as well as the designs that were adopted to achieve the study objectives. The sample size, sampling procedure for selection of respondents, and instruments for data collection for the study should be clearly stated as well. The method(s) of data analysis utilized and mode of data presentation should be indicated. Issues like validity and reliability should be addressed."
                                />
                                <StructuredAbstractItem 
                                    title="Results"
                                    description="Results should be presented in clear and simple language."
                                />
                                <StructuredAbstractItem 
                                    title="Unique Contribution"
                                    description="The researcher should state the distinctive contribution of his/her manuscript to past or existing knowledge by highlighting its practical, theoretical, or scholarly contributions."
                                />
                                <StructuredAbstractItem 
                                    title="Conclusion"
                                    description="The conclusion should be handled with seriousness. The contributors should concisely sum up the study."
                                />
                                 <StructuredAbstractItem 
                                    title="Key Recommendation"
                                    description="Here, recommendations for further studies on the research topic should be stated."
                                />
                                </div>
                            </div>
                             <div>
                                <h3 className="font-bold text-lg font-headline">How to Submit</h3>
                                <p className="text-muted-foreground">Register as a user and follow the instructions to submit your manuscript.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Copyright Notice</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Copyright belongs to the authors.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Privacy Statement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">The names and email addresses entered in this journal site will be used exclusively for the stated purposes of this journal and will not be made available for any other purpose or to any other party.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Editorial Disclaimer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">The views expressed in articles published by MJSTEM are solely those of contributing authors. Therefore, the journal cannot be held liable for such opinions.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">ISSN</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Not yet assigned.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
        <footer className="bg-background border-t">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} MJSTEM. All Rights Reserved.
            </div>
        </footer>
    </div>
  );
}
