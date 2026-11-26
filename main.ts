// Household Ledger — the hand-in program (Node 22, standard library
// only). It takes the repository's own app/ and screenshots/ and lays
// them out under the output directory, then writes dossier.json: the
// summary the judge reads (screenshots, first-load bytes, source).
// Nothing here fetches, builds or rewrites anything; the site is
// plain static files and the dossier is written by the kit's own
// library, vendor/makefun-frontend.ts, left exactly as shipped.
//
// Run it locally the way the grader does, with MAKEFUN_OUTPUT_DIR
// standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

mkdirSync(outDir, { recursive: true });

// Start from a clean output so a second run writes the same bytes
// as the first: stale files from an earlier run must not linger.
for (const name of ['app', 'screenshots']) {
  const target = join(outDir, name);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}
cpSync(appDir, join(outDir, 'app'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The gate's caps, from the competition's own scorer: at most 4
// screenshots of 256 KiB each, app/ at most 993 files and 16 MiB,
// and the dossier text at most 163,840 bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
