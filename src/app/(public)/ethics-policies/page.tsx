import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Scale,
  Copyright,
  Sigma,
  Bot,
  ShieldCheck,
  Users,
  UserCheck,
  PenLine,
  Ban,
  FileWarning,
  Archive,
  Building2,
  ClipboardCheck,
  BookOpen,
  Landmark,
  ArrowRight,
  ListChecks,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BASE_URL } from '@/lib/seo';
import {
  AUTHOR_RESPONSIBILITIES,
  REVIEWER_RESPONSIBILITIES,
  EDITOR_RESPONSIBILITIES,
  EDITOR_DECISION_NON_DISCRIMINATION,
  PLAGIARISM_POLICY,
  RETRACTION_POLICY,
} from '@/content/ethics-policies';
import {
  PUBLICATION_ETHICS_HUB_SUMMARIES,
  DIGITAL_PRESERVATION,
  PUBLISHER_INFO,
  AI_POLICY,
  COPYRIGHT_LICENSING,
} from '@/content/journal-policies';

export const metadata: Metadata = {
  title: 'Ethics & Policies | MJSTEM',
  description:
    'Publication ethics and policies for the Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM): responsibilities, plagiarism, corrections and retractions, digital preservation, and links to detailed policy pages.',
  alternates: { canonical: `${BASE_URL}/ethics-policies` },
  robots: { index: true, follow: true },
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

const HUB_LINKS = [
  {
    href: '/peer-review-policy',
    label: 'Peer Review Policy',
    description: 'Our full double-blind peer review process, from screening to appeals.',
    icon: ClipboardCheck,
  },
  {
    href: '/editorial-policies',
    label: 'Editorial Policies',
    description: 'Editorial independence, conflict of interest, authorship, and AI use.',
    icon: BookOpen,
  },
  {
    href: '/publication-ethics',
    label: 'Publication Ethics',
    description: 'Integrity, plagiarism, misconduct, corrections, complaints, and withdrawal.',
    icon: ShieldCheck,
  },
  {
    href: '/publishing-information',
    label: 'Publishing Information',
    description: 'Publisher, affiliation, licensing, charges, preservation, and contact.',
    icon: Landmark,
  },
  {
    href: '/about-journal',
    label: 'About the Journal',
    description: 'Aims and scope, publication frequency, open access, and indexing.',
    icon: Building2,
  },
] as const;

const SUMMARY_ITEMS = [
  { label: 'Author Fees / APCs', text: PUBLICATION_ETHICS_HUB_SUMMARIES.apc },
  { label: 'Copyright', text: PUBLICATION_ETHICS_HUB_SUMMARIES.copyright },
  { label: 'Plagiarism / Originality', text: PUBLICATION_ETHICS_HUB_SUMMARIES.plagiarism },
  { label: 'Research Misconduct', text: PUBLICATION_ETHICS_HUB_SUMMARIES.researchMisconduct },
  { label: 'Peer Review', text: PUBLICATION_ETHICS_HUB_SUMMARIES.peerReview },
  { label: 'Authorship', text: PUBLICATION_ETHICS_HUB_SUMMARIES.authorship },
  { label: 'Conflict of Interest', text: PUBLICATION_ETHICS_HUB_SUMMARIES.conflictOfInterest },
  { label: 'Funding', text: PUBLICATION_ETHICS_HUB_SUMMARIES.funding },
  { label: 'Research Ethics', text: PUBLICATION_ETHICS_HUB_SUMMARIES.researchEthics },
  { label: 'Data Availability', text: PUBLICATION_ETHICS_HUB_SUMMARIES.dataAvailability },
  { label: 'Corrections & Retractions', text: PUBLICATION_ETHICS_HUB_SUMMARIES.corrections },
  { label: 'Complaints', text: PUBLICATION_ETHICS_HUB_SUMMARIES.complaints },
  { label: 'Digital Preservation', text: PUBLICATION_ETHICS_HUB_SUMMARIES.digitalPreservation },
  { label: 'Artificial Intelligence', text: PUBLICATION_ETHICS_HUB_SUMMARIES.ai },
  { label: 'Editorial Independence', text: PUBLICATION_ETHICS_HUB_SUMMARIES.editorialIndependence },
  { label: 'COPE', text: PUBLICATION_ETHICS_HUB_SUMMARIES.cope },
] as const;

const SECTION_NAV = [
  { href: '#author-responsibilities', label: 'Authors' },
  { href: '#reviewer-responsibilities', label: 'Reviewers' },
  { href: '#editor-responsibilities', label: 'Editors' },
  { href: '#plagiarism-policy', label: 'Plagiarism' },
  { href: '#retraction-policy', label: 'Corrections & Retractions' },
  { href: '#digital-preservation', label: 'Digital Preservation' },
  { href: '#publisher-information', label: 'Publisher' },
] as const;

export default function EthicsPoliciesPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-bold font-headline text-foreground">Ethics &amp; Policies</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto leading-relaxed">
          Our commitment to maintaining the highest standards of publication ethics, aligned with
          the Committee on Publication Ethics (COPE) and internationally recognised indexing and
          publishing requirements.
        </p>
        <nav
          aria-label="Policy sections"
          className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-sm"
        >
          {SECTION_NAV.map((link, index) => (
            <span key={link.href} className="inline-flex items-center gap-3">
              {index > 0 && (
                <span className="text-muted-foreground/40" aria-hidden>
                  •
                </span>
              )}
              <a href={link.href} className="text-primary hover:underline">
                {link.label}
              </a>
            </span>
          ))}
        </nav>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Detailed Policy Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HUB_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-start gap-3 rounded-lg border bg-secondary/40 p-4 transition-colors hover:bg-secondary"
                  >
                    <Icon className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        {link.label}
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                      </p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <ListChecks /> Publication Ethics and Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {SUMMARY_ITEMS.map((item) => (
              <div key={item.label} className="space-y-1">
                <h3 className="font-semibold text-foreground">{item.label}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Scale /> Author Fees / APCs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              MJSTEM does not charge fees for submission, processing, or publication. There are no
              Article Processing Charges (APCs). We are committed to open access for all, without
              financial barriers for authors or readers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Copyright /> Copyright and Licensing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{COPYRIGHT_LICENSING.intro}</p>
            <p className="text-muted-foreground leading-relaxed">
              All articles are published under the{' '}
              <a
                href={COPYRIGHT_LICENSING.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {COPYRIGHT_LICENSING.licenseName}
              </a>
              . This license allows others to distribute, remix, adapt, and build upon the work,
              even commercially, as long as they credit the original author(s). Authors grant MJSTEM
              the right to publish and distribute their work online as the original publisher.
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
              Manuscripts must be the original work of the author(s). The acceptable similarity level
              is 15%, assessed in context. Submissions exceeding this threshold may be returned for
              revision or rejected, depending on the nature of the overlap.
            </p>
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

            <p className="text-muted-foreground leading-relaxed">
              For a plain-language overview, see the{' '}
              <Link href="/publication-ethics" className="text-primary hover:underline">
                Publication Ethics
              </Link>{' '}
              page.
            </p>
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
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{AI_POLICY.intro}</p>
            <PolicyList items={AI_POLICY.points} />
          </CardContent>
        </Card>

        <Card id="digital-preservation" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Archive /> Digital Preservation and Archiving Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{DIGITAL_PRESERVATION.intro}</p>
            <PolicyList items={DIGITAL_PRESERVATION.points} />
            <p className="text-muted-foreground leading-relaxed">
              {DIGITAL_PRESERVATION.permanentAccessibility}
            </p>
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
              <span className="font-semibold text-foreground">Journal:</span>{' '}
              {PUBLISHER_INFO.journalName}
            </p>
            <p>
              <span className="font-semibold text-foreground">Published by:</span>{' '}
              {PUBLISHER_INFO.publisherName}
            </p>
            <div>
              <p className="font-semibold text-foreground mb-1">Postal Address</p>
              {PUBLISHER_INFO.postalAddress.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p>
              <span className="font-semibold text-foreground">Email:</span>{' '}
              <a
                href={`mailto:${PUBLISHER_INFO.contactEmail}`}
                className="text-primary hover:underline"
              >
                {PUBLISHER_INFO.contactEmail}
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
            <p>{PUBLISHER_INFO.statement}</p>
            <p>
              For full publishing details, see the{' '}
              <Link href="/publishing-information" className="text-primary hover:underline">
                Publishing Information
              </Link>{' '}
              page.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
