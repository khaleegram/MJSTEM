
import type {Metadata} from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { Inter as FontSans } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';
import { buildGoogleSiteVerificationMetadata } from '@/lib/seo';

const siteVerification = buildGoogleSiteVerificationMetadata();

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mjstem.org'),
  title: 'MJSTEM - Multidisciplinary Journal of Science, Technology, Education and Management',
  description: 'A premier, peer-reviewed, open-access journal dedicated to the rapid publication of high-quality research across science, technology, education, and management.',
  applicationName: 'MJSTEM',
  keywords: ['journal', 'academic', 'research', 'science', 'technology', 'education', 'management', 'peer-reviewed'],
  ...(siteVerification ? { verification: siteVerification } : {}),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MJSTEM',
  },
  themeColor: '#111827',
  openGraph: {
    type: 'website',
    title: 'MJSTEM - Multidisciplinary Journal of Science, Technology, Education and Management',
    description: 'A premier, peer-reviewed, open-access journal.',
    siteName: 'MJSTEM',
  },
  twitter: {
    card: 'summary',
    title: 'MJSTEM - Multidisciplinary Journal of Science, Technology, Education and Management',
    description: 'A premier, peer-reviewed, open-access journal.',
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  }
};

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
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
