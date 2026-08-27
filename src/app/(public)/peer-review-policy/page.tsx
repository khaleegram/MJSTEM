import type { Metadata } from 'next';
import { ClipboardCheck } from 'lucide-react';
import { BASE_URL } from '@/lib/seo';
import {
  PolicyPageShell,
  PolicySection,
  PolicyList,
  PolicyParagraph,
} from '@/components/policies/policy-page';
import { PEER_REVIEW_POLICY, PEER_REVIEW_POLICY_SUMMARY } from '@/content/journal-policies';

export const metadata: Metadata = {
  title: 'Peer Review Policy | MJSTEM',
  description:
    'The double-blind peer review process of the Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM), from initial screening through editorial decision and appeals.',
  alternates: { canonical: `${BASE_URL}/peer-review-policy` },
  robots: { index: true, follow: true },
};

export default function PeerReviewPolicyPage() {
  return (
    <PolicyPageShell
      title="Peer Review Policy"
      description={PEER_REVIEW_POLICY.intro}
    >
      <PolicySection title="At a Glance" icon={<ClipboardCheck />}>
        <PolicyParagraph>{PEER_REVIEW_POLICY_SUMMARY.intro}</PolicyParagraph>
        <PolicyList items={PEER_REVIEW_POLICY_SUMMARY.points} />
      </PolicySection>

      {PEER_REVIEW_POLICY.sections.map((section) => (
        <PolicySection key={section.id} id={section.id} title={section.title}>
          {section.body.map((paragraph) => (
            <PolicyParagraph key={paragraph}>{paragraph}</PolicyParagraph>
          ))}
        </PolicySection>
      ))}
    </PolicyPageShell>
  );
}
