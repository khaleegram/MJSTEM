
'use client';

import Link from 'next/link';
import { LogOut, Settings, User, Menu, Book, FileText, LayoutDashboard, Users, Edit, FileCheck } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Icons } from './icons';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from './theme-toggle';


const authorNavItems = [
    { href: '/dashboard/author', icon: User, label: 'Author Dashboard' },
    { href: '/dashboard/submissions/new', icon: FileText, label: 'New Submission' },
];

const reviewerNavItems = [
    { href: '/dashboard/reviewer', icon: FileCheck, label: 'Reviewer Dashboard' },
];

const editorNavItems = [
  { href: '/dashboard/editor', icon: Edit, label: 'Editor Dashboard' },
  { href: '/dashboard/submissions', icon: FileText, label: 'All Submissions' },
  { href: '/dashboard/reviewers', icon: Users, label: 'Reviewer Directory' },
  { href: '/dashboard/publications', icon: Book, label: 'Publications' },
];

const adminNavItems = [
    { href: '/dashboard/editor', icon: Edit, label: 'Editor Dashboard' },
    { href: '/dashboard/submissions', icon: FileText, label: 'All Submissions' },
    { href: '/dashboard/reviewers', icon: Users, label: 'User Directory' },
    { href: '/dashboard/publications', icon: Book, label: 'Publications' },
    { href: '/dashboard/settings', icon: Settings, label: 'Journal Settings' },
]

export function Header() {
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }
  
  let navItems = authorNavItems; // Default to author
  if (userProfile?.role === 'Reviewer') {
    navItems = reviewerNavItems;
  } else if (userProfile?.role === 'Editor') {
    navItems = editorNavItems;
  } else if (userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor') {
    navItems = adminNavItems;
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <Sheet>
            <SheetTrigger asChild>
            <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
            </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <nav className="grid gap-2 text-lg font-medium">
                <Link
                    href="#"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="font-headline text-lg">MJSTEM</span>
                </Link>
                {navItems.map(item => (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                            pathname.startsWith(item.href) && (item.href.length > 10 ? true : pathname === item.href) && 'bg-muted text-foreground'
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
            </nav>
            </SheetContent>
        </Sheet>

      <div className="w-full flex-1">
        {/* Can add search or breadcrumbs here */}
      </div>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={userProfile?.photoURL || user?.photoURL || ''}
                alt="User avatar"
              />
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          {(userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor') && (
            <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                </Link>
            </DropdownMenuItem>
           )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
