
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRedirectPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is complete
    }

    if (userProfile) {
      const { role } = userProfile;
      if (role === 'Editor' || role === 'Admin' || role === 'Managing Editor') {
        router.replace('/dashboard/editor');
      } else if (role === 'Author') {
        router.replace('/dashboard/author');
      } else if (role === 'Reviewer') {
        router.replace('/dashboard/reviewer');
      } else {
        // Fallback for unknown roles, maybe to a generic dashboard
         router.replace('/dashboard/author');
      }
    } else if (!loading && !userProfile) {
        // If there's no user but loading is done, redirect to login
        router.replace('/login');
    }
  }, [userProfile, loading, router]);

  // Display a loading state while we determine the user's role
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80 mt-2" />
        </div>
      </div>
      <Skeleton className="w-full h-[400px]" />
    </div>
  );
}
