
'use client';

import { PublicHeader } from '@/components/public-header';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { EditorialBoardMember } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const BoardMemberCard = ({ member }: { member: EditorialBoardMember }) => (
  <Card className="text-center">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center">
        <Image
          src={`https://picsum.photos/seed/${member.imageSeed}/128/128`}
          alt={member.name}
          width={128}
          height={128}
          className="rounded-full mb-4"
          data-ai-hint="person face"
        />
        <h3 className="font-bold font-headline text-lg text-foreground">{member.name}{member.qualifications && `, ${member.qualifications}`}</h3>
        <p className="text-sm text-muted-foreground">{member.affiliation}{member.country && `, ${member.country}`}</p>
      </div>
    </CardContent>
  </Card>
);

const BoardMemberSkeleton = () => (
    <Card>
        <CardContent className="pt-6 flex flex-col items-center">
            <Skeleton className="h-32 w-32 rounded-full mb-4" />
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-48" />
        </CardContent>
    </Card>
)

export default function EditorialBoardPage() {
  const [members, setMembers] = useState<EditorialBoardMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'editorialBoard'), orderBy('order'));
            const querySnapshot = await getDocs(q);
            const membersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EditorialBoardMember));
            setMembers(membersList);
        } catch (error) {
            console.error("Error fetching editorial board members: ", error);
        } finally {
            setLoading(false);
        }
    };
    fetchMembers();
  }, []);

  const boardSections = useMemo(() => {
    return members.reduce((acc, member) => {
        const role = member.role;
        if (!acc[role]) {
            acc[role] = [];
        }
        acc[role].push(member);
        return acc;
    }, {} as Record<string, EditorialBoardMember[]>);
  }, [members]);

  const sectionOrder: (keyof typeof boardSections)[] = ['Editor-in-Chief', 'Founding Editor', 'Senior Associate Editor', 'Associate Editor'];


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-headline text-foreground">Editorial Board</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            Our journal is guided by a distinguished board of international experts committed to academic excellence.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-12">
            {loading ? (
                <>
                    <section><h2 className="text-3xl font-bold font-headline text-center mb-8"><Skeleton className="h-9 w-64 mx-auto" /></h2><div className="max-w-sm mx-auto"><BoardMemberSkeleton /></div></section>
                    <section><h2 className="text-3xl font-bold font-headline text-center mb-8"><Skeleton className="h-9 w-64 mx-auto" /></h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">{Array.from({length: 3}).map((_, i) => <BoardMemberSkeleton key={i} />)}</div></section>
                </>
            ) : sectionOrder.map(role => {
                const sectionMembers = boardSections[role];
                if (!sectionMembers || sectionMembers.length === 0) return null;
                
                const title = role.replace(/([A-Z])/g, ' $1').trim() + (role.endsWith('s') ? '' : 's');
                const gridCols = role === 'Editor-in-Chief' ? 'lg:grid-cols-1' : role === 'Senior Associate Editor' ? 'lg:grid-cols-2' : 'lg:grid-cols-3';


                return (
                    <section key={role}>
                        <h2 className="text-3xl font-bold font-headline text-center mb-8">{title}</h2>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-8 ${role === 'Editor-in-Chief' ? 'max-w-sm mx-auto' : ''}`}>
                            {sectionMembers.map((member) => (
                                <BoardMemberCard key={member.id} member={member} />
                            ))}
                        </div>
                    </section>
                )
            })}
             {!loading && members.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <p>The editorial board is currently being assembled.</p>
                </div>
            )}
        </div>
      </main>
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
          <p className="mb-2">Print ISSN: 3121-6552 | Barcode: 9773121655008</p>
          © {new Date().getFullYear()} MJSTEM. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

    