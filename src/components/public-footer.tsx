'use client';

import { Icons } from '@/components/icons';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function PublicFooter() {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const brandingRef = doc(db, 'settings', 'branding');
                const brandingSnap = await getDoc(brandingRef);
                if (brandingSnap.exists()) {
                    setLogoUrl(brandingSnap.data().logoUrl);
                }
            } catch (error) {
                console.error("Could not fetch branding for footer:", error);
            }
        };
        fetchBranding();
    }, []);

    return (
        <footer className="bg-secondary/50 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                <div className="col-span-2 md:col-span-1 flex items-start flex-col gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        {logoUrl ? (
                            <Image src={logoUrl} alt="Journal Logo" width={32} height={32} className="object-contain" />
                        ) : (
                            <Icons.logo className="h-8 w-8 text-primary" />
                        )}
                        <h2 className="text-2xl font-bold font-headline text-foreground">
                            MJSTEM
                        </h2>
                    </Link>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>EISSN: 3121-9292</p>
                        <p>ISSN (Print): 3121-6552</p>
                    </div>
                </div>
                <div className="md:col-span-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
                        <div>
                            <h4 className="font-headline font-semibold mb-3">About</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/about-journal" className="hover:text-primary">About the Journal</Link></li>
                                <li><Link href="/editorial-board" className="hover:text-primary">Editorial Board</Link></li>
                                <li><Link href="/peer-review-policy" className="hover:text-primary">Peer Review Policy</Link></li>
                                <li><Link href="/archive" className="hover:text-primary">Archive</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Editorial Policies</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/editorial-policies" className="hover:text-primary">Editorial Policies</Link></li>
                                <li><Link href="/editorial-policies#editorial-independence" className="hover:text-primary">Editorial Independence</Link></li>
                                <li><Link href="/editorial-policies#conflict-of-interest" className="hover:text-primary">Conflict of Interest</Link></li>
                                <li><Link href="/editorial-policies#authorship" className="hover:text-primary">Authorship</Link></li>
                                <li><Link href="/editorial-policies#ai-policy" className="hover:text-primary">AI Policy</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Publication Ethics</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/publication-ethics" className="hover:text-primary">Publication Ethics</Link></li>
                                <li><Link href="/publication-ethics#plagiarism" className="hover:text-primary">Plagiarism</Link></li>
                                <li><Link href="/publication-ethics#corrections" className="hover:text-primary">Corrections &amp; Retractions</Link></li>
                                <li><Link href="/publication-ethics#complaints-appeals" className="hover:text-primary">Complaints &amp; Appeals</Link></li>
                                <li><Link href="/ethics-policies" className="hover:text-primary">Ethics Hub</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Publishing</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/publishing-information" className="hover:text-primary">Publishing Information</Link></li>
                                <li><Link href="/publishing-information#publisher" className="hover:text-primary">Publisher Information</Link></li>
                                <li><Link href="/publishing-information#copyright" className="hover:text-primary">Copyright &amp; Licensing</Link></li>
                                <li><Link href="/publishing-information#charges" className="hover:text-primary">Publication Charges</Link></li>
                                <li><Link href="/publishing-information#preservation" className="hover:text-primary">Digital Preservation</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Authors</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/author-guidelines" className="hover:text-primary">Author Guidelines</Link></li>
                                <li><Link href="/dashboard/submissions/new" className="hover:text-primary">Submit</Link></li>
                                <li><Link href="/for-authors" className="hover:text-primary">For Authors</Link></li>
                                <li><Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link></li>
                                <li><Link href="/terms-of-service" className="hover:text-primary">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                <p className="mb-2">The views expressed in articles published by MJSTEM are solely those of contributing authors. Therefore, the journal cannot be held liable for such opinions. MJSTEM is solely a scholarly publication meant to satisfy the intellectual needs of the academic community.</p>
                <p>© {new Date().getFullYear()} MJSTEM. All Rights Reserved.</p>
            </div>
        </div>
        </footer>
    );
}
