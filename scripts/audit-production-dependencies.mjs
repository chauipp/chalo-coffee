#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const evaluateVulnerabilityCounts = (report) => {
  const counts = report?.metadata?.vulnerabilities ?? {};
  return Number(counts.high ?? 0) > 0 || Number(counts.critical ?? 0) > 0;
};

export const auditProductionDependencies = (targets) => {
  let exitCode = 0;

  for (const target of targets) {
    const result = spawnSync(
      'pnpm',
      ['audit', '--prod', '--audit-level=high', '--json'],
      { cwd: resolve(target), encoding: 'utf8' },
    );
    const output = result.stdout.trim();
    let report;

    try {
      report = JSON.parse(output);
    } catch {
      console.error(`Không đọc được báo cáo audit của ${target}.`);
      exitCode = 2;
      continue;
    }

    const counts = report.metadata?.vulnerabilities ?? {};
    console.log(`${target}: high=${Number(counts.high ?? 0)}, critical=${Number(counts.critical ?? 0)}`);
    if (evaluateVulnerabilityCounts(report)) exitCode = 1;
  }

  if (exitCode === 1) console.error('Dependency production còn advisory high hoặc critical.');
  return exitCode;
};

const launchedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (launchedDirectly) {
  const targets = process.argv.slice(2);
  process.exitCode = auditProductionDependencies(
    targets.length > 0 ? targets : ['chalo-be', 'chalo-fe'],
  );
}
