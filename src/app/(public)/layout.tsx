import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { adminDb } from '@/lib/firebase-admin';
import { Wrench } from 'lucide-react';
import Link from 'next/link';

// Render public pages on the server so crawlers receive full HTML content
// instead of an empty client-rendered shell.
export const dynamic = 'force-dynamic';

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

async function isMaintenanceMode(): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const snap = await adminDb.collection('settings').doc('journalInfo').get();
    return snap.exists ? Boolean(snap.data()?.maintenanceMode) : false;
  } catch (error) {
    // Never take the whole public site down because of a settings read error.
    console.error('PublicLayout: failed to read maintenance setting', error);
    return false;
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintenanceMode = await isMaintenanceMode();

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
