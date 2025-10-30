
'use client';

import Link from 'next/link';
import { ArrowRight, Menu } from 'lucide-react';
import { Icons } from './icons';
import { Button } from './ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from './ui/sheet';
import { useState } from 'react';
import { ThemeToggle } from './theme-toggle';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="text-muted-foreground hover:text-foreground">
        {children}
    </Link>
);


export function PublicHeader() {
    const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
            <Icons.logo className="h-8 w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold font-headline text-foreground">
                MJSTEM
            </h1>
        </Link>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <NavLink href="/aims-scope">Aims & Scope</NavLink>
        <NavLink href="/editorial-board">Editorial Board</NavLink>
        <NavLink href="/author-guidelines">Author Guidelines</NavLink>
        <NavLink href="/archive">Browse Archives</NavLink>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/dashboard/submissions/new">
            Submit Manuscript <ArrowRight className="ml-2 h-4 w-4" />
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
                            <Icons.logo className="h-6 w-6 text-primary" />
                            <span className="font-headline text-lg">MJSTEM</span>
                        </Link>
                        <Link href="/aims-scope" className="hover:text-foreground" onClick={() => setIsOpen(false)}>Aims & Scope</Link>
                        <Link href="/editorial-board" className="hover:text-foreground" onClick={() => setIsOpen(false)}>Editorial Board</Link>
                        <Link href="/author-guidelines" className="hover:text-foreground" onClick={() => setIsOpen(false)}>Author Guidelines</Link>
                        <Link href="/archive" className="hover:text-foreground" onClick={() => setIsOpen(false)}>Browse Archives</Link>
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
    </header>
  );
}
