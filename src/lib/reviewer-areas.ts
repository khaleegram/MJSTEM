/** Canonical MJSTEM reviewer subject areas for opt-in and editor filtering. */
export const REVIEWER_SUBJECT_AREAS = [
  'Engineering and Technology',
  'Life Sciences and Biology',
  'Physical Sciences',
  'Computer Science & AI',
  'Educational Theory and Practice',
  'Higher Education Management',
  'Business and Economics',
  'Public Administration',
  'Social Sciences and Humanities',
  'Health and Medical Sciences',
  'Technical Vocational Education and Training (TVET)',
  'Cyber Security',
  'Science Education',
  'Educational Technology',
  'Data Science',
  'Library and Information Technology/Science',
] as const;

export type ReviewerSubjectArea = (typeof REVIEWER_SUBJECT_AREAS)[number];

export const MAX_REVIEWER_SUBJECT_AREAS = 10;
export const MAX_CUSTOM_AREA_LENGTH = 80;

/** Normalize and dedupe subject areas; allow predefined + custom strings. */
export function sanitizeReviewerSubjectAreas(areas: unknown): string[] {
  if (!Array.isArray(areas)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of areas) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > MAX_CUSTOM_AREA_LENGTH) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= MAX_REVIEWER_SUBJECT_AREAS) break;
  }

  return result;
}

export function filterReviewerAreas(search: string): string[] {
  const q = search.trim().toLowerCase();
  if (!q) return [...REVIEWER_SUBJECT_AREAS];
  return REVIEWER_SUBJECT_AREAS.filter((area) => area.toLowerCase().includes(q));
}

/** Match reviewers against selected area filters (includes legacy specialization). */
export function reviewerMatchesAreaFilter(
  reviewer: { reviewerSubjectAreas?: string[]; specialization?: string },
  areaFilter: string[]
): boolean {
  if (areaFilter.length === 0) return true;

  const reviewerAreas = [
    ...(reviewer.reviewerSubjectAreas ?? []),
    ...(reviewer.specialization ? [reviewer.specialization] : []),
  ].map((a) => a.toLowerCase());

  return areaFilter.some((filter) => {
    const f = filter.toLowerCase();
    return reviewerAreas.some((area) => area.includes(f) || f.includes(area));
  });
}
