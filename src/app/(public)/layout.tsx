'use client';

import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Wrench } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const MaintenanceComponent = () => (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background text-center p-4">
        <Wrench className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline text-foreground">Under Maintenance</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
            Our site is currently undergoing scheduled maintenance. We should be back online shortly. Thank you for your patience.
        </p>
        <div className="mt-8">
            <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                Admin Login
            </Link>
        </div>
    </div>
);

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJournalSettings = async () => {
        const infoRef = doc(db, 'settings', 'journalInfo');
        getDoc(infoRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    setMaintenanceMode(docSnap.data().maintenanceMode || false);
                }
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: infoRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    fetchJournalSettings();
  }, []);

  if (loading) {
      return <div className="flex flex-col min-h-screen items-center justify-center bg-background" />;
  }

  if (maintenanceMode) {
    return <MaintenanceComponent />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
        {children}
      <PublicFooter />
    </div>
  );
}
