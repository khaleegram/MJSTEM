
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Wrench } from 'lucide-react';

async function getJournalSettings() {
    try {
        const infoRef = doc(db, 'settings', 'journalInfo');
        const infoSnap = await getDoc(infoRef);
        
        return {
            maintenanceMode: infoSnap.exists() ? infoSnap.data().maintenanceMode || false : false,
        };
    } catch (e) {
        console.error("Could not fetch journal settings for layout", e);
        // If there's an error, default to not being in maintenance mode
        return { maintenanceMode: false };
    }
}

const MaintenanceComponent = () => (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background text-center p-4">
        <Wrench className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline text-foreground">Under Maintenance</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
            Our site is currently undergoing scheduled maintenance. We should be back online shortly. Thank you for your patience.
        </p>
    </div>
);


export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { maintenanceMode } = await getJournalSettings();

  if (maintenanceMode) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                 <MaintenanceComponent />
            </body>
        </html>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
        {children}
      <PublicFooter />
    </div>
  );
}
