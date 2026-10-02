import { readFileSync } from 'node:fs';
import type { Status } from '@numerology/content';
import { buildLayers } from './build';
import { buildDraftRequest, callClaude } from './draft';
import { setSnippetFields, setSnippetText } from './edit';
import { formatGate, runGate, runPairGate } from './gate';
import { formatReport, lint } from './lint';
import { loadFamilies } from './load';
import { release } from './release';
import { exportSheet, importSheet, REVIEW_FILE } from './sheet';
import { composeFullSnapshot, diffSnapshots, formatDiff, readSavedSnapshot, textHashes, writeSnapshot } from './snapshot';

const [command = 'lint', ...args] = process.argv.slice(2);

function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}
const has = (name: string): boolean => args.includes(`--${name}`);

const USAGE = `Content pipeline

  lint [--family <prefix>]            Check every snippet against the guardrails.
  release [--min-status <status>]     Validate, version and write the static layers.
  snapshot                            Save the composed readings (30 profiles by 20 dates).
  diff [--fail]                       Show which snippets changed and how many readings they touch.
  gate [--level 1|2|3|4]              Check a launch gate from the plan.
  gate --pair [--level 1|2|3]         Check a Between us gate (P1 to P3).
  draft <id> [--run] [--apply]        Build the drafting prompt; with --run call the API.
  sheet export [--family p] [--status s] [--limit n]
  sheet import [file]                 Write an edited review sheet back to the source files.`;

async function main(): Promise<void> {
  switch (command) {
    case 'lint': {
      const filter = flag('family');
      const loaded = loadFamilies().filter((l) => !filter || l.family.id.startsWith(filter));
      const report = lint(loaded);
      console.log(formatReport(report, filter ? 400 : 60));
      process.exit(report.errors.length > 0 ? 1 : 0);
      break;
    }
    case 'release': {
      const minStatus = (flag('min-status') ?? process.env.CONTENT_MIN_STATUS ?? 'draft') as Status;
      release({ minStatus });
      break;
    }
    case 'snapshot': {
      const { readings, snippets } = writeSnapshot(buildLayers());
      console.log(`Saved ${readings} composed readings and ${snippets} snippet hashes.`);
      break;
    }
    case 'diff': {
      const saved = readSavedSnapshot();
      if (!saved) {
        console.log('No snapshot yet. Run: npm run content:snapshot');
        process.exit(has('fail') ? 1 : 0);
      }
      const report = diffSnapshots(saved, { composed: composeFullSnapshot(buildLayers()), hashes: textHashes() });
      console.log(formatDiff(report));
      const dirty = report.changed.length + report.added.length + report.removed.length > 0 || report.readingsChanged > 0;
      process.exit(has('fail') && dirty ? 1 : 0);
      break;
    }
    case 'gate': {
      if (has('pair')) {
        const pairLevel = Number(flag('level') ?? 1) as 1 | 2 | 3;
        const pairResult = runPairGate(pairLevel);
        console.log(formatGate(pairLevel, pairResult, 'Between us gate P'));
        process.exit(pairResult.pass ? 0 : 1);
      }
      const level = Number(flag('level') ?? 1) as 1 | 2 | 3 | 4;
      const result = runGate(level);
      console.log(formatGate(level, result));
      process.exit(result.pass ? 0 : 1);
      break;
    }
    case 'draft': {
      const id = args.find((a) => !a.startsWith('--'));
      if (!id) throw new Error('Give a snippet id, e.g. draft life.core.lifePath.8.shadow');
      const request = buildDraftRequest(id);
      if (!has('run')) {
        console.log(`# system\n${request.system}\n\n# user\n${request.user}`);
        break;
      }
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('Set ANTHROPIC_API_KEY to call the API. Without --run this prints the prompt only.');
      const draft = await callClaude(request, key);
      console.log(draft.text);
      if (has('apply')) {
        if (draft.fields) setSnippetFields(id, draft.fields);
        else setSnippetText(id, draft.text);
        console.log(`\nWritten to ${id} as a draft. Run lint, then review it.`);
      }
      break;
    }
    case 'sheet': {
      const [sub, file] = args;
      if (sub === 'export') {
        const n = exportSheet({ family: flag('family'), status: flag('status') as Status | undefined, limit: flag('limit') ? Number(flag('limit')) : undefined });
        console.log(`Wrote ${n} rows to ${REVIEW_FILE}`);
      } else if (sub === 'import') {
        const result = importSheet(readFileSync(file ?? REVIEW_FILE, 'utf8'), has('dry-run'));
        console.log(`${result.textChanged.length} texts and ${result.statusChanged.length} statuses updated, ${result.unknown.length} unknown rows.`);
      } else {
        console.log(USAGE);
      }
      break;
    }
    default:
      console.log(USAGE);
      process.exit(command === 'help' ? 0 : 2);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
