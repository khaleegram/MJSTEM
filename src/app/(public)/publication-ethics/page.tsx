import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Ban, ShieldAlert, FileWarning, MessageSquareWarning, LogOut } from 'lucide-react';
import { BASE_URL } from '@/lib/seo';
import {
  PolicyPageShell,
  PolicySection,
  PolicyList,
  PolicyParagraph,
} from '@/components/policies/policy-page';
import {
  PUBLICATION_ETHICS_AND_INTEGRITY,
  PUBLICATION_ETHICS_HUB_SUMMARIES,
  CORRECTIONS_AND_RETRACTIONS,
  COMPLAINTS_POLICY,
  APPEALS_POLICY,
  MANUSCRIPT_WITHDRAWAL,
} from '@/content/journal-policies';

export const metadata: Metadata = {
  title: 'Publication Ethics & Research Integrity | MJSTEM',
  description:
    'Publication ethics and research integrity at MJSTEM: plagiarism and originality, research misconduct, corrections and retractions, complaints and appeals, and manuscript withdrawal.',
  alternates: { canonical: `${BASE_URL}/publication-ethics` },
  robots: { index: true, follow: true },
};

const NAV_LINKS = [
  { href: '#integrity', label: 'Ethics & Integrity' },
  { href: '#plagiarism', label: 'Plagiarism' },
  { href: '#misconduct', label: 'Research Misconduct' },
  { href: '#corrections', label: 'Corrections & Retractions' },
  { href: '#complaints-appeals', label: 'Complaints & Appeals' },
  { href: '#withdrawal', label: 'Manuscript Withdrawal' },
] as const;

export default function PublicationEthicsPage() {
  return (
    <PolicyPageShell
      title="Publication Ethics & Research Integrity"
      description="MJSTEM upholds the highest standards of publication ethics, aligned with the principles and core practices of the Committee on Publication Ethics (COPE)."
      navLinks={NAV_LINKS}
    >
      <PolicySection id="integrity" title="Publication Ethics and Research Integrity" icon={<ShieldCheck />}>
        <PolicyParagraph>{PUBLICATION_ETHICS_AND_INTEGRITY.intro}</PolicyParagraph>
        <PolicyList items={PUBLICATION_ETHICS_AND_INTEGRITY.points} />
      </PolicySection>

      <PolicySection id="plagiarism" title="Plagiarism / Originality" icon={<Ban />}>
        <PolicyParagraph>{PUBLICATION_ETHICS_HUB_SUMMARIES.plagiarism}</PolicyParagraph>
      </PolicySection>

      <PolicySection id="misconduct" title="Research Misconduct" icon={<ShieldAlert />}>
        <PolicyParagraph>{PUBLICATION_ETHICS_HUB_SUMMARIES.researchMisconduct}</PolicyParagraph>
        <PolicyParagraph>{PUBLICATION_ETHICS_HUB_SUMMARIES.cope}</PolicyParagraph>
      </PolicySection>

      <PolicySection id="corrections" title="Corrections and Retractions" icon={<FileWarning />}>
        <PolicyParagraph>{CORRECTIONS_AND_RETRACTIONS.intro}</PolicyParagraph>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Corrections</h3>
          <PolicyParagraph>{CORRECTIONS_AND_RETRACTIONS.corrections.intro}</PolicyParagraph>
          <PolicyList items={CORRECTIONS_AND_RETRACTIONS.corrections.items} />
          <PolicyParagraph>{CORRECTIONS_AND_RETRACTIONS.corrections.note}</PolicyParagraph>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Retractions</h3>
          <PolicyParagraph>{CORRECTIONS_AND_RETRACTIONS.retractions.intro}</PolicyParagraph>
          <PolicyList items={CORRECTIONS_AND_RETRACTIONS.retractions.items} />
          <PolicyParagraph>{CORRECTIONS_AND_RETRACTIONS.retractions.note}</PolicyParagraph>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Expressions of Concern</h3>
          <PolicyParagraph>{CORRECTIONS_AND_RETRACTIONS.expressionOfConcern}</PolicyParagraph>
        </div>
        <PolicyParagraph>{CORRECTIONS_AND_RETRACTIONS.archivingNote}</PolicyParagraph>
      </PolicySection>

      <PolicySection id="complaints-appeals" title="Complaints and Appeals" icon={<MessageSquareWarning />}>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Complaints Policy</h3>
          <PolicyParagraph>{COMPLAINTS_POLICY.intro}</PolicyParagraph>
          <PolicyList items={COMPLAINTS_POLICY.points} />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Appeals Policy</h3>
          <PolicyParagraph>{APPEALS_POLICY.intro}</PolicyParagraph>
          <PolicyList items={APPEALS_POLICY.points} />
        </div>
      </PolicySection>

      <PolicySection id="withdrawal" title="Manuscript Withdrawal" icon={<LogOut />}>
        <PolicyParagraph>{MANUSCRIPT_WITHDRAWAL.intro}</PolicyParagraph>
        <PolicyList items={MANUSCRIPT_WITHDRAWAL.points} />
      </PolicySection>

      <PolicyParagraph>
        For role-specific responsibilities and workflow acknowledgements, see the{' '}
        <Link href="/ethics-policies" className="text-primary hover:underline">
          Ethics &amp; Policies hub
        </Link>
        .
      </PolicyParagraph>
    </PolicyPageShell>
  );
}
