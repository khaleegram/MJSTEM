import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type PolicyNavLink = {
  href: string;
  label: string;
};

export function PolicyPageShell({
  title,
  description,
  children,
  navLinks,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  navLinks?: readonly PolicyNavLink[];
}) {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-bold font-headline text-foreground">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        ) : null}
        {navLinks && navLinks.length > 0 ? (
          <nav
            aria-label="Policy sections"
            className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-sm"
          >
            {navLinks.map((link, index) => (
              <span key={link.href} className="inline-flex items-center gap-3">
                {index > 0 && (
                  <span className="text-muted-foreground/40" aria-hidden>
                    •
                  </span>
                )}
                <a href={link.href} className="text-primary hover:underline">
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
        ) : null}
      </div>

      <div className="max-w-4xl mx-auto space-y-8">{children}</div>
    </main>
  );
}

export function PolicySection({
  id,
  title,
  children,
  icon,
}: {
  id?: string;
  title: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card id={id} className={id ? 'scroll-mt-28' : undefined}>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-3">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function PolicyList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function PolicyParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed">{children}</p>;
}
