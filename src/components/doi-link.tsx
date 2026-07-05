import Link from 'next/link';
import { resolveDoiHref, resolveDoiLabel } from '@/lib/doi';
import { cn } from '@/lib/utils';

type DoiLinkProps = {
  articleId: string;
  doi?: string | null;
  uniqueId?: string | null;
  className?: string;
  prefix?: string;
};

export function DoiLink({ articleId, doi, uniqueId, className, prefix = 'DOI:' }: DoiLinkProps) {
  const label = resolveDoiLabel(doi, uniqueId);
  const href = resolveDoiHref(articleId, doi, uniqueId);

  if (!label || !href) return null;

  const isExternal = href.startsWith('http');

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {prefix}{' '}
      {isExternal ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-primary hover:underline break-all"
        >
          {label}
        </a>
      ) : (
        <Link href={href} className="font-mono text-primary hover:underline break-all">
          {label}
        </Link>
      )}
    </p>
  );
}
