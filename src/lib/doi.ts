const BASE_URL = 'https://mjstem.org';

export function resolveDoiLabel(doi?: string | null, uniqueId?: string | null): string | null {
  const trimmedDoi = typeof doi === 'string' ? doi.trim() : '';
  if (trimmedDoi) return trimmedDoi;

  const trimmedUniqueId = typeof uniqueId === 'string' ? uniqueId.trim() : '';
  return trimmedUniqueId || null;
}

export function resolveDoiHref(
  articleId: string,
  doi?: string | null,
  uniqueId?: string | null
): string | null {
  const label = resolveDoiLabel(doi, uniqueId);
  if (!label) return null;

  if (/^https?:\/\//i.test(label)) return label;

  const normalized = label.replace(/^doi:\s*/i, '').trim();
  if (/^10\.\d{4,9}\//i.test(normalized)) {
    return `https://doi.org/${normalized}`;
  }

  return `${BASE_URL}/article/${articleId}`;
}
