import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatOutput } from '../formatter.js';
import { NeteaseAPI } from '../http.js';
import { NETEASE_PIPELINE_STEP_TYPES } from '../pipeline/builtins.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';
import { createSmtcService } from '../services/smtc.js';

interface DoctorCheck {
  name: string;
  ok: boolean;
  detail?: string;
}

function packageRoot(): string {
  const starts = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  for (const start of starts) {
    let current = resolve(start);
    for (let depth = 0; depth < 5; depth++) {
      const packagePath = join(current, 'package.json');
      if (existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
          if (pkg.name === 'netease-music-cli') return current;
        } catch {
          return current;
        }
      }
      const next = resolve(current, '..');
      if (next === current) break;
      current = next;
    }
  }
  return process.cwd();
}

function checkDocs(root: string): DoctorCheck {
  const indexPath = join(root, 'docs', 'reference', 'index.md');
  if (!existsSync(indexPath)) return { name: 'docs reference index', ok: false, detail: 'missing docs/reference/index.md' };
  const content = readFileSync(indexPath, 'utf-8');
  const links = [...content.matchAll(/\]\(([^)]+\.md)\)/g)].map(match => match[1]);
  const missing = links.filter(link => !existsSync(join(root, 'docs', 'reference', link)));
  return {
    name: 'docs reference links',
    ok: missing.length === 0,
    detail: missing.length === 0 ? `${links.length} links checked` : `missing: ${missing.join(', ')}`,
  };
}

export const doctorCommand: Command = {
  name: 'doctor',
  description: 'Check CLI installation, auth, public API, pipeline, and docs health',
  usage: 'nm doctor',
  permission: 'public',
  capability: 'doctor',
  returns: 'DoctorReport',
  options: [],
  examples: ['nm doctor', 'nm doctor --output json'],
  async run(config, flags) {
    const root = packageRoot();
    const checks: DoctorCheck[] = [];

    checks.push({
      name: 'dist binary',
      ok: existsSync(join(root, 'dist', 'netease-music.mjs')),
      detail: 'expected dist/netease-music.mjs after build',
    });

    const api = new NeteaseAPI(config);
    checks.push({
      name: 'cookie file',
      ok: Boolean(api.getCookie()),
      detail: api.getCookie() ? 'cookie loaded' : `not logged in or missing ${config.cookieFile}`,
    });

    try {
      const result = await createNeteaseServices(config).music.getInfo([186016]);
      checks.push({ name: 'public api', ok: result.data.length > 0, detail: 'music info smoke check' });
    } catch (err) {
      checks.push({ name: 'public api', ok: false, detail: err instanceof Error ? err.message : String(err) });
    }

    checks.push({
      name: 'pipeline builtins',
      ok: NETEASE_PIPELINE_STEP_TYPES.length >= 9,
      detail: NETEASE_PIPELINE_STEP_TYPES.join(', '),
    });

    const smtcService = createSmtcService();
    checks.push({
      name: 'smtc helper',
      ok: smtcService.helperExists(),
      detail: smtcService.helperExists()
        ? `found ${smtcService.getHelperPath()}`
        : `missing ${smtcService.getHelperPath()} (run npm run build:smtc on Windows)`,
    });

    checks.push(checkDocs(root));

    const report = {
      ok: checks.every(check => check.ok),
      packageRoot: root,
      stateDir: config.stateDir,
      checks,
    };

    if ((flags.output || config.output) === 'json') {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      return;
    }

    for (const check of checks) {
      process.stdout.write(`${check.ok ? 'OK' : 'WARN'} ${check.name}: ${check.detail || ''}\n`);
    }
    process.stdout.write(`\nOverall: ${report.ok ? 'OK' : 'needs attention'}\n`);
  },
};
