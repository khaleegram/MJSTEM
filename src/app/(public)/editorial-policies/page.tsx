import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardCheck, ShieldCheck, AlertTriangle, Users, Bot } from 'lucide-react';
import { BASE_URL } from '@/lib/seo';
import {
  PolicyPageShell,
  PolicySection,
  PolicyList,
  PolicyParagraph,
} from '@/components/policies/policy-page';
import {
  PEER_REVIEW_POLICY_SUMMARY,
  EDITORIAL_INDEPENDENCE,
  CONFLICT_OF_INTEREST_POLICY,
  AUTHORSHIP_AND_CONTRIBUTORSHIP,
  AI_POLICY,
} from '@/content/journal-policies';

export const metadata: Metadata = {
  title: 'Editorial Policies | MJSTEM',
  description:
    'Editorial policies of MJSTEM: peer review, editorial independence, conflict of interest, authorship and contributorship, and the use of generative AI.',
  alternates: { canonical: `${BASE_URL}/editorial-policies` },
  robots: { index: true, follow: true },
};

const NAV_LINKS = [
  { href: '#peer-review', label: 'Peer Review' },
  { href: '#editorial-independence', label: 'Editorial Independence' },
  { href: '#conflict-of-interest', label: 'Conflict of Interest' },
  { href: '#authorship', label: 'Authorship' },
  { href: '#ai-policy', label: 'AI Policy' },
] as const;

export default function EditorialPoliciesPage() {
  return (
    <PolicyPageShell
      title="Editorial Policies"
      description="The policies that govern how MJSTEM evaluates, reviews, and publishes scholarly work, and the standards we expect of authors, editors, and reviewers."
      navLinks={NAV_LINKS}
    >
      <PolicySection id="peer-review" title="Peer Review Policy" icon={<ClipboardCheck />}>
        <PolicyParagraph>{PEER_REVIEW_POLICY_SUMMARY.intro}</PolicyParagraph>
        <PolicyList items={PEER_REVIEW_POLICY_SUMMARY.points} />
        <PolicyParagraph>
          <Link href="/peer-review-policy" className="text-primary hover:underline">
            Read the full Peer Review Policy
          </Link>
          .
        </PolicyParagraph>
      </PolicySection>

      <PolicySection id="editorial-independence" title="Editorial Independence" icon={<ShieldCheck />}>
        <PolicyParagraph>{EDITORIAL_INDEPENDENCE.intro}</PolicyParagraph>
        <PolicyList items={EDITORIAL_INDEPENDENCE.points} />
      </PolicySection>

      <PolicySection id="conflict-of-interest" title="Conflict of Interest" icon={<AlertTriangle />}>
        <PolicyParagraph>{CONFLICT_OF_INTEREST_POLICY.intro}</PolicyParagraph>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Authors</h3>
          <PolicyList items={CONFLICT_OF_INTEREST_POLICY.authors} />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Reviewers</h3>
          <PolicyList items={CONFLICT_OF_INTEREST_POLICY.reviewers} />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Editors</h3>
          <PolicyList items={CONFLICT_OF_INTEREST_POLICY.editors} />
        </div>
      </PolicySection>

      <PolicySection id="authorship" title="Authorship and Contributorship" icon={<Users />}>
        <PolicyParagraph>{AUTHORSHIP_AND_CONTRIBUTORSHIP.intro}</PolicyParagraph>
        <PolicyParagraph>{AUTHORSHIP_AND_CONTRIBUTORSHIP.criteriaIntro}</PolicyParagraph>
        <PolicyList items={AUTHORSHIP_AND_CONTRIBUTORSHIP.criteria} />
        <PolicyParagraph>{AUTHORSHIP_AND_CONTRIBUTORSHIP.acknowledgement}</PolicyParagraph>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Corresponding Author</h3>
          <PolicyParagraph>{AUTHORSHIP_AND_CONTRIBUTORSHIP.correspondingAuthor}</PolicyParagraph>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Changes to Authorship</h3>
          <PolicyParagraph>{AUTHORSHIP_AND_CONTRIBUTORSHIP.changesToAuthorship}</PolicyParagraph>
        </div>
      </PolicySection>

      <PolicySection id="ai-policy" title="Use of Generative AI" icon={<Bot />}>
        <PolicyParagraph>{AI_POLICY.intro}</PolicyParagraph>
        <PolicyList items={AI_POLICY.points} />
      </PolicySection>
    </PolicyPageShell>
  );
}
