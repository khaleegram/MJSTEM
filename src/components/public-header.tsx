
'use client';

import Link from 'next/link';
import { ArrowRight, Menu, ChevronDown } from 'lucide-react';
import { Icons } from './icons';
import { Button } from './ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from './ui/sheet';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="text-muted-foreground transition-colors hover:text-foreground">
        {children}
    </Link>
);

const NavDropdown = () => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground px-2">
                Information <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem asChild><Link href="/for-readers">For Readers</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/for-authors">For Authors</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/for-librarians">For Librarians</Link></DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);


export function PublicHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [loadingLogo, setLoadingLogo] = useState(true);

    useEffect(() => {
        const fetchLogo = async () => {
            setLoadingLogo(true);
            try {
                const docRef = doc(db, 'settings', 'branding');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().logoUrl) {
                    setLogoUrl(docSnap.data().logoUrl);
                }
            } catch (error) {
                console.error("Could not fetch logo:", error);
            } finally {
                setLoadingLogo(false);
            }
        };
        fetchLogo();
    }, []);

  return (
    <header className="sticky top-0 z-50 w-full p-4">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between rounded-full border border-border/40 bg-background/80 px-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 font-semibold">
              {loadingLogo ? (
                  <Skeleton className="h-8 w-8" />
              ) : logoUrl ? (
                  <Image src={logoUrl} alt="Journal Logo" width={32} height={32} className="object-contain" />
              ) : (
                  <Icons.logo className="h-8 w-8 text-primary" />
              )}
              <h1 className="hidden sm:inline-block text-xl font-bold font-headline text-foreground">
                  MJSTEM
              </h1>
          </Link>
        </div>

        {/* Centered Navigation for Desktop */}
        <nav className="hidden md:flex items-center justify-center gap-1 text-sm font-medium">
            <NavLink href="/aims-scope">Aims & Scope</NavLink>
            <NavLink href="/editorial-board">Editorial Board</NavLink>
            <NavLink href="/author-guidelines">Author Guidelines</NavLink>
            <NavLink href="/archive">Browse Archives</NavLink>
            <NavDropdown />
        </nav>

        {/* Right-aligned Actions */}
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
            <Link href="/dashboard/submissions/new">
                Submit <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            </Button>
            <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <nav className="grid gap-6 text-lg font-medium mt-8">
                            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setIsOpen(false)}>
                                {logoUrl ? (
                                    <Image src={logoUrl} alt="Journal Logo" width={32} height={32} className="object-contain" />
                                ) : (
                                    <Icons.logo className="h-6 w-6 text-primary" />
                                )}
                                <span className="font-headline text-lg">MJSTEM</span>
                            </Link>
                            <Link href="/aims-scope" className="hover:text-foreground" onClick={() => setIsOpen(false)}>Aims & Scope</Link>
                            <Link href="/editorial-board" className="hover:text-foreground" onClick={() => setIsOpen(false)}>Editorial Board</Link>
                            <Link href="/author-guidelines" className="hover:text-foreground" onClick={() => setIsOpen(false)}>Author Guidelines</Link>
                            <Link href="/archive" className="hover:text-foreground" onClick={() => setIsOpen(false)}>Browse Archives</Link>
                            <hr />
                            <span className="text-muted-foreground text-base">Information</span>
                            <Link href="/for-readers" className="hover:text-foreground pl-4" onClick={() => setIsOpen(false)}>For Readers</Link>
                            <Link href="/for-authors" className="hover:text-foreground pl-4" onClick={() => setIsOpen(false)}>For Authors</Link>
                            <Link href="/for-librarians" className="hover:text-foreground pl-4" onClick={() => setIsOpen(false)}>For Librarians</Link>
                            <hr className="my-4" />
                            <Button asChild>
                                <Link href="/login" onClick={() => setIsOpen(false)}>Login</Link>
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="/dashboard/submissions/new" onClick={() => setIsOpen(false)}>Submit</Link>
                            </Button>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
