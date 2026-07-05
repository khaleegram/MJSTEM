'use client';

import type { Volume, Article, Submission } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Book, BookCopy, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DoiLink } from '@/components/doi-link';

type ArchivePageClientProps = {
  volumes: Volume[];
  inPressArticles: Submission[];
};

export function ArchivePageClient({ volumes, inPressArticles }: ArchivePageClientProps) {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-headline text-foreground">Journal Archives</h1>
        <p className="text-muted-foreground mt-2">
          Browse all our published volumes and issues, or view recent Articles in Press.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        {inPressArticles.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-2">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold font-headline">Articles in Press</h2>
              <Badge variant="secondary" className="ml-auto">
                Pre-publication
              </Badge>
            </div>
            <div className="grid gap-4">
              {inPressArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-all"
                >
                  <h3 className="text-xl font-bold font-headline text-primary mb-2">
                    <Link href={`/article/${article.id}`} className="hover:underline">
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    By {article.contributors?.map((c) => c.name).join(', ') || article.author.name}
                  </p>
                  <DoiLink
                    articleId={article.id}
                    doi={article.doi}
                    uniqueId={article.uniqueId}
                    className="mb-4"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground italic">
                      Accepted for publication. Final formatting in progress.
                    </span>
                    <Link
                      href={`/article/${article.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      View Abstract
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {volumes.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-2">
              <Book className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold font-headline">Published Volumes</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {volumes.map((volume) => (
                <AccordionItem value={volume.id} key={volume.id}>
                  <AccordionTrigger className="text-xl font-bold font-headline py-6">
                    <div className="flex items-center gap-3">{volume.title}</div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-8 pr-2">
                    {volume.issues && volume.issues.length > 0 ? (
                      <Accordion type="multiple" className="w-full">
                        {volume.issues.map((issue) => (
                          <AccordionItem value={issue.id} key={issue.id}>
                            <AccordionTrigger className="text-lg font-semibold font-headline">
                              <div className="flex items-center gap-3">
                                <BookCopy className="w-5 h-5" /> {issue.title}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-8 py-4">
                              <ul className="space-y-4">
                                {issue.articles && issue.articles.length > 0 ? (
                                  issue.articles.map((article) => (
                                    <li
                                      key={article.id}
                                      className="flex items-start justify-between gap-3 p-4 border rounded-lg"
                                    >
                                      <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                        <div className="min-w-0">
                                          <h4 className="font-semibold text-foreground break-words">
                                            <Link
                                              href={`/article/${article.id}`}
                                              className="hover:underline"
                                            >
                                              {article.title}
                                            </Link>
                                          </h4>
                                          <p className="text-sm text-muted-foreground">
                                            By{' '}
                                            {article.contributors?.map((c) => c.name).join(', ') ||
                                              article.authorName}
                                          </p>
                                          <DoiLink
                                            articleId={article.id}
                                            doi={article.doi}
                                            uniqueId={article.uniqueId}
                                            className="mt-1"
                                          />
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <Link
                                          href={article.manuscriptUrl || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-primary hover:underline"
                                        >
                                          PDF
                                        </Link>
                                        {article.pageCount && (
                                          <p className="text-sm text-muted-foreground">
                                            {article.pageCount} Pages
                                          </p>
                                        )}
                                      </div>
                                    </li>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">
                                    No articles published in this issue yet.
                                  </p>
                                )}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <p className="text-muted-foreground italic py-4 text-center">
                        No issues in this volume yet.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ) : (
          !inPressArticles.length && (
            <div className="flex flex-col items-center gap-4 text-center py-20">
              <Book className="h-24 w-24 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight font-headline">Nothing Published Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Check back later to see our published articles. Accepted articles can be organized
                into volumes and issues on the publications dashboard.
              </p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
