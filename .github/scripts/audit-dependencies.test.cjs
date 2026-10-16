const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assessAudit, audit } = require('./audit-dependencies.cjs');

function result(counts = {}, status = Object.values(counts).some(Boolean) ? 1 : 0) {
  return { status, stdout: JSON.stringify({ auditReportVersion: 2, vulnerabilities: {},
    metadata: { vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, ...counts } } }) };
}

test('clean scans pass', () => assert.equal(assessAudit(result()).blocked, false));
test('moderate/low findings remain nonblocking', () => assert.equal(assessAudit(result({ moderate: 2, low: 1 })).blocked, false));
test('high and critical findings block', () => {
  for (const severity of ['high', 'critical']) assert.equal(assessAudit(result({ [severity]: 1 })).blocked, true);
});
test('scanner failures fail closed', () => {
  for (const value of [
    { status: 1, stdout: '{invalid' },
    { status: 1, stdout: '{"error":{"code":"ENOTFOUND"}}' },
    { status: 0, stdout: '{"auditReportVersion":2,"metadata":{}}' },
    { ...result(), error: new Error('timeout') },
    { ...result(), signal: 'SIGTERM' },
    { ...result(), status: 2 },
    result({ high: 1 }, 0), result({}, 1), result({ high: -1 }),
  ]) assert.throws(() => assessAudit(value));
});
test('development-only high findings fail while both raw reports are preserved', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-test-'));
  const calls = [];
  try {
    const code = audit({ outputDirectory: directory, summaryFile: path.join(directory, 'summary.md'),
      run: (command, args) => { calls.push([command, args]); return args.includes('--omit=dev') ? result() : result({ high: 1 }); } });
    assert.equal(code, 1); assert.equal(calls.length, 2);
    assert.ok(calls.every(([command, args]) => command === 'npm' && args.includes('--ignore-scripts') && args.includes('--package-lock-only')));
    assert.ok(fs.existsSync(path.join(directory, 'production.json')));
    assert.ok(fs.existsSync(path.join(directory, 'all.json')));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('a scan error is not hidden by a successful second scan', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-test-'));
  try {
    let call = 0;
    assert.equal(audit({ outputDirectory: directory, summaryFile: path.join(directory, 'summary.md'),
      run: () => ++call === 1 ? { status: 1, stdout: '{"error":{}}' } : result() }), 1);
    assert.equal(call, 2);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
