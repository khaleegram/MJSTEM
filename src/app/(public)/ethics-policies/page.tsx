import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Scale,
  Copyright,
  Sigma,
  Bot,
  ShieldCheck,
  Users,
  UserCheck,
  PenLine,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  ShieldAlert,
  MessageSquareWarning,
  FileWarning,
  Eye,
  Archive,
  Building2,
  Ban,
} from 'lucide-react';
import {
  AUTHOR_RESPONSIBILITIES,
  REVIEWER_RESPONSIBILITIES,
  EDITOR_RESPONSIBILITIES,
  EDITOR_DECISION_NON_DISCRIMINATION,
  CONFLICTS_OF_INTEREST,
  AUTHORSHIP_CRITERIA,
  AUTHORSHIP_ACKNOWLEDGEMENT,
  HUMAN_ANIMAL_RESEARCH,
  RESEARCH_INTEGRITY_PROHIBITED,
  RESEARCH_INTEGRITY_CONSEQUENCES,
  COMPLAINTS_AND_APPEALS,
  CORRECTIONS_AND_RETRACTIONS_SUMMARY,
  ETHICAL_OVERSIGHT,
  RETRACTION_POLICY,
  DIGITAL_PRESERVATION_POLICY,
  PUBLISHER_INFO,
  PLAGIARISM_POLICY,
} from '@/content/ethics-policies';

export const metadata = {
  title: 'Ethics & Policies | MJSTEM',
  description:
    'Publication ethics, author/editor/reviewer responsibilities, plagiarism, retraction, and digital preservation policies for MJSTEM.',
};

function PolicyList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SectionNav() {
  const links = [
    { href: '#author-responsibilities', label: 'Authors' },
    { href: '#reviewer-responsibilities', label: 'Reviewers' },
    { href: '#editor-responsibilities', label: 'Editors' },
    { href: '#conflicts-of-interest', label: 'Conflicts of Interest' },
    { href: '#authorship', label: 'Authorship' },
    { href: '#human-animal-research', label: 'Human & Animal Research' },
    { href: '#research-integrity', label: 'Research Integrity' },
    { href: '#plagiarism-policy', label: 'Plagiarism' },
    { href: '#complaints-appeals', label: 'Complaints & Appeals' },
    { href: '#retraction-policy', label: 'Corrections & Retractions' },
    { href: '#ethical-oversight', label: 'Ethical Oversight' },
    { href: '#digital-preservation', label: 'Digital Preservation' },
    { href: '#publisher-information', label: 'Publisher' },
  ];

  return (
    <nav aria-label="Policy sections" className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-sm">
      {links.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-3">
          {index > 0 && <span className="text-muted-foreground/40" aria-hidden>•</span>}
          <a href={link.href} className="text-primary hover:underline">
            {link.label}
          </a>
        </span>
      ))}
    </nav>
  );
}

export default function EthicsPoliciesPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-bold font-headline text-foreground">Ethics & Policies</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
          Our commitment to maintaining the highest standards of publication ethics, aligned with
          internationally recognised indexing and publishing requirements.
        </p>
        <SectionNav />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Scale /> Author Fees / APCs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              MJSTEM does not charge fees for submission, processing, or publication. We are
              committed to open access for all, without financial barriers for authors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Copyright /> Copyright and Licensing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Authors retain full copyright of their work. All articles are published under the{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Creative Commons Attribution 4.0 International License (CC BY 4.0)
              </a>
              . This license allows others to distribute, remix, adapt, and build upon your work,
              even commercially, as long as they credit you for the original creation. Authors grant
              MJSTEM the right to publish and distribute their work online as the original publisher.
            </p>
          </CardContent>
        </Card>

        <Card id="author-responsibilities" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <PenLine /> Responsibilities of Authors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Authors submitting manuscripts to MJSTEM must ensure that:
            </p>
            <PolicyList items={AUTHOR_RESPONSIBILITIES} />
          </CardContent>
        </Card>

        <Card id="reviewer-responsibilities" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <UserCheck /> Responsibilities of Reviewers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">Peer reviewers are expected to:</p>
            <PolicyList items={REVIEWER_RESPONSIBILITIES} />
          </CardContent>
        </Card>

        <Card id="editor-responsibilities" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Users /> Responsibilities of Editors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">Editors shall:</p>
            <PolicyList items={EDITOR_RESPONSIBILITIES} />
            <p className="text-muted-foreground leading-relaxed">{EDITOR_DECISION_NON_DISCRIMINATION}</p>
          </CardContent>
        </Card>

        <Card id="conflicts-of-interest" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <AlertTriangle /> Conflicts of Interest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PolicyList items={CONFLICTS_OF_INTEREST} />
          </CardContent>
        </Card>

        <Card id="authorship" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <BookOpen /> Authorship
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Authorship should reflect substantial intellectual contributions to:
            </p>
            <PolicyList items={AUTHORSHIP_CRITERIA} />
            <p className="text-muted-foreground leading-relaxed">{AUTHORSHIP_ACKNOWLEDGEMENT}</p>
          </CardContent>
        </Card>

        <Card id="human-animal-research" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <FlaskConical /> Human and Animal Research
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{HUMAN_ANIMAL_RESEARCH.intro}</p>
            <p className="text-muted-foreground leading-relaxed">Authors should provide:</p>
            <PolicyList items={HUMAN_ANIMAL_RESEARCH.authorsShouldProvide} />
          </CardContent>
        </Card>

        <Card id="research-integrity" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <ShieldAlert /> Research Integrity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">MJSTEM does not tolerate:</p>
            <PolicyList items={RESEARCH_INTEGRITY_PROHIBITED} />
            <p className="text-muted-foreground leading-relaxed">{RESEARCH_INTEGRITY_CONSEQUENCES}</p>
          </CardContent>
        </Card>

        <Card id="plagiarism-policy" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Ban /> Plagiarism Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">{PLAGIARISM_POLICY.intro}</p>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Similarity Screening</h3>
              <PolicyList items={PLAGIARISM_POLICY.similarityScreening} />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Forms of Plagiarism</h3>
              <p className="text-muted-foreground leading-relaxed">
                The journal considers the following unacceptable:
              </p>
              <PolicyList items={PLAGIARISM_POLICY.formsOfPlagiarism} />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Editorial Procedure</h3>
              <p className="text-muted-foreground leading-relaxed">Where plagiarism is suspected:</p>
              <PolicyList items={PLAGIARISM_POLICY.editorialProcedure} />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Consequences</h3>
              <p className="text-muted-foreground leading-relaxed">
                Confirmed plagiarism may result in:
              </p>
              <PolicyList items={PLAGIARISM_POLICY.consequences} />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">COPE Compliance</h3>
              <p className="text-muted-foreground leading-relaxed">
                {PLAGIARISM_POLICY.copeCompliance}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Sigma /> Similarity Threshold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Manuscripts must be the original work of the author(s). The acceptable similarity
              level is ≤15%. Submissions exceeding this threshold may be returned for revision or
              rejected, depending on the nature of the overlap.
            </p>
          </CardContent>
        </Card>

        <Card id="complaints-appeals" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <MessageSquareWarning /> Complaints and Appeals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PolicyList items={COMPLAINTS_AND_APPEALS} />
          </CardContent>
        </Card>

        <Card id="corrections-retractions" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <FileWarning /> Corrections and Retractions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PolicyList items={CORRECTIONS_AND_RETRACTIONS_SUMMARY} />
          </CardContent>
        </Card>

        <Card id="retraction-policy" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <FileWarning /> Retraction, Corrections and Expressions of Concern Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Purpose</h3>
              <p className="text-muted-foreground leading-relaxed">{RETRACTION_POLICY.purpose}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Corrections</h3>
              <p className="text-muted-foreground leading-relaxed">
                Corrections may be published where:
              </p>
              <PolicyList items={RETRACTION_POLICY.correctionsMayBePublishedWhere} />
              <p className="text-muted-foreground leading-relaxed">
                {RETRACTION_POLICY.correctionsNote}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Retractions</h3>
              <p className="text-muted-foreground leading-relaxed">
                An article may be retracted where evidence demonstrates:
              </p>
              <PolicyList items={RETRACTION_POLICY.retractionEvidence} />
              <p className="text-muted-foreground leading-relaxed">
                {RETRACTION_POLICY.retractionNote}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Expressions of Concern</h3>
              <p className="text-muted-foreground leading-relaxed">
                {RETRACTION_POLICY.expressionOfConcern}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Investigation Procedure</h3>
              <PolicyList items={RETRACTION_POLICY.investigationProcedure} />
            </div>
          </CardContent>
        </Card>

        <Card id="ethical-oversight" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Eye /> Ethical Oversight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PolicyList items={ETHICAL_OVERSIGHT} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <ShieldCheck /> COPE Compliance Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              MJSTEM adheres to the principles and core practices of the{' '}
              <a
                href="https://publicationethics.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Committee on Publication Ethics (COPE)
              </a>
              . Our editorial team follows COPE&apos;s guidelines in handling cases of suspected
              misconduct, including plagiarism, data fabrication/falsification, duplicate
              publication, authorship disputes, or conflicts of interest.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Bot /> Use of Artificial Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              AI tools (such as large language models) may only be used as a supportive aid for
              improving the language and readability of a manuscript. AI and AI-assisted
              technologies cannot be listed as authors. Authors remain fully responsible and
              accountable for the originality, accuracy, and integrity of their work. The use of AI
              to generate content, manipulate data, or misrepresent findings is strictly prohibited.
              Undisclosed use of artificial intelligence in generating scientific findings is not
              tolerated.
            </p>
          </CardContent>
        </Card>

        <Card id="digital-preservation" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Archive /> Digital Preservation and Archiving Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Digital Preservation</h3>
              <PolicyList items={DIGITAL_PRESERVATION_POLICY.digitalPreservation} />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Website Backup</h3>
              <p className="text-muted-foreground leading-relaxed">
                {DIGITAL_PRESERVATION_POLICY.websiteBackup}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Permanent Accessibility</h3>
              <p className="text-muted-foreground leading-relaxed">
                {DIGITAL_PRESERVATION_POLICY.permanentAccessibility}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card id="publisher-information" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Building2 /> Publisher Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span className="font-semibold text-foreground">Publisher / Journal:</span>{' '}
              {PUBLISHER_INFO.journalName}
            </p>
            <p>
              <span className="font-semibold text-foreground">Published by:</span>{' '}
              {PUBLISHER_INFO.publishedByPlaceholder}
            </p>
            <div>
              <p className="font-semibold text-foreground mb-1">Postal Address</p>
              {PUBLISHER_INFO.postalAddressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p>
              <span className="font-semibold text-foreground">Email:</span>{' '}
              <a href={`mailto:${PUBLISHER_INFO.email}`} className="text-primary hover:underline">
                {PUBLISHER_INFO.email}
              </a>
            </p>
            <p>
              <span className="font-semibold text-foreground">Website:</span>{' '}
              <a
                href={PUBLISHER_INFO.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {PUBLISHER_INFO.website}
              </a>
            </p>
            <div>
              <p className="font-semibold text-foreground mb-1">Editorial Office</p>
              <p>{PUBLISHER_INFO.editorialOffice}</p>
            </div>
            <p className="text-sm italic">{PUBLISHER_INFO.pendingNote}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
