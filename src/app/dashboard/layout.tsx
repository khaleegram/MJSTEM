
'use client';

import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Define which roles can access which paths
const rolePermissions: { [key: string]: string[] } = {
    'Author': ['/dashboard/author', '/dashboard/submissions/new'],
    'Reviewer': ['/dashboard/reviewer'],
    // Editors have access to everything under /dashboard except other roles' specific views
    'Editor': ['/dashboard/editor', '/dashboard/submissions', '/dashboard/reviewers', '/dashboard/publications'],
    'Admin': ['/dashboard/editor', '/dashboard/submissions', '/dashboard/reviewers', '/dashboard/publications', '/dashboard/settings'], // Admin can also access everything
};

const isPathAllowed = (role: string, path: string): boolean => {
    // Universal pages
    if (path === '/dashboard' || path === '/dashboard/profile' || path.startsWith('/dashboard/submissions/')) {
        return true;
    }
    
    // Check role-specific permissions
    const allowedPaths = rolePermissions[role] || [];
    if (allowedPaths.some(p => path.startsWith(p))) {
        return true;
    }

    // Allow editors & admins to access reviewer profiles
    if ((role === 'Editor' || role === 'Admin') && path.startsWith('/dashboard/reviewers/')) {
        return true;
    }

    return false;
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait until user data is loaded

    if (!user) {
      router.replace('/login');
      return;
    }

    if (userProfile) {
        if (!isPathAllowed(userProfile.role, pathname)) {
            // If user is trying to access a forbidden path, redirect them to their default dashboard
            let defaultPath = '/dashboard';
             switch (userProfile.role) {
                case 'Author':
                    defaultPath = '/dashboard/author';
                    break;
                case 'Reviewer':
                    defaultPath = '/dashboard/reviewer';
                    break;
                case 'Editor':
                    defaultPath = '/dashboard/editor';
                    break;
                case 'Admin':
                    defaultPath = '/dashboard/editor';
                    break;
            }
            router.replace(defaultPath);
        }
    }

  }, [user, userProfile, loading, router, pathname]);

  if (loading || !user || !userProfile) {
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                       <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="flex-1 p-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </div>
            </div>
             <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 justify-end">
                    <Skeleton className="h-9 w-9 rounded-full" />
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <Skeleton className="w-full h-[calc(100vh-8rem)]" />
                </main>
            </div>
        </div>
    )
  }

  // Final check to prevent flashing of unauthorized content
  if (!isPathAllowed(userProfile.role, pathname)) {
    // While redirecting, show a loading state
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block" />
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 justify-end">
            <Skeleton className="h-9 w-9 rounded-full" />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
             <Skeleton className="w-full h-[calc(100vh-8rem)]" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <DashboardSidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
