import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditorialBoardMember } from '@/types';
import { getEditorialBoardMembers } from '@/lib/public-data';
import { BASE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editorial Board | MJSTEM',
  description:
    'Meet the editorial board of the Maiduguri Journal of STEM (MJSTEM), guiding peer review and publication standards.',
  alternates: { canonical: `${BASE_URL}/editorial-board` },
  robots: { index: true, follow: true },
};

const BoardMemberCard = ({ member }: { member: EditorialBoardMember }) => (
  <Card className="text-center">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center">
        <Avatar className="h-32 w-32 mb-4">
          <AvatarImage src={member.photoURL || ''} alt={member.name} />
          <AvatarFallback className="text-4xl">{member.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="font-bold font-headline text-lg text-foreground">
          {member.name}
          {member.qualifications && `, ${member.qualifications}`}
        </h3>
        <p className="text-sm text-muted-foreground">
          {member.affiliation}
          {member.country && `, ${member.country}`}
        </p>
        {member.orcid && (
          <a
            href={`https://orcid.org/${member.orcid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary mt-1"
          >
            ORCID: {member.orcid}
          </a>
        )}
      </div>
    </CardContent>
  </Card>
);

function groupBoardMembers(members: EditorialBoardMember[]) {
  const sections: Record<string, EditorialBoardMember[]> = {
    'Editor-in-Chief': [],
    'Founding Editor': [],
    'Associate Editors': [],
  };

  members.forEach((member) => {
    if (member.role === 'Editor-in-Chief') {
      sections['Editor-in-Chief'].push(member);
    } else if (member.role === 'Founding Editor') {
      sections['Founding Editor'].push(member);
    } else if (member.role === 'Associate Editor' || member.role === 'Senior Associate Editor') {
      sections['Associate Editors'].push(member);
    }
  });

  return sections;
}

export default async function EditorialBoardPage() {
  const members = await getEditorialBoardMembers();
  const boardSections = groupBoardMembers(members);
  const sectionOrder: Array<keyof ReturnType<typeof groupBoardMembers>> = [
    'Editor-in-Chief',
    'Founding Editor',
    'Associate Editors',
  ];

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-headline text-foreground">Editorial Board</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
          Our journal is guided by a distinguished board of international experts committed to
          academic excellence.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {sectionOrder.map((title) => {
          const sectionMembers = boardSections[title];
          if (!sectionMembers || sectionMembers.length === 0) return null;

          const gridCols =
            title === 'Editor-in-Chief'
              ? 'lg:grid-cols-1'
              : title === 'Founding Editor'
                ? 'lg:grid-cols-2'
                : 'lg:grid-cols-3';

          return (
            <section key={title}>
              <h2 className="text-3xl font-bold font-headline text-center mb-8">{title}</h2>
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-8 ${title === 'Editor-in-Chief' ? 'max-w-sm mx-auto' : ''}`}
              >
                {sectionMembers.map((member) => (
                  <BoardMemberCard key={member.id} member={member} />
                ))}
              </div>
            </section>
          );
        })}

        {members.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>The editorial board is currently being assembled.</p>
          </div>
        )}
      </div>
    </main>
  );
}
