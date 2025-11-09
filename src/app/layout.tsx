
import type {Metadata} from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { Inter as FontSans } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const metadata: Metadata = {
  title: 'MJSTEM - Multidisciplinary Journal of Science, Technology, Education and Management',
  description: 'A premier, peer-reviewed, open-access journal dedicated to the rapid publication of high-quality research across science, technology, education, and management.',
  applicationName: 'MJSTEM',
  keywords: ['journal', 'academic', 'research', 'science', 'technology', 'education', 'management', 'peer-reviewed'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MJSTEM',
  },
  openGraph: {
    type: 'website',
    url: 'https://mjstem.com', // Replace with your actual domain
    title: 'MJSTEM - Multidisciplinary Journal',
    description: 'A premier, peer-reviewed, open-access journal.',
    siteName: 'MJSTEM',
  },
  twitter: {
    card: 'summary',
    title: 'MJSTEM - Multidisciplinary Journal',
    description: 'A premier, peer-reviewed, open-access journal.',
  }
};


const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

async function getLogoUrl() {
    try {
        const docRef = doc(db, 'settings', 'branding');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().logoUrl) {
            return docSnap.data().logoUrl;
        }
    } catch (e) {
        console.error("Could not pre-fetch logo:", e);
    }
    return null;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const logoUrl = await getLogoUrl();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,700;1,7..72,400&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        {logoUrl && <link rel="preload" href={logoUrl} as="image" />}
        {logoUrl && <link rel="icon" href={logoUrl} type="image/png" sizes="any" />}
      </head>
      <body className={cn("font-body antialiased", fontSans.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
              <FirebaseErrorListener />
              {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
