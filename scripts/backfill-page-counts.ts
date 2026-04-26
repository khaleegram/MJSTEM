import { config as loadEnv } from 'dotenv';

type Options = {
  dryRun: boolean;
  all: boolean;
  limit: number | null;
};

loadEnv({ path: '.env.local', override: false });
loadEnv({ path: '.env', override: false });

function parseArgs(argv: string[]): Options {
  const dryRun = argv.includes('--dry-run');
  const all = argv.includes('--all');

  let limit: number | null = null;
  const limitArg = argv.find((arg) => arg.startsWith('--limit='));
  if (limitArg) {
    const parsed = Number(limitArg.split('=')[1]);
    if (Number.isInteger(parsed) && parsed > 0) {
      limit = parsed;
    }
  }

  return { dryRun, all, limit };
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

async function main() {
  const { adminDb, firebaseProjectId } = await import('../src/lib/firebase-admin');
  const { extractDocxPageCount } = await import('../src/ai/flows/extract-docx-page-count');
  const options = parseArgs(process.argv.slice(2));

  if (!adminDb) {
    console.error(
      '[Backfill Page Count] Firebase Admin Firestore is not available. Configure service account env vars first.'
    );
    process.exit(1);
  }

  console.log(
    `[Backfill Page Count] Starting (dryRun=${options.dryRun}, all=${options.all}, limit=${
      options.limit ?? 'none'
    }, project=${firebaseProjectId || 'unknown'})`
  );

  const snapshot = await adminDb.collection('submissions').get();
  const docs = snapshot.docs;
  console.log(`[Backfill Page Count] Loaded ${docs.length} submissions.`);

  let scanned = 0;
  let eligible = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const manuscriptUrl = typeof data.manuscriptUrl === 'string' ? data.manuscriptUrl : '';
    const currentPageCount = data.pageCount;

    scanned += 1;

    if (!manuscriptUrl) {
      skipped += 1;
      continue;
    }

    if (!options.all && isPositiveInt(currentPageCount)) {
      skipped += 1;
      continue;
    }

    eligible += 1;

    if (options.limit && eligible > options.limit) {
      break;
    }

    try {
      const detected = await extractDocxPageCount({ fileUrl: manuscriptUrl });
      if (!isPositiveInt(detected)) {
        console.log(`[Backfill Page Count] ${docSnap.id}: no page count detected.`);
        continue;
      }

      if (isPositiveInt(currentPageCount) && currentPageCount === detected) {
        console.log(`[Backfill Page Count] ${docSnap.id}: already ${detected}, unchanged.`);
        continue;
      }

      if (options.dryRun) {
        console.log(
          `[Backfill Page Count][DRY RUN] ${docSnap.id}: would set pageCount=${detected} (was ${
            isPositiveInt(currentPageCount) ? currentPageCount : 'unset'
          }).`
        );
      } else {
        await docSnap.ref.update({ pageCount: detected });
        console.log(
          `[Backfill Page Count] ${docSnap.id}: set pageCount=${detected} (was ${
            isPositiveInt(currentPageCount) ? currentPageCount : 'unset'
          }).`
        );
      }

      updated += 1;
    } catch (error) {
      failed += 1;
      console.error(`[Backfill Page Count] ${docSnap.id}: failed`, error);
    }
  }

  console.log('[Backfill Page Count] Done.');
  console.log(
    `[Backfill Page Count] Summary: scanned=${scanned}, eligible=${eligible}, updated=${updated}, skipped=${skipped}, failed=${failed}`
  );
}

main().catch((error) => {
  console.error('[Backfill Page Count] Fatal error:', error);
  process.exit(1);
});
