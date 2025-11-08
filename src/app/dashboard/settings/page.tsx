
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Palette, Info } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Journal Settings</h1>
          <p className="text-muted-foreground">
            Manage global settings for the journal application.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             <Link href="/dashboard/settings/editorial-board">
                <Card className="hover:bg-muted/50 hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-3">
                            <Award className="h-6 w-6 text-primary" />
                            Editorial Board
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            Add, edit, and manage the members of the journal's editorial board.
                        </CardDescription>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/dashboard/settings/branding">
                <Card className="hover:bg-muted/50 hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-3">
                            <Palette className="h-6 w-6 text-primary" />
                            Branding & Appearance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            Customize the journal's logo, colors, and overall appearance.
                        </CardDescription>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/dashboard/settings/journal-info">
                <Card className="hover:bg-muted/50 hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-3">
                            <Info className="h-6 w-6 text-primary" />
                            Journal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            Set the cover letter text and upload the submission template.
                        </CardDescription>
                    </CardContent>
                </Card>
            </Link>
        </div>
    </div>
  );
}

    