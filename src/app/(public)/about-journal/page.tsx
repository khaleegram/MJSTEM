import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Info,
  Target,
  Layers,
  Users,
  CalendarDays,
  Unlock,
  ClipboardCheck,
  Library,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { BASE_URL } from '@/lib/seo';
import {
  AIMS_AND_SCOPE,
  EDITORIAL_RESPONSIBILITY,
  PUBLICATION_FREQUENCY,
  OPEN_ACCESS_POLICY,
  PEER_REVIEW_POLICY_SUMMARY,
  INDEXING_AND_ABSTRACTING,
  ARCHIVAL_POLICY,
} from '@/content/journal-policies';

export const metadata: Metadata = {
  title: 'About the Journal | MJSTEM',
  description:
    'About the Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM): aims and scope, editorial responsibility, quarterly open-access publishing, peer review, indexing, and archiving.',
  alternates: { canonical: `${BASE_URL}/about-journal` },
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

export default function AboutJournalPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-headline text-foreground">About the Journal</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto leading-relaxed">
          The Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM) is
          an international, peer-reviewed, open-access journal fostering interdisciplinary research
          and scholarly exchange across diverse fields.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card id="aims-and-scope" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Target /> Aims and Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {AIMS_AND_SCOPE.aims.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
            <div className="mt-2 flex items-start gap-3 rounded-lg border bg-secondary/50 p-4">
              <Info className="w-8 h-8 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold">Open Access</h4>
                <p className="text-sm text-muted-foreground">
                  This is an open-access journal. All articles are distributed under the terms of the
                  Creative Commons Attribution 4.0 International License (CC BY 4.0).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="scope" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Layers /> Subject Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              MJSTEM welcomes submissions from a wide range of fields. We are particularly interested
              in manuscripts that present novel ideas, new theoretical frameworks, or empirical
              results with broad implications. The main subject areas covered include, but are not
              limited to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground">
              {AIMS_AND_SCOPE.subjectAreas.map((area) => (
                <span key={area}>- {area}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card id="editorial-responsibility" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Users /> Editorial Responsibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{EDITORIAL_RESPONSIBILITY.intro}</p>
            <PolicyList items={EDITORIAL_RESPONSIBILITY.points} />
          </CardContent>
        </Card>

        <Card id="publication-frequency" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <CalendarDays /> Publication Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{PUBLICATION_FREQUENCY.summary}</p>
          </CardContent>
        </Card>

        <Card id="open-access" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Unlock /> Open Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{OPEN_ACCESS_POLICY.intro}</p>
            <PolicyList items={OPEN_ACCESS_POLICY.points} />
          </CardContent>
        </Card>

        <Card id="peer-review" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <ClipboardCheck /> Peer Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{PEER_REVIEW_POLICY_SUMMARY.intro}</p>
            <p className="text-muted-foreground leading-relaxed">
              <Link href="/peer-review-policy" className="text-primary hover:underline">
                Read the full Peer Review Policy
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card id="indexing" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Library /> Indexing and Abstracting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{INDEXING_AND_ABSTRACTING.summary}</p>
          </CardContent>
        </Card>

        <Card id="archival-policy" className="scroll-mt-28">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Archive /> Archival Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{ARCHIVAL_POLICY.summary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
              <Users /> Editorial Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Our Editorial Board comprises experienced scholars who guide the journal&apos;s
              academic direction and uphold its standards.{' '}
              <Link href="/editorial-board" className="text-primary hover:underline inline-flex items-center gap-1">
                Meet the Editorial Board <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
