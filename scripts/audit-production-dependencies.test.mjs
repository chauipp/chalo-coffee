import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVulnerabilityCounts } from './audit-production-dependencies.mjs';

test('reports high and critical production advisories as blocking', () => {
  assert.equal(
    evaluateVulnerabilityCounts({ metadata: { vulnerabilities: { high: 1, critical: 0 } } }),
    true,
  );
  assert.equal(
    evaluateVulnerabilityCounts({ metadata: { vulnerabilities: { high: 0, critical: 1 } } }),
    true,
  );
});

test('allows reports with no high or critical production advisory', () => {
  assert.equal(
    evaluateVulnerabilityCounts({ metadata: { vulnerabilities: { high: 0, critical: 0 } } }),
    false,
  );
});
