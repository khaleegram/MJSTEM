import type { Metadata } from 'next';
import { Building2, GraduationCap, Copyright, Wallet, Archive, Database, Mail } from 'lucide-react';
import { BASE_URL } from '@/lib/seo';
import {
  PolicyPageShell,
  PolicySection,
  PolicyList,
  PolicyParagraph,
} from '@/components/policies/policy-page';
import {
  PUBLISHER_INFO,
  ACADEMIC_AFFILIATION,
  COPYRIGHT_LICENSING,
  PUBLICATION_CHARGES,
  DIGITAL_PRESERVATION,
  DATA_AVAILABILITY_POLICY,
  JOURNAL_IDENTITY,
} from '@/content/journal-policies';

export const metadata: Metadata = {
  title: 'Publishing Information | MJSTEM',
  description:
    'Publishing information for MJSTEM: publisher details, academic affiliation, copyright and licensing, publication charges, digital preservation, data availability, and contact details.',
  alternates: { canonical: `${BASE_URL}/publishing-information` },
  robots: { index: true, follow: true },
};

const NAV_LINKS = [
  { href: '#publisher', label: 'Publisher' },
  { href: '#affiliation', label: 'Academic Affiliation' },
  { href: '#copyright', label: 'Copyright & Licensing' },
  { href: '#charges', label: 'Publication Charges' },
  { href: '#preservation', label: 'Digital Preservation' },
  { href: '#data', label: 'Data Availability' },
  { href: '#contact', label: 'Contact' },
] as const;

export default function PublishingInformationPage() {
  return (
    <PolicyPageShell
      title="Publishing Information"
      description="Key publishing details for MJSTEM, including publisher and affiliation information, licensing, charges, preservation, and how to reach the Editorial Office."
      navLinks={NAV_LINKS}
    >
      <PolicySection id="publisher" title="Publisher Information" icon={<Building2 />}>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            <span className="font-semibold text-foreground">Journal:</span>{' '}
            {PUBLISHER_INFO.journalName}
          </p>
          <p>
            <span className="font-semibold text-foreground">Published by:</span>{' '}
            {PUBLISHER_INFO.publisherName}
          </p>
          <p>
            <span className="font-semibold text-foreground">Country:</span> {PUBLISHER_INFO.country}
          </p>
          <div>
            <p className="font-semibold text-foreground mb-1">Postal Address</p>
            {PUBLISHER_INFO.postalAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p>
            <span className="font-semibold text-foreground">Publisher email:</span>{' '}
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
        </div>
      </PolicySection>

      <PolicySection id="affiliation" title="Academic Affiliation" icon={<GraduationCap />}>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            <span className="font-semibold text-foreground">Affiliation:</span>{' '}
            {ACADEMIC_AFFILIATION.affiliation}
          </p>
          <p>
            <span className="font-semibold text-foreground">Location:</span>{' '}
            {ACADEMIC_AFFILIATION.location}
          </p>
          <p>
            <span className="font-semibold text-foreground">Nature:</span>{' '}
            {ACADEMIC_AFFILIATION.nature}
          </p>
          <p className="text-sm italic">{ACADEMIC_AFFILIATION.note}</p>
        </div>
      </PolicySection>

      <PolicySection id="copyright" title="Copyright and Licensing" icon={<Copyright />}>
        <PolicyParagraph>{COPYRIGHT_LICENSING.intro}</PolicyParagraph>
        <PolicyList items={COPYRIGHT_LICENSING.points} />
        <PolicyParagraph>
          Read the full license terms:{' '}
          <a
            href={COPYRIGHT_LICENSING.licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {COPYRIGHT_LICENSING.licenseName}
          </a>
          .
        </PolicyParagraph>
      </PolicySection>

      <PolicySection id="charges" title="Publication Charges" icon={<Wallet />}>
        <PolicyParagraph>{PUBLICATION_CHARGES.summary}</PolicyParagraph>
      </PolicySection>

      <PolicySection id="preservation" title="Digital Preservation and Archiving" icon={<Archive />}>
        <PolicyParagraph>{DIGITAL_PRESERVATION.intro}</PolicyParagraph>
        <PolicyList items={DIGITAL_PRESERVATION.points} />
        <PolicyParagraph>{DIGITAL_PRESERVATION.permanentAccessibility}</PolicyParagraph>
      </PolicySection>

      <PolicySection id="data" title="Data Availability" icon={<Database />}>
        <PolicyParagraph>{DATA_AVAILABILITY_POLICY.intro}</PolicyParagraph>
        <PolicyList items={DATA_AVAILABILITY_POLICY.points} />
      </PolicySection>

      <PolicySection id="contact" title="Contact" icon={<Mail />}>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            <span className="font-semibold text-foreground">Editorial Office email:</span>{' '}
            <a
              href={`mailto:${JOURNAL_IDENTITY.contactEmail}`}
              className="text-primary hover:underline"
            >
              {JOURNAL_IDENTITY.contactEmail}
            </a>
          </p>
          <p>
            <span className="font-semibold text-foreground">Publisher email:</span>{' '}
            <a
              href={`mailto:${JOURNAL_IDENTITY.publisherEmail}`}
              className="text-primary hover:underline"
            >
              {JOURNAL_IDENTITY.publisherEmail}
            </a>
          </p>
          <div>
            <p className="font-semibold text-foreground mb-1">Postal Address</p>
            {JOURNAL_IDENTITY.postalAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </PolicySection>
    </PolicyPageShell>
  );
}
