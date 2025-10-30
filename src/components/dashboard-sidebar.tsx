
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Book,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  User,
  Edit,
  FileCheck,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icons } from './icons';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/auth-context';

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

export function DashboardSidebar() {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  let navItems = authorNavItems; // Default to author
  if (userProfile?.role === 'Reviewer') {
    navItems = reviewerNavItems;
  } else if (userProfile?.role === 'Editor') {
    navItems = editorNavItems;
  } else if (userProfile?.role === 'Admin') {
    navItems = adminNavItems;
  }


  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg">MJSTEM</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  // Handle more specific path matching for nested routes
                  pathname.startsWith(item.href) && (item.href.length > 10 || pathname === item.href)
                    ? 'bg-muted text-primary'
                    : ''
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
             {userProfile?.role === 'Admin' && pathname.startsWith('/dashboard/settings') && (
                <div className="pl-7 mt-2 space-y-1">
                     <Link
                        href="/dashboard/settings/editorial-board"
                        className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary',
                        pathname === '/dashboard/settings/editorial-board'
                            ? 'bg-muted text-primary'
                            : ''
                        )}
                    >
                        <Award className="h-4 w-4" />
                        Editorial Board
                    </Link>
                </div>
            )}
          </nav>
        </div>
        <div className="mt-auto p-4">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </div>
      </div>
    </div>
  );
}
