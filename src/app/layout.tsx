
import type {Metadata} from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { Inter as FontSans } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';


export const metadata: Metadata = {
  metadataBase: new URL('https://mjstem.org'),
  title: 'MJSTEM - Multidisciplinary Journal of Science, Technology, Education and Management',
  description: 'A premier, peer-reviewed, open-access journal dedicated to the rapid publication of high-quality research across science, technology, education, and management.',
  applicationName: 'MJSTEM',
  keywords: ['journal', 'academic', 'research', 'science', 'technology', 'education', 'management', 'peer-reviewed'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MJSTEM',
  },
  themeColor: '#111827',
  openGraph: {
    type: 'website',
    title: 'MJSTEM - Multidisciplinary Journal',
    description: 'A premier, peer-reviewed, open-access journal.',
    siteName: 'MJSTEM',
  },
  twitter: {
    card: 'summary',
    title: 'MJSTEM - Multidisciplinary Journal',
    description: 'A premier, peer-reviewed, open-access journal.',
  },
  icons: {
    icon: '/favicon.jpg',
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
