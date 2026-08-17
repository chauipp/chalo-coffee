#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const packages = process.argv.slice(2);
const targets = packages.length > 0 ? packages : ["chalo-be", "chalo-fe"];
let hasHighRisk = false;

for (const target of targets) {
  const result = spawnSync(
    "pnpm",
    ["audit", "--prod", "--audit-level=high", "--json"],
    { cwd: resolve(target), encoding: "utf8" },
  );
  const output = result.stdout.trim();
  let report;
  try {
    report = JSON.parse(output);
  } catch {
    console.error(`Không đọc được báo cáo audit của ${target}.`);
    process.exitCode = 2;
    continue;
  }

  const counts = report.metadata?.vulnerabilities ?? {};
  const high = Number(counts.high ?? 0);
  const critical = Number(counts.critical ?? 0);
  console.log(`${target}: high=${high}, critical=${critical}`);
  if (high > 0 || critical > 0) hasHighRisk = true;
}

if (hasHighRisk) {
  console.error("Dependency production còn advisory high hoặc critical.");
  process.exitCode = 1;
}
